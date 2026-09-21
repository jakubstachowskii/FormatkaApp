const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

const DEFAULT_CATALOG = [
  { slug: 'wiszaca', name: 'Szafka wisząca', category: 'warsztat', default_depth: 30, default_height: 45 },
  { slug: 'stojaca', name: 'Szafka stojąca', category: 'warsztat', default_depth: 40, default_height: 80 },
  { slug: 'regal', name: 'Regał otwarty', category: 'biuro', default_depth: 30, default_height: 180 },
  { slug: 'naroznik', name: 'Szafka narożna', category: 'kuchnia', default_depth: 35, default_height: 72 },
  { slug: 'garderoba', name: 'Szafa garderobiana', category: 'garderoba', default_depth: 60, default_height: 240 },
  { slug: 'kuchenna_dol', name: 'Szafka kuchenna dolna', category: 'kuchnia', default_depth: 56, default_height: 72 },
  { slug: 'szuflady', name: 'Szafka na szuflady', category: 'kuchnia', default_depth: 56, default_height: 72 }
];

function initDb(userDataPath) {
  const dir = path.join(userDataPath, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'formatka.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS catalog_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_depth REAL,
      default_height REAL,
      meta TEXT DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      config_json TEXT NOT NULL,
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS cut_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      created_at TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      parts_json TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS c FROM catalog_types').get().c;
  if (count === 0) {
    const ins = db.prepare(`
      INSERT INTO catalog_types (slug, name, category, default_depth, default_height, meta)
      VALUES (@slug, @name, @category, @default_depth, @default_height, '{}')
    `);
    const tx = db.transaction((rows) => rows.forEach((r) => ins.run(r)));
    tx(DEFAULT_CATALOG);
  }
}

const api = {
  listProjects() {
    return db.prepare('SELECT id, name, created_at, updated_at, notes FROM projects ORDER BY updated_at DESC').all();
  },
  getProject(id) {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) || null;
  },
  saveProject(payload) {
    const now = new Date().toISOString();
    const configJson = typeof payload.config === 'string' ? payload.config : JSON.stringify(payload.config || {});
    if (payload.id) {
      db.prepare(`
        UPDATE projects SET name = ?, updated_at = ?, config_json = ?, notes = ?
        WHERE id = ?
      `).run(payload.name || 'Bez nazwy', now, configJson, payload.notes || '', payload.id);
      return api.getProject(payload.id);
    }
    const info = db.prepare(`
      INSERT INTO projects (name, created_at, updated_at, config_json, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(payload.name || 'Nowy projekt', now, now, configJson, payload.notes || '');
    return api.getProject(info.lastInsertRowid);
  },
  deleteProject(id) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return true;
  },
  listCatalog() {
    return db.prepare('SELECT * FROM catalog_types ORDER BY category, name').all();
  },
  upsertCatalog(row) {
    if (row.id) {
      db.prepare(`
        UPDATE catalog_types
        SET slug=?, name=?, category=?, default_depth=?, default_height=?, meta=?
        WHERE id=?
      `).run(row.slug, row.name, row.category, row.default_depth, row.default_height, row.meta || '{}', row.id);
      return db.prepare('SELECT * FROM catalog_types WHERE id = ?').get(row.id);
    }
    const info = db.prepare(`
      INSERT INTO catalog_types (slug, name, category, default_depth, default_height, meta)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(row.slug, row.name, row.category, row.default_depth, row.default_height, row.meta || '{}');
    return db.prepare('SELECT * FROM catalog_types WHERE id = ?').get(info.lastInsertRowid);
  },
  getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const out = {};
    rows.forEach((r) => { out[r.key] = r.value; });
    return out;
  },
  setSetting(key, value) {
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, String(value));
    return true;
  },
  addCutHistory(payload) {
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO cut_history (project_id, created_at, summary_json, parts_json)
      VALUES (?, ?, ?, ?)
    `).run(
      payload.projectId || null,
      now,
      JSON.stringify(payload.summary || {}),
      JSON.stringify(payload.parts || [])
    );
    return info.lastInsertRowid;
  },
  listCutHistory(projectId) {
    if (projectId) {
      return db.prepare('SELECT * FROM cut_history WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
    }
    return db.prepare('SELECT * FROM cut_history ORDER BY created_at DESC LIMIT 50').all();
  }
};

module.exports = { initDb, api };
