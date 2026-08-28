import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import {
  db,
  readContent,
  writeContent,
  readSettings,
  writeSettings,
  bootstrapData
} from '../db.js';

try {
  await bootstrapData();
} catch (err) {
  console.error('Failed to bootstrap database:', err);
}

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'ria-iqram-wedding-magic-secret-key-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminria2026';

app.use(express.json());
app.use(cookieParser());

const uploadDir = path.join(process.cwd(), 'public', 'images');

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

interface LimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, LimitRecord>();

function rateLimiter(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimits.get(key);
    if (!record || now > record.resetTime) {
      rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    record.count += 1;
    if (record.count > limit) {
      return res.status(429).json({ error: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.' });
    }
    next();
  };
}

interface AuditLog {
  timestamp: string;
  action: string;
  details: string;
}
const auditLogs: AuditLog[] = [];
function addAuditLog(action: string, details: string) {
  const log = { timestamp: new Date().toISOString(), action, details };
  auditLogs.unshift(log);
  if (auditLogs.length > 500) auditLogs.pop();
}

interface AdminPayload {
  role: string;
}
function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies.token;
  if (!token) return res.status(410).json({ error: 'Sesi habis atau tidak sah' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (decoded && decoded.role === 'admin') return next();
    return res.status(403).json({ error: 'Hak akses tidak sah' });
  } catch {
    return res.status(401).json({ error: 'Sesi kedaluwarsa, silakan login kembali' });
  }
}

function generateCustomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.get('/api/public/content', async (req, res) => {
  try {
    const content = await readContent();
    const settings = await readSettings();
    res.json({ content, settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat konten: ' + err.message });
  }
});

app.get('/api/public/invitation/:code', rateLimiter(100, 60000), async (req, res) => {
  const { code } = req.params;
  try {
    const guestRs = await db.execute({ sql: 'SELECT * FROM guests WHERE code = ?', args: [code.toUpperCase()] });
    const guest = guestRs.rows[0] as any;
    if (!guest) return res.status(404).json({ error: 'Kode undangan tidak ditemukan' });
    if (guest.status_active === 0) return res.status(403).json({ error: 'Undangan ini dinonaktifkan sementara oleh admin' });

    const updatedCount = (guest.opened_count || 0) + 1;
    const nowISO = new Date().toISOString();
    await db.execute({ sql: 'UPDATE guests SET opened_count = ?, last_opened_at = ? WHERE id = ?', args: [updatedCount, nowISO, guest.id] });

    const commentsRs = await db.execute({
      sql: `SELECT id, name, comment, created_at FROM rsvp_comments WHERE is_approved = 1 ORDER BY id DESC`,
      args: []
    });

    const content = await readContent();
    const settings = await readSettings();

    res.json({
      success: true,
      guest: {
        id: guest.id,
        code: guest.code,
        name: guest.name,
        category: guest.category,
        whatsapp: guest.whatsapp,
        status: guest.status,
        guest_count: guest.guest_count,
        opened_count: updatedCount,
        last_opened_at: nowISO,
        status_active: guest.status_active
      },
      comments: commentsRs.rows,
      content,
      settings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses undangan: ' + err.message });
  }
});

app.post('/api/public/invitation/:code/rsvp', rateLimiter(10, 60000), async (req, res) => {
  const { code } = req.params;
  const { status, guest_count, name, comment, honeypot } = req.body;

  if (honeypot) return res.status(400).json({ error: 'Deteksi spam teraktivasi!' });
  if (!status || !['hadir', 'tidak_hadir'].includes(status)) return res.status(400).json({ error: 'Status kehadiran tidak valid' });

  const numGuest = parseInt(guest_count) || 1;
  const username = (name || '').trim();
  const msg = (comment || '').trim();

  try {
    const guestRs = await db.execute({ sql: 'SELECT * FROM guests WHERE code = ?', args: [code.toUpperCase()] });
    const guest = guestRs.rows[0] as any;
    if (!guest) return res.status(404).json({ error: 'Kode undangan tidak valid' });

    await db.execute({ sql: 'UPDATE guests SET status = ?, guest_count = ? WHERE id = ?', args: [status, numGuest, guest.id] });

    if (msg.length > 0) {
      const existingRs = await db.execute({ sql: 'SELECT id FROM rsvp_comments WHERE guest_id = ?', args: [guest.id] });
      const existing = existingRs.rows[0] as any;
      const stamp = new Date().toISOString();
      const displayName = username || guest.name;

      if (existing) {
        await db.execute({ sql: 'UPDATE rsvp_comments SET name = ?, comment = ?, created_at = ? WHERE id = ?', args: [displayName, msg, stamp, existing.id] });
      } else {
        await db.execute({ sql: 'INSERT INTO rsvp_comments (guest_id, name, comment, created_at) VALUES (?, ?, ?, ?)', args: [guest.id, displayName, msg, stamp] });
      }
    }

    const commentsRs = await db.execute({
      sql: `SELECT id, name, comment, created_at FROM rsvp_comments WHERE is_approved = 1 ORDER BY id DESC`,
      args: []
    });

    res.json({
      success: true,
      message: 'Konfirmasi kehadiran berhasil disimpan',
      guestStatus: status,
      guestCount: numGuest,
      comments: commentsRs.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses RSVP: ' + err.message });
  }
});

app.get('/api/public/comments', async (req, res) => {
  try {
    const rs = await db.execute({
      sql: `SELECT id, name, comment, created_at FROM rsvp_comments WHERE is_approved = 1 ORDER BY id DESC`,
      args: []
    });
    res.json({ success: true, comments: rs.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil ucapan: ' + err.message });
  }
});

app.post('/api/admin-undangan-ria-iqram/login', rateLimiter(5, 60000), (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Kata sandi dibutuhkan' });
  if (password !== ADMIN_PASSWORD) {
    addAuditLog('LOGIN_FAILED', 'Percobaan login gagal sandi salah');
    return res.status(401).json({ error: 'Kata sandi salah' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  addAuditLog('LOGIN_SUCCESS', 'Admin sukses login ke dashboard');
  res.json({ success: true, message: 'Masuk berhasil' });
});

app.post('/api/admin-undangan-ria-iqram/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Keluar berhasil' });
});

app.get('/api/admin-undangan-ria-iqram/verify', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ authenticated: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (decoded && decoded.role === 'admin') return res.json({ authenticated: true });
    return res.json({ authenticated: false });
  } catch {
    res.json({ authenticated: false });
  }
});

app.get('/api/admin-undangan-ria-iqram/images', authenticateAdmin, (req, res) => {
  try {
    let images: { name: string; url: string }[] = [];

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      });

      images = files.map((file) => {
        const url = `/images/${file}`;
        return { name: file, url };
      });
    }

    res.json({ success: true, images });
  } catch (err: any) {
    console.error('Failed to load images:', err);
    res.status(500).json({ error: 'Gagal memuat galeri gambar: ' + err.message });
  }
});

app.get('/api/admin-undangan-ria-iqram/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalsRs = await db.execute({ sql: 'SELECT COUNT(*) as total, SUM(opened_count) as total_opens FROM guests', args: [] });
    const totals = totalsRs.rows[0] as any;

    const rsvpStatsRs = await db.execute({
      sql: `SELECT status, COUNT(*) as count, SUM(guest_count) as total_guests FROM guests GROUP BY status`,
      args: []
    });
    const rsvpStats = rsvpStatsRs.rows as any[];

    const activeCommentsRs = await db.execute({ sql: 'SELECT COUNT(*) as comments FROM rsvp_comments', args: [] });
    const activeComments = activeCommentsRs.rows[0] as any;

    let totalInvited = totals.total || 0;
    let openedCount = totals.total_opens || 0;
    let totalHadirTamu = 0;
    let countHadir = 0;
    let countTidakHadir = 0;
    let countBelumRespon = 0;

    for (const stat of rsvpStats) {
      if (stat.status === 'hadir') {
        countHadir = stat.count;
        totalHadirTamu = stat.total_guests || 0;
      } else if (stat.status === 'tidak_hadir') {
        countTidakHadir = stat.count;
      } else if (stat.status === 'belum_respon') {
        countBelumRespon = stat.count;
      }
    }

    res.json({
      totalInvited,
      openedCount,
      countHadir,
      totalHadirTamu,
      countTidakHadir,
      countBelumRespon,
      totalComments: activeComments.comments,
      auditLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat statistik: ' + err.message });
  }
});

app.get('/api/admin-undangan-ria-iqram/guests', authenticateAdmin, async (req, res) => {
  try {
    const rs = await db.execute({ sql: 'SELECT * FROM guests ORDER BY id DESC', args: [] });
    res.json({ success: true, guests: rs.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat tamu: ' + err.message });
  }
});

app.post('/api/admin-undangan-ria-iqram/guests', authenticateAdmin, async (req, res) => {
  const { name, category, whatsapp } = req.body;
  if (!name || name.trim() === '') return res.status(400).json({ error: 'Nama tamu tidak boleh kosong' });

  try {
    let code = generateCustomCode();
    let isDupe = true;
    while (isDupe) {
      const rs = await db.execute({ sql: 'SELECT id FROM guests WHERE code = ?', args: [code] });
      isDupe = rs.rows.length > 0;
      if (isDupe) code = generateCustomCode();
    }

    const cleanedWA = (whatsapp || '').trim().replace(/[^0-9]/g, '');
    const infoRs = await db.execute({ sql: 'INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)', args: [code, name.trim(), (category || 'Umum').trim(), cleanedWA] });
    const id = Number(infoRs.lastInsertRowid);

    addAuditLog('GUEST_CREATED', `Tamu '${name}' berhasil didaftarkan (Code: ${code})`);
    res.json({
      success: true,
      guest: { id, code, name: name.trim(), category: category || 'Umum', whatsapp: cleanedWA, status: 'belum_respon', guest_count: 0, opened_count: 0 }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat tamu: ' + err.message });
  }
});

app.post('/api/admin-undangan-ria-iqram/guests/bulk', authenticateAdmin, async (req, res) => {
  const { guests } = req.body;
  if (!Array.isArray(guests) || guests.length === 0) return res.status(400).json({ error: 'Data bulk tamu tidak valid atau kosong' });

  try {
    const insertedGuests: any[] = [];
    for (const item of guests) {
      if (!item.name || item.name.trim() === '') continue;

      let code = generateCustomCode();
      let isDupe = true;
      while (isDupe) {
        const rs = await db.execute({ sql: 'SELECT id FROM guests WHERE code = ?', args: [code] });
        isDupe = rs.rows.length > 0;
        if (isDupe) code = generateCustomCode();
      }

      const cleanedWA = (item.whatsapp || '').toString().trim().replace(/[^0-9]/g, '');
      const infoRs = await db.execute({ sql: 'INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)', args: [code, item.name.trim(), (item.category || 'Umum').trim(), cleanedWA] });

      insertedGuests.push({
        id: Number(infoRs.lastInsertRowid),
        code,
        name: item.name.trim(),
        category: item.category || 'Umum',
        whatsapp: cleanedWA,
        status: 'belum_respon',
        guest_count: 0,
        opened_count: 0
      });
    }

    addAuditLog('BULK_GUESTS_CREATED', `Sebanyak ${insertedGuests.length} tamu berhasil diimpor sekaligus`);
    res.json({ success: true, count: insertedGuests.length, guests: insertedGuests });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengimpor tamu secara bulk: ' + err.message });
  }
});

app.put('/api/admin-undangan-ria-iqram/guests/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, category, whatsapp, status, guest_count, status_active } = req.body;

  if (!name || name.trim() === '') return res.status(400).json({ error: 'Nama tamu tidak boleh kosong' });

  try {
    const cleanedWA = (whatsapp || '').trim().replace(/[^0-9]/g, '');
    const numGuest = parseInt(guest_count) || 0;
    const activeVal = status_active !== undefined ? (status_active ? 1 : 0) : 1;

    const result = await db.execute({
      sql: `UPDATE guests SET name = ?, category = ?, whatsapp = ?, status = ?, guest_count = ?, status_active = ? WHERE id = ?`,
      args: [name.trim(), category || 'Umum', cleanedWA, status || 'belum_respon', numGuest, activeVal, id]
    });

    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Tamu tidak ditemukan' });

    addAuditLog('GUEST_UPDATED', `Tamu ID ${id} '${name}' telah diperbarui`);
    res.json({ success: true, message: 'Tamu berhasil diperbarui' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui tamu' + err.message });
  }
});

app.delete('/api/admin-undangan-ria-iqram/guests/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const gRs = await db.execute({ sql: 'SELECT name FROM guests WHERE id = ?', args: [id] });
    const g = gRs.rows[0] as any;
    const name = g ? g.name : `ID ${id}`;

    const info = await db.execute({ sql: 'DELETE FROM guests WHERE id = ?', args: [id] });
    if (info.rowsAffected === 0) return res.status(404).json({ error: 'Tamu tidak ditemukan' });

    addAuditLog('GUEST_DELETED', `Menghapus undangan untuk ${name}`);
    res.json({ success: true, message: 'Tamu sukses dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus tamu: ' + err.message });
  }
});

app.get('/api/admin-undangan-ria-iqram/comments', authenticateAdmin, async (req, res) => {
  try {
    const rs = await db.execute({
      sql: `SELECT rc.id, rc.name, rc.comment, rc.is_approved, rc.created_at, g.code FROM rsvp_comments rc LEFT JOIN guests g ON rc.guest_id = g.id ORDER BY rc.id DESC`,
      args: []
    });
    res.json({ success: true, comments: rs.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat ucapan: ' + err.message });
  }
});

app.put('/api/admin-undangan-ria-iqram/comments/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;
  try {
    const appVal = is_approved ? 1 : 0;
    const result = await db.execute({ sql: 'UPDATE rsvp_comments SET is_approved = ? WHERE id = ?', args: [appVal, id] });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Komentar tidak ditemukan' });

    addAuditLog('COMMENT_MODERATED', `Ucapan ID ${id} diubah status persetujuan menjadi ${is_approved}`);
    res.json({ success: true, message: 'Status persetujuan ucapan berhasil diubah' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memodifikasi ucapan: ' + err.message });
  }
});

app.delete('/api/admin-undangan-ria-iqram/comments/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({ sql: 'DELETE FROM rsvp_comments WHERE id = ?', args: [id] });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Ucapan tidak ditemukan' });

    addAuditLog('COMMENT_DELETED', `Ucapan ID ${id} dihapus dari buku tamu`);
    res.json({ success: true, message: 'Ucapan berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus ucapan: ' + err.message });
  }
});

app.put('/api/admin-undangan-ria-iqram/settings', authenticateAdmin, async (req, res) => {
  try {
    await writeSettings(req.body);
    addAuditLog('SETTINGS_UPDATED', 'Pengaturan musik dan template WhatsApp diperbarui');
    res.json({ success: true, message: 'Pengaturan berhasil disimpan!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan pengaturan: ' + err.message });
  }
});

app.put('/api/admin-undangan-ria-iqram/content', authenticateAdmin, async (req, res) => {
  try {
    await writeContent(req.body);
    addAuditLog('CONTENT_UPDATED', 'Detail pengantin, header, dan rundown acara diperbarui');
    res.json({ success: true, message: 'Detail acara berhasil disimpan!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan konten: ' + err.message });
  }
});

app.get('/api/admin-undangan-ria-iqram/audit-logs', authenticateAdmin, (req, res) => {
  res.json({ success: true, logs: auditLogs });
});

export default app;
