import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import nodemailer, { Transporter } from 'nodemailer';
import { Jimp } from 'jimp';
import { createHmac } from 'crypto';
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Guest data encoded as a signed JSON envelope inside the QR.
// Format: base64url(JSON).hmac — the handler verifies the HMAC
// signature with the shared JWT_SECRET before trusting the data,
// then base64url-decodes the payload back into JSON.
function buildCheckinPayload(guest: any): string {
  const data = JSON.stringify({
    code: guest.code,
    name: guest.name,
    category: guest.category || 'Umum',
    guestCount: parseInt(guest.guest_count) || 1
  });
  const payloadB64 = Buffer.from(data).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64url').slice(0, 16);
  return `${payloadB64}.${sig}`;
}

function buildCheckinUrl(data: string, settings: any): string {
  const base = ((settings?.checkin?.baseUrl || '') as string).trim().replace(/\/+$/, '');
  if (base) return `${base}#ticket=${encodeURIComponent(data)}`;
  return data;
}

// Render a themed QR with rounded module corners (Javanese wedding palette:
// deep batik brown on warm cream). Modules merge into pill-shaped strips so
// connected runs read as soft rounded blocks, matching the site's rounded UI.
function renderRoundedQrJimp(text: string, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const matrix = qr.modules as unknown as { size: number; data: Uint8Array };
  const n = matrix.size;
  const quiet = 2;
  const total = n + quiet * 2;

  // Integer module size, centered — fractional sizing misaligns dense matrices
  const m = Math.floor(size / total);
  const offset = Math.floor((size - m * total) / 2);
  const radius = m * 0.42;

  const image = new Jimp({ width: size, height: size });
  const data = image.bitmap.data;

  // Warm cream background (#fffdf7)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 253;
    data[i + 2] = 247;
    data[i + 3] = 255;
  }

  // Deep batik brown modules (#241a08)
  const darkR = 36;
  const darkG = 26;
  const darkB = 8;

  const isSet = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < n && y < n && matrix.data[y * n + x] === 1;

  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      if (!isSet(gx, gy)) continue;

      const ox = offset + (gx + quiet) * m;
      const oy = offset + (gy + quiet) * m;

      // A corner is rounded only when both edge neighbours are empty,
      // so connected modules merge into smooth pill-shaped strips.
      const tl = !isSet(gx - 1, gy) && !isSet(gx, gy - 1);
      const tr = !isSet(gx + 1, gy) && !isSet(gx, gy - 1);
      const bl = !isSet(gx - 1, gy) && !isSet(gx, gy + 1);
      const br = !isSet(gx + 1, gy) && !isSet(gx, gy + 1);

      const x0 = Math.floor(ox);
      const x1 = Math.ceil(ox + m);
      const y0 = Math.floor(oy);
      const y1 = Math.ceil(oy + m);

      for (let Y = y0; Y < y1; Y++) {
        for (let X = x0; X < x1; X++) {
          const lx = X - ox + 0.5;
          const ly = Y - oy + 0.5;
          let inside = true;

          if (tl && lx < radius && ly < radius && (radius - lx) ** 2 + (radius - ly) ** 2 > radius ** 2) {
            inside = false;
          } else if (tr && lx > m - radius && ly < radius && (lx - (m - radius)) ** 2 + (radius - ly) ** 2 > radius ** 2) {
            inside = false;
          } else if (bl && lx < radius && ly > m - radius && (radius - lx) ** 2 + (ly - (m - radius)) ** 2 > radius ** 2) {
            inside = false;
          } else if (br && lx > m - radius && ly > m - radius && (lx - (m - radius)) ** 2 + (ly - (m - radius)) ** 2 > radius ** 2) {
            inside = false;
          }

          if (!inside || X < 0 || Y < 0 || X >= size || Y >= size) continue;
          const i = (Y * size + X) * 4;
          data[i] = darkR;
          data[i + 1] = darkG;
          data[i + 2] = darkB;
          data[i + 3] = 255;
        }
      }
    }
  }

  return image;
}

async function renderQrDataUrl(text: string): Promise<string> {
  const qr = renderRoundedQrJimp(text, 512);

  // Best-effort logo overlay in the QR center; falls back to plain QR if unavailable
  const logoCandidates = [
    path.join(process.cwd(), 'public', 'images', 'logo.png'),
    path.join(process.cwd(), 'dist', 'images', 'logo.png')
  ];

  for (const logoPath of logoCandidates) {
    try {
      if (!fs.existsSync(logoPath)) continue;
      const logo = await Jimp.read(logoPath);
      const qrSize = qr.width;
      const logoSize = Math.floor(qrSize * 0.22);
      logo.resize({ w: logoSize }); // keeps aspect ratio

      const x = Math.floor((qrSize - logo.width) / 2);
      const y = Math.floor((qrSize - logo.height) / 2);
      const pad = Math.floor(logoSize * 0.09);

      // Soft white backdrop behind the logo for contrast + scannability
      const backdrop = new Jimp({
        width: logo.width + pad * 2,
        height: logo.height + pad * 2,
        color: 0xffffffff
      });
      qr.composite(backdrop, x - pad, y - pad);
      qr.composite(logo, x, y);
      break;
    } catch {
      // try the next candidate path
    }
  }

  const buffer = await qr.getBuffer('image/png');
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function buildCheckinSmtpTransport(): Transporter | null {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  if (!host || !user) return null;
  const portRaw = (process.env.SMTP_PORT || '587').trim();
  const port = parseInt(portRaw) || 587;
  const pass = process.env.SMTP_PASS || '';
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: pass || undefined }
  });
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

// Issue a signed check-in ticket + rendered QR for guests confirmed as "hadir".
// The QR payload is only generated here; scanning/handling is done by an external project/subdomain.
app.get('/api/public/invitation/:code/qr', rateLimiter(30, 60000), async (req, res) => {
  const { code } = req.params;
  try {
    const guestRs = await db.execute({ sql: 'SELECT * FROM guests WHERE code = ?', args: [code.toUpperCase()] });
    const guest = guestRs.rows[0] as any;
    if (!guest) return res.status(404).json({ error: 'Kode undangan tidak ditemukan' });
    if (guest.status_active === 0) return res.status(403).json({ error: 'Undangan ini dinonaktifkan sementara oleh admin' });
    if (guest.status !== 'hadir') {
      return res.status(400).json({ error: 'QR check-in hanya diterbitkan untuk tamu yang mengonfirmasi HADIR' });
    }

    const content = await readContent();
    const settings = await readSettings();
    const checkinData = buildCheckinPayload(guest);
    const checkinUrl = buildCheckinUrl(checkinData, settings);
    const qrDataUrl = await renderQrDataUrl(checkinUrl);

    res.json({
      success: true,
      checkinData,
      checkinUrl,
      qrDataUrl,
      payload: {
        code: guest.code,
        name: guest.name,
        guestCount: parseInt(guest.guest_count) || 1,
        event: 'Ria & Iqram',
        eventDate: content?.events?.resepsi?.date || ''
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat QR check-in: ' + err.message });
  }
});

// Email the check-in QR ticket to the guest's email address (requires SMTP env configuration).
app.post('/api/public/invitation/:code/qr/email', rateLimiter(3, 60000), async (req, res) => {
  const { code } = req.params;
  const { email, honeypot } = req.body || {};

  if (honeypot) return res.status(400).json({ error: 'Deteksi spam teraktivasi!' });

  const target = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    return res.status(400).json({ error: 'Alamat email tidak valid' });
  }

  try {
    const guestRs = await db.execute({ sql: 'SELECT * FROM guests WHERE code = ?', args: [code.toUpperCase()] });
    const guest = guestRs.rows[0] as any;
    if (!guest) return res.status(404).json({ error: 'Kode undangan tidak ditemukan' });
    if (guest.status_active === 0) return res.status(403).json({ error: 'Undangan ini dinonaktifkan sementara oleh admin' });
    if (guest.status !== 'hadir') {
      return res.status(400).json({ error: 'QR check-in hanya diterbitkan untuk tamu yang mengonfirmasi HADIR' });
    }

    const content = await readContent();
    const settings = await readSettings();
    const checkinData = buildCheckinPayload(guest);
    const checkinUrl = buildCheckinUrl(checkinData, settings);
    const qrDataUrl = await renderQrDataUrl(checkinUrl);

    const transporter = buildCheckinSmtpTransport();
    if (!transporter) {
      return res.status(501).json({
        error: 'Pengiriman email belum dikonfigurasi di server (SMTP). Silakan simpan QR langsung dari halaman undangan.'
      });
    }

    const guestCount = parseInt(guest.guest_count) || 1;
    const eventDate = content?.events?.resepsi?.date || '';
    const safeName = escapeHtml(guest.name);
    const safeEmail = escapeHtml(target);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: target,
      subject: 'Tiket Check-in QR — Undangan Pernikahan Ria & Iqram',
      html: `
        <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; padding: 28px 24px; text-align: center; background: #1a1005; color: #f5efe0;">
          <p style="letter-spacing: 5px; font-size: 11px; color: #d4af37; margin: 0;">DENGAN PENUH SYUKUR</p>
          <h1 style="font-size: 28px; color: #d4af37; margin: 10px 0 4px;">Iqram &amp; Ria</h1>
          <p style="font-size: 13px; color: #cbbfa5; margin: 0 0 22px;">Tiket Check-in Kehadiran</p>
          <div style="background: #fffdf7; border-radius: 18px; padding: 18px; margin: 0 auto 22px; display: inline-block;">
            <img src="${qrDataUrl}" alt="QR Check-in" width="240" height="240" style="display: block;" />
          </div>
          <p style="font-size: 15px; color: #f5efe0; margin: 0 0 4px;">Atas nama: <strong>${safeName}</strong></p>
          <p style="font-size: 12px; color: #cbbfa5; margin: 0 0 4px;">Kode Undangan: <strong style="color: #d4af37;">${escapeHtml(guest.code)}</strong> &bull; ${guestCount} orang</p>
          ${eventDate ? `<p style="font-size: 12px; color: #cbbfa5; margin: 0 0 4px;">${escapeHtml(eventDate)}</p>` : ''}
          <p style="font-size: 11px; color: #8a7d5f; margin: 18px 0 0;">Simpan dan tunjukkan QR ini ketika tiba di lokasi acara.</p>
          <p style="font-size: 10px; color: #6b5f45; margin: 10px 0 0;">Dikirim untuk ${safeEmail}</p>
        </div>
      `
    });

    addAuditLog('QR_EMAIL_SENT', `QR check-in dikirim ke ${target} untuk tamu ${guest.name}`);
    res.json({ success: true, message: 'QR check-in telah dikirim ke email Anda' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengirim email: ' + err.message });
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
