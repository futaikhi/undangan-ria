import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Ensure the data directory exists
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database path
const DB_PATH = path.join(DATA_DIR, 'guests.db');
const CONTENT_PATH = path.join(DATA_DIR, 'content.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
const RSVP_BACKUP_PATH = path.join(DATA_DIR, 'rsvp.json');

// Initialize better-sqlite3
export const db = new Database(DB_PATH);

// Create SQLite tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    whatsapp TEXT,
    status TEXT DEFAULT 'belum_respon', -- 'hadir', 'tidak_hadir', 'belum_respon'
    guest_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    last_opened_at TEXT,
    status_active INTEGER DEFAULT 1 -- 1 for active, 0 for disabled
  );

  CREATE TABLE IF NOT EXISTS rsvp_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER,
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    is_approved INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(guest_id) REFERENCES guests(id) ON DELETE SET NULL
  );
`);

// Atomic JSON write helper
function safeWriteJSON(filePath: string, data: any) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

// Initial Content Defaults
const defaultContent = {
  bride: {
    nickname: 'Ria',
    fullname: 'Fitria Wulandari, S.I.Kom.',
    father: 'Alm Bapak Utomo',
    mother: 'Ibu Yuaningsih',
    photo: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600', // Premium Javanese aesthetic placeholder
    instagram: '@fitriaawdd'
  },
  groom: {
    nickname: 'Iqram',
    fullname: 'Iqram Rainanda, A.Md Tra',
    father: 'Bapak Zainul Arifin',
    mother: 'Ibu Sitti Hindun',
    photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600', // Premium Javanese aesthetic placeholder
    instagram: '@rainandaa_'
  },
  quote: {
    text: '“Pada akhirnya, cinta bukan tentang menemukan seseorang yang sempurna, tetapi tentang menemukan seseorang yang ingin kita temui, lagi dan lagi, di setiap versi kehidupan. After all the little moments, the laughter, the growing, and the choosing — here we are. Dengan penuh syukur, kami melangkah menuju satu perjalanan baru, membawa cinta yang sederhana, doa yang panjang, dan harapan untuk tumbuh bersama, selamanya.”',
    translation: '',
    source: ''
  },
  events: {
    akad: {
      title: 'Akad Nikah',
      date: 'Jumat, 06 Desember 2026',
      isoDate: '2026-12-06T14:00:00+07:00',
      time: '14:00 - 15:00 WIB',
      location: 'Samudera Hall, Tanjung Kodok Beach Resort, Paciran, Lamongan',
      address: 'Jl. Raya Paciran, Paciran, Kec. Paciran, Kabupaten Lamongan, Jawa Timur 62264',
      mapsUrl: 'https://maps.app.goo.gl/uyk57Sp6yyJhtCxP6'
    },
    praresepsi: {
      title: 'Pra-Resepsi Sunset',
      date: 'Jumat, 06 Desember 2026',
      isoDate: '2026-12-06T15:30:00+07:00',
      time: '15:30 - 18:00 WIB',
      location: 'Outdoor Terrace, Tanjung Kodok Beach Resort, Paciran Lamongan',
      address: 'Jl. Raya Paciran, Paciran, Kec. Paciran, Kabupaten Lamongan, Jawa Timur 62264',
      mapsUrl: 'https://maps.app.goo.gl/uyk57Sp6yyJhtCxP6'
    },
    resepsi: {
      title: 'Resepsi',
      date: 'Jumat, 06 Desember 2026',
      isoDate: '2026-12-06T18:30:00+07:00',
      time: '18:30 - 20:30 WIB',
      location: 'Outdoor Terrace, Tanjung Kodok Beach Resort, Paciran Lamongan',
      address: 'Jl. Raya Paciran, Paciran, Kec. Paciran, Kabupaten Lamongan, Jawa Timur 62264',
      mapsUrl: 'https://maps.app.goo.gl/uyk57Sp6yyJhtCxP6'
    }
  },
  story: [
    {
      id: 1,
      year: '2022',
      title: 'Pertemuan Pertama (Witing Tresno Jalaran Soko Kulino)',
      content: 'Kami dipertemukan pertama kali di keraton Yogyakarta dalam sebuah acara pelestarian budaya. Kesamaan kecintaan pada adat istiadat dan seni Jawa mengawali perbincangan hangat kami.'
    },
    {
      id: 2,
      year: '2024',
      title: 'Mengikat Rasa & Visi',
      content: 'Setelah dua tahun saling mengenal, bertukar pikiran, dan berbagi cerita, kami memantapkan niat untuk menyelaraskan visi hidup bersama menuju ikatan yang direstui oleh Sang Pencipta.'
    },
    {
      id: 3,
      year: '2026',
      title: 'Lamaran & Restu (Januari 2026)',
      content: 'Di hadapan keluarga besar kedua belah pihak, Iqram secara resmi memohon restu dari orang tua Ria untuk meminang sang putri. Hari suci penuh kebahagiaan pun dipersiapkan.'
    }
  ],
  gifts: [
    {
      provider: 'BCA',
      accountNumber: '3301540335',
      holder: 'Fitria Wulandari',
      icon: 'CreditCard'
    },
    {
      provider: 'Bank Jatim',
      accountNumber: '0282366479',
      holder: 'Iqram Rainanda',
      icon: 'CreditCard'
    },
    {
      provider: 'QRIS Digital Gift',
      accountNumber: 'qris_placeholder_base64_or_text',
      holder: 'Ria & Iqram Wedding',
      icon: 'QrCode'
    }
  ],
  gallery: [
    {
      id: 'g1',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
      caption: 'Kasmaran - Keintiman dalam balutan kebaya tradisional.'
    },
    {
      id: 'g2',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
      caption: 'Langkah Suci - Menyusuri pelataran Pendopo.'
    },
    {
      id: 'g3',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
      caption: 'Ikatan Jiwa - Tatapan hangat penuh harapan.'
    },
    {
      id: 'g4',
      url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800',
      caption: 'Selasar - Menanti hari yang sakral bersama.'
    }
  ]
};

// Initial Settings Defaults
const defaultSettings = {
  musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Soft royalty-free background audio
  youtubeLiveUrl: '',
  theme: {
    primaryColor: '#8c6239', // Coklat Batik
    accentColor: '#d4af37',  // Gold lembut
    backgroundColor: '#fcfbf7', // Ivory cream
    darkColor: '#1a1005' // Dark wood
  },
  generalOptions: {
    enableCommentsApproval: false, // Auto-approve comments
    enableMusicAutoplay: true,
    whatsappGreetingTemplate: 'Halo Bapak/Ibu {nama_tamu}\n\nDengan penuh kebahagiaan kami mengundang Anda untuk hadir di acara pernikahan kami:\n\nRia & Iqram\n\nBerikut link undangannya:\n{link_undangan}\n\nMerupakan suatu kehormatan bagi kami apabila Anda berkenan hadir.\n\nTerima kasih.'
  }
};

// Bootstrap function
export function bootstrapData() {
  // Write default content if not exists
  if (!fs.existsSync(CONTENT_PATH)) {
    safeWriteJSON(CONTENT_PATH, defaultContent);
  }
  // Write default settings if not exists
  if (!fs.existsSync(SETTINGS_PATH)) {
    safeWriteJSON(SETTINGS_PATH, defaultSettings);
  }
  // Write rsvp.json backup if not exists
  if (!fs.existsSync(RSVP_BACKUP_PATH)) {
    safeWriteJSON(RSVP_BACKUP_PATH, []);
  }

  // Seed default guest if table is empty
  const guestCount = db.prepare('SELECT COUNT(*) as count FROM guests').get() as { count: number };
  if (guestCount.count === 0) {
    const defaultGuests = [
      { code: 'RIAIQRAM', name: 'Keluarga Besar & Rekan Sejawat', category: 'Umum', whatsapp: '628123456789' },
      { code: 'VIP2026', name: 'Yth. Bapak & Ibu Pembimbing Jasa', category: 'VVIP', whatsapp: '628999999999' }
    ];
    const insert = db.prepare('INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)');
    for (const g of defaultGuests) {
      insert.run(g.code, g.name, g.category, g.whatsapp);
    }
  }
}

// Read and update functions for JSON data
export function readContent(): typeof defaultContent {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf-8'));
}

export function writeContent(data: any) {
  safeWriteJSON(CONTENT_PATH, data);
}

export function readSettings(): typeof defaultSettings {
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
}

export function writeSettings(data: any) {
  safeWriteJSON(SETTINGS_PATH, data);
}

export function backupRSVP() {
  // Sunc rsvps from DB to json
  const rsvps = db.prepare(`
    SELECT g.id, g.code, g.name, g.status, g.guest_count,
           rc.comment, rc.created_at
    FROM guests g
    LEFT JOIN rsvp_comments rc ON g.id = rc.guest_id
    WHERE g.status != 'belum_respon'
  `).all();
  safeWriteJSON(RSVP_BACKUP_PATH, rsvps);
}

// Call bootstrap immediately on load
bootstrapData();
