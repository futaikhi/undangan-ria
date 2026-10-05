import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
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
      status_active INTEGER DEFAULT 1,
      event_key TEXT,
      arrival_time TEXT
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

  const infoRs = await db.execute({ sql: 'PRAGMA table_info(guests)', args: [] });
  const existing = new Set(infoRs.rows.map((r: any) => String(r.name)));
  for (const [column, alterSql] of [
    ['event_key', 'ALTER TABLE guests ADD COLUMN event_key TEXT'],
    ['arrival_time', 'ALTER TABLE guests ADD COLUMN arrival_time TEXT']
  ] as Array<[string, string]>) {
    if (existing.has(column)) continue;
    await db.execute({ sql: alterSql, args: [] });
    console.log(`Kolom ${column} ditambahkan ke tabel guests.`);
  }

  console.log('Tables created successfully in Turso.');
  await db.close();
}

main().catch((err) => {
  console.error('Failed to initialize Turso database:', err);
  process.exit(1);
});
