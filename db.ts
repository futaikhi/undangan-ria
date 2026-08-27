import { createClient, Client } from '@libsql/client';
import path from 'path';

const USE_TURSO = !!process.env.TURSO_DATABASE_URL;

export const db: Client = USE_TURSO
  ? createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : createClient({
      url: 'file:./data/guests.db',
    });

if (!USE_TURSO) {
  const fs = require('fs');
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const defaultContent = {
  bride: {
    nickname: 'Ria',
    fullname: 'Fitria Wulandari, S.I.Kom.',
    father: 'Alm Bapak Utomo',
    mother: 'Ibu Yuaningsih',
    photo: 'https://i.ibb.co.com/qLftHxTG/HFZ-7993.webp',
    instagram: '@fitriaawdd'
  },
  groom: {
    nickname: 'Iqram',
    fullname: 'Iqram Rainanda, A.Md Tra',
    father: 'Bapak Zainul Arifin',
    mother: 'Ibu Sitti Hindun',
    photo: 'https://i.ibb.co.com/QFfqVmYf/HFZ-8388.webp',
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
      url: 'https://i.ibb.co.com/k21xBs8k/HFZ-8413.webp',
      caption: 'Kasmaran - Keintiman dalam balutan kebaya tradisional.'
    },
    {
      id: 'g2',
      url: 'https://i.ibb.co.com/GfDPn959/HFZ-8517.webp',
      caption: 'Langkah Suci - Menyusuri pelataran Pendopo.'
    },
    {
      id: 'g3',
      url: 'https://i.ibb.co.com/Mk5w8fFR/HFZ-8068.webp',
      caption: 'Ikatan Jiwa - Tatapan hangat penuh harapan.'
    },
    {
      id: 'g4',
      url: 'https://i.ibb.co.com/ksMJvs7P/HFZ-8141.webp',
      caption: 'Selasar - Menanti hari yang sakral bersama.'
    },
    {
      id: 'g5',
      url: 'https://i.ibb.co.com/VYWC1SKF/HFZ-8189.webp',
      caption: 'Selasar - Menanti hari yang sakral bersama.'
    }
  ]
};

const defaultSettings = {
  musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  youtubeLiveUrl: '',
  theme: {
    primaryColor: '#8c6239',
    accentColor: '#d4af37',
    backgroundColor: '#fcfbf7',
    darkColor: '#1a1005'
  },
  generalOptions: {
    enableCommentsApproval: false,
    enableMusicAutoplay: true,
    whatsappGreetingTemplate: 'Halo Bapak/Ibu {nama_tamu}\n\nDengan penuh kebahagiaan kami mengundang Anda untuk hadir di acara pernikahan kami:\n\nRia & Iqram\n\nBerikut link undangannya:\n{link_undangan}\n\nMerupakan suatu kehormatan bagi kami apabila Anda berkenan hadir.\n\nTerima kasih.'
  }
};

async function getKV(key: string, defaultValue: any) {
  const rs = await db.execute({ sql: 'SELECT value FROM app_kv WHERE key = ?', args: [key] });
  if (rs.rows.length > 0) {
    return JSON.parse(rs.rows[0].value as string);
  }
  await db.execute({ sql: 'INSERT INTO app_kv (key, value) VALUES (?, ?)', args: [key, JSON.stringify(defaultValue)] });
  return defaultValue;
}

async function setKV(key: string, value: any) {
  await db.execute({ sql: 'INSERT OR REPLACE INTO app_kv (key, value) VALUES (?, ?)', args: [key, JSON.stringify(value)] });
}

export async function bootstrapData() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      whatsapp TEXT,
      status TEXT DEFAULT 'belum_respon',
      guest_count INTEGER DEFAULT 0,
      opened_count INTEGER DEFAULT 0,
      last_opened_at TEXT,
      status_active INTEGER DEFAULT 1
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

    CREATE TABLE IF NOT EXISTS app_kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const guestRs = await db.execute({ sql: 'SELECT COUNT(*) as count FROM guests', args: [] });
  const guestCount = guestRs.rows[0].count as number;

  if (guestCount === 0) {
    await db.execute({ sql: 'INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)', args: ['RIAIQRAM', 'Keluarga Besar & Rekan Sejawat', 'Umum', '628123456789'] });
    await db.execute({ sql: 'INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)', args: ['VIP2026', 'Yth. Bapak & Ibu Pembimbing Jasa', 'VVIP', '628999999999'] });
  }

  await getKV('content', defaultContent);
  await getKV('settings', defaultSettings);
}

export async function readContent() {
  return getKV('content', defaultContent);
}

export async function writeContent(data: any) {
  await setKV('content', data);
}

export async function readSettings() {
  return getKV('settings', defaultSettings);
}

export async function writeSettings(data: any) {
  await setKV('settings', data);
}
