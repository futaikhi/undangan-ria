import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import {
  db,
  readContent,
  writeContent,
  readSettings,
  writeSettings,
  backupRSVP
} from './db';

const app = express();
const PORT = 3000;

// Configuration fallback
const JWT_SECRET = process.env.JWT_SECRET || 'ria-iqram-wedding-magic-secret-key-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminria2026';

// Middleware
app.use(express.json());
app.use(cookieParser());

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// In-Memory Rate Limiting for Security
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
      rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    record.count += 1;
    if (record.count > limit) {
      return res.status(429).json({
        error: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.'
      });
    }

    next();
  };
}

// In-Memory Audit Logs
interface AuditLog {
  timestamp: string;
  action: string;
  details: string;
}
const auditLogs: AuditLog[] = [];
function addAuditLog(action: string, details: string) {
  const log = {
    timestamp: new Date().toISOString(),
    action,
    details
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 500) auditLogs.pop(); // Keep last 500
}

// Verification Middleware
interface AdminPayload {
  role: string;
}
function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(410).json({ error: 'Sesi habis atau tidak sah' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (decoded && decoded.role === 'admin') {
      return next();
    }
    return res.status(403).json({ error: 'Hak akses tidak sah' });
  } catch (error) {
    return res.status(401).json({ error: 'Sesi kedaluwarsa, silakan login kembali' });
  }
}

// Helper to generate a random invitation code
function generateCustomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No visually ambiguous characters like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// Get static config settings & text content
app.get('/api/public/content', (req, res) => {
  try {
    const content = readContent();
    const settings = readSettings();
    res.json({ content, settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat konten: ' + err.message });
  }
});

// Read single invitation details
app.get('/api/public/invitation/:code', rateLimiter(100, 60000), (req, res) => {
  const { code } = req.params;
  try {
    const guest = db.prepare('SELECT * FROM guests WHERE code = ?').get(code.toUpperCase()) as any;
    if (!guest) {
      return res.status(404).json({ error: 'Kode undangan tidak ditemukan' });
    }

    if (guest.status_active === 0) {
      return res.status(403).json({ error: 'Undangan ini dinonaktifkan sementara oleh admin' });
    }

    // Update opened stats
    const updatedCount = (guest.opened_count || 0) + 1;
    const nowISO = new Date().toISOString();
    db.prepare('UPDATE guests SET opened_count = ?, last_opened_at = ? WHERE id = ?')
      .run(updatedCount, nowISO, guest.id);

    // Fetch public comments
    const comments = db.prepare(`
      SELECT id, name, comment, created_at
      FROM rsvp_comments
      WHERE is_approved = 1
      ORDER BY id DESC
    `).all();

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
      comments,
      content: readContent(),
      settings: readSettings()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses undangan: ' + err.message });
  }
});

// Update guest RSVP & Leave Message (Buku Tamu)
app.post('/api/public/invitation/:code/rsvp', rateLimiter(10, 60000), (req, res) => {
  const { code } = req.params;
  const { status, guest_count, name, comment, honeypot } = req.body;

  // Spam detection via Honeypot field
  if (honeypot) {
    return res.status(400).json({ error: 'Deteksi spam teraktivasi!' });
  }

  if (!status || !['hadir', 'tidak_hadir'].includes(status)) {
    return res.status(400).json({ error: 'Status kehadiran tidak valid' });
  }

  const numGuest = parseInt(guest_count) || 1;
  const username = (name || '').trim();
  const msg = (comment || '').trim();

  try {
    const guest = db.prepare('SELECT * FROM guests WHERE code = ?').get(code.toUpperCase()) as any;
    if (!guest) {
      return res.status(404).json({ error: 'Kode undangan tidak valid' });
    }

    // Update guest RSVP status in DB
    db.prepare('UPDATE guests SET status = ?, guest_count = ? WHERE id = ?')
      .run(status, numGuest, guest.id);

    // If a guest leaves a comment, manage it in table
    if (msg.length > 0) {
      // Check if they already left a comment, to update it or create a new one
      const existing = db.prepare('SELECT id FROM rsvp_comments WHERE guest_id = ?').get(guest.id) as any;
      const stamp = new Date().toISOString();
      const displayName = username || guest.name;

      if (existing) {
        db.prepare('UPDATE rsvp_comments SET name = ?, comment = ?, created_at = ? WHERE id = ?')
          .run(displayName, msg, stamp, existing.id);
      } else {
        db.prepare('INSERT INTO rsvp_comments (guest_id, name, comment, created_at) VALUES (?, ?, ?, ?)')
          .run(guest.id, displayName, msg, stamp);
      }
    }

    // Sync database backup
    backupRSVP();

    // Fetch refreshed comments feed
    const comments = db.prepare(`
      SELECT id, name, comment, created_at
      FROM rsvp_comments
      WHERE is_approved = 1
      ORDER BY id DESC
    `).all();

    res.json({
      success: true,
      message: 'Konfirmasi kehadiran berhasil disimpan',
      guestStatus: status,
      guestCount: numGuest,
      comments
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses RSVP: ' + err.message });
  }
});

// Fetch all approved comments for general viewing
app.get('/api/public/comments', (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT id, name, comment, created_at
      FROM rsvp_comments
      WHERE is_approved = 1
      ORDER BY id DESC
    `).all();
    res.json({ success: true, comments });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil ucapan: ' + err.message });
  }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

// Authenticate Admin Credentials
app.post('/api/admin/login', rateLimiter(5, 60000), (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Kata sandi dibutuhkan' });
  }

  if (password !== ADMIN_PASSWORD) {
    addAuditLog('LOGIN_FAILED', `Percobaan login gagal sandi salah`);
    return res.status(401).json({ error: 'Kata sandi salah' });
  }

  // Create JWT Admin Token
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

  // Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  addAuditLog('LOGIN_SUCCESS', 'Admin sukses login ke dashboard');
  res.json({ success: true, message: 'Masuk berhasil' });
});

// Destroy cookie session
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Keluar berhasil' });
});

// Verify state of token
app.get('/api/admin/verify', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ authenticated: false });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (decoded && decoded.role === 'admin') {
      return res.json({ authenticated: true });
    }
    return res.json({ authenticated: false });
  } catch {
    res.json({ authenticated: false });
  }
});

// ==========================================
// PROTECTED ADMIN API ENDPOINTS
// ==========================================

// Analytics Statistics API
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  try {
    const totals = db.prepare('SELECT COUNT(*) as total, SUM(opened_count) as total_opens FROM guests').get() as any;
    const rsvpStats = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(guest_count) as total_guests
      FROM guests
      GROUP BY status
    `).all() as any[];

    const activeComments = db.prepare('SELECT COUNT(*) as comments FROM rsvp_comments').get() as any;

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

// GET All Guests List
app.get('/api/admin/guests', authenticateAdmin, (req, res) => {
  try {
    const guests = db.prepare('SELECT * FROM guests ORDER BY id DESC').all();
    res.json({ success: true, guests });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat tamu: ' + err.message });
  }
});

// POST Create Guest Invitation
app.post('/api/admin/guests', authenticateAdmin, (req, res) => {
  const { name, category, whatsapp } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nama tamu tidak boleh kosong' });
  }

  try {
    let code = generateCustomCode();
    // Safety check for duplicate code (extremely rare)
    let isDupe = db.prepare('SELECT id FROM guests WHERE code = ?').get(code);
    while (isDupe) {
      code = generateCustomCode();
      isDupe = db.prepare('SELECT id FROM guests WHERE code = ?').get(code);
    }

    const cleanedWA = (whatsapp || '').trim().replace(/[^0-9]/g, '');

    const info = db.prepare('INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)')
      .run(code, name.trim(), (category || 'Umum').trim(), cleanedWA);

    addAuditLog('GUEST_CREATED', `Tamu '${name}' berhasil didaftarkan (Code: ${code})`);
    res.json({
      success: true,
      guest: {
        id: info.lastInsertRowid,
        code,
        name: name.trim(),
        category: category || 'Umum',
        whatsapp: cleanedWA,
        status: 'belum_respon',
        guest_count: 0,
        opened_count: 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat tamu: ' + err.message });
  }
});

// POST Bulk Create Guests
app.post('/api/admin/guests/bulk', authenticateAdmin, (req, res) => {
  const { guests } = req.body; // Array of { name, category, whatsapp }
  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ error: 'Data bulk tamu tidak valid atau kosong' });
  }

  try {
    const insert = db.prepare('INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)');
    const insertedGuests: any[] = [];

    // Run transaction
    const runBulk = db.transaction(() => {
      for (const item of guests) {
        if (!item.name || item.name.trim() === '') continue;

        let code = generateCustomCode();
        let isDupe = db.prepare('SELECT id FROM guests WHERE code = ?').get(code);
        while (isDupe) {
          code = generateCustomCode();
          isDupe = db.prepare('SELECT id FROM guests WHERE code = ?').get(code);
        }

        const cleanedWA = (item.whatsapp || '').toString().trim().replace(/[^0-9]/g, '');
        const resInsert = insert.run(code, item.name.trim(), (item.category || 'Umum').trim(), cleanedWA);

        insertedGuests.push({
          id: resInsert.lastInsertRowid,
          code,
          name: item.name.trim(),
          category: item.category || 'Umum',
          whatsapp: cleanedWA,
          status: 'belum_respon',
          guest_count: 0,
          opened_count: 0
        });
      }
    });

    runBulk();
    addAuditLog('BULK_GUESTS_CREATED', `Sebanyak ${insertedGuests.length} tamu berhasil diimpor sekaligus`);
    res.json({ success: true, count: insertedGuests.length, guests: insertedGuests });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengimpor tamu secara bulk: ' + err.message });
  }
});

// PUT Update Guest Invitation
app.put('/api/admin/guests/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { name, category, whatsapp, status, guest_count, status_active } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nama tamu tidak boleh kosong' });
  }

  try {
    const cleanedWA = (whatsapp || '').trim().replace(/[^0-9]/g, '');
    const numGuest = parseInt(guest_count) || 0;
    const activeVal = status_active !== undefined ? (status_active ? 1 : 0) : 1;

    const result = db.prepare(`
      UPDATE guests
      SET name = ?, category = ?, whatsapp = ?, status = ?, guest_count = ?, status_active = ?
      WHERE id = ?
    `).run(name.trim(), category || 'Umum', cleanedWA, status || 'belum_respon', numGuest, activeVal, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    addAuditLog('GUEST_UPDATED', `Tamu ID ${id} '${name}' telah diperbarui`);
    backupRSVP();

    res.json({ success: true, message: 'Tamu berhasil diperbarui' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui tamu' + err.message });
  }
});

// DELETE Guest Invitation
app.delete('/api/admin/guests/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const g = db.prepare('SELECT name FROM guests WHERE id = ?').get(id) as any;
    const name = g ? g.name : `ID ${id}`;

    const info = db.prepare('DELETE FROM guests WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    addAuditLog('GUEST_DELETED', `Menghapus undangan untuk ${name}`);
    backupRSVP();

    res.json({ success: true, message: 'Tamu sukses dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus tamu: ' + err.message });
  }
});

// GET Comments List (Book of Guest Messages)
app.get('/api/admin/comments', authenticateAdmin, (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT rc.id, rc.name, rc.comment, rc.is_approved, rc.created_at, g.code
      FROM rsvp_comments rc
      LEFT JOIN guests g ON rc.guest_id = g.id
      ORDER BY rc.id DESC
    `).all();
    res.json({ success: true, comments });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat ucapan: ' + err.message });
  }
});

// PUT Moderate Comments (Approve/Reject)
app.put('/api/admin/comments/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;

  try {
    const appVal = is_approved ? 1 : 0;
    const result = db.prepare('UPDATE rsvp_comments SET is_approved = ? WHERE id = ?').run(appVal, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan' });
    }

    addAuditLog('COMMENT_MODERATED', `Ucapan ID ${id} diubah status persetujuan menjadi ${is_approved}`);
    res.json({ success: true, message: 'Status persetujuan ucapan berhasil diubah' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memodifikasi ucapan: ' + err.message });
  }
});

// DELETE Guestbook Comment
app.delete('/api/admin/comments/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const result = db.prepare('DELETE FROM rsvp_comments WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ucapan tidak ditemukan' });
    }

    addAuditLog('COMMENT_DELETED', `Ucapan ID ${id} dihapus dari buku tamu`);
    res.json({ success: true, message: 'Ucapan berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus ucapan: ' + err.message });
  }
});

// PUT Edit Settings
app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    writeSettings(req.body);
    addAuditLog('SETTINGS_UPDATED', 'Pengaturan musik dan template WhatsApp diperbarui');
    res.json({ success: true, message: 'Pengaturan berhasil disimpan!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan pengaturan: ' + err.message });
  }
});

// PUT Edit Content
app.put('/api/admin/content', authenticateAdmin, (req, res) => {
  try {
    writeContent(req.body);
    addAuditLog('CONTENT_UPDATED', 'Detail pengantin, quote, dan rundown acara diperbarui');
    res.json({ success: true, message: 'Detail acara berhasil disimpan!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan konten: ' + err.message });
  }
});

// GET Express app Audit Logs
app.get('/api/admin/audit-logs', authenticateAdmin, (req, res) => {
  res.json({ success: true, logs: auditLogs });
});

// ==========================================
// VITE OR STATIC BUILD MIDDLEWARE
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ria-iqram-wedding] Server safely active on http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone Express server if we are NOT on Vercel
if (!process.env.VERCEL) {
  start();
}

export default app;

