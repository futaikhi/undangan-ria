import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  process.exit(1);
}

const db = createClient({ url, authToken });

const defaultContent = {
  bride: {
    nickname: 'Ria',
    fullname: 'Fitria Wulandari, S.I.Kom.',
    father: 'Alm Bapak Utomo',
    mother: 'Ibu Yuaningsih',
    photo: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600',
    instagram: '@fitriaawdd'
  },
  groom: {
    nickname: 'Iqram',
    fullname: 'Iqram Rainanda, A.Md Tra',
    father: 'Bapak Zainul Arifin',
    mother: 'Ibu Sitti Hindun',
    photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
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

async function main() {
  const guestCountRs = await db.execute({ sql: 'SELECT COUNT(*) as count FROM guests', args: [] });
  const guestCount = guestCountRs.rows[0].count as number;

  if (guestCount === 0) {
    await db.execute({ sql: 'INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)', args: ['RIAIQRAM', 'Keluarga Besar & Rekan Sejawat', 'Umum', '628123456789'] });
    await db.execute({ sql: 'INSERT INTO guests (code, name, category, whatsapp) VALUES (?, ?, ?, ?)', args: ['VIP2026', 'Yth. Bapak & Ibu Pembimbing Jasa', 'VVIP', '628999999999'] });
    console.log('Default guests seeded.');
  } else {
    console.log(`Guests already exist (${guestCount}), skipping seed.`);
  }

  const contentRs = await db.execute({ sql: 'SELECT value FROM app_kv WHERE key = ?', args: ['content'] });
  if (contentRs.rows.length === 0) {
    await db.execute({ sql: 'INSERT INTO app_kv (key, value) VALUES (?, ?)', args: ['content', JSON.stringify(defaultContent)] });
    console.log('Default content seeded.');
  } else {
    console.log('Content already exists, skipping seed.');
  }

  const settingsRs = await db.execute({ sql: 'SELECT value FROM app_kv WHERE key = ?', args: ['settings'] });
  if (settingsRs.rows.length === 0) {
    await db.execute({ sql: 'INSERT INTO app_kv (key, value) VALUES (?, ?)', args: ['settings', JSON.stringify(defaultSettings)] });
    console.log('Default settings seeded.');
  } else {
    console.log('Settings already exist, skipping seed.');
  }

  console.log('Turso database seeding completed.');
  await db.close();
}

main().catch((err) => {
  console.error('Failed to seed Turso database:', err);
  process.exit(1);
});
