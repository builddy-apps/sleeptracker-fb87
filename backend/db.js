import Database from 'better-sqlite3';
import fs from 'fs';

// Ensure data directory exists
const dataDir = './data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize database connection
const db = new Database(`${dataDir}/app.db`);
db.pragma('journal_mode = WAL');

// Create tables schema
const schema = `
CREATE TABLE IF NOT EXISTS aesthetics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  palette TEXT,
  effects TEXT,
  typography TEXT,
  borders TEXT,
  is_preset INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  tags TEXT,
  aesthetic_config TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

db.exec(schema);

// Seed data: 6 preset aesthetics
const presets = [
  {
    name: 'Glassmorphism',
    description: 'Frosted glass panels with background blur and subtle borders.',
    category: 'Modern',
    palette: { primary: '#ffffff', secondary: '#e2e8f0', accent: '#6366f1', bg: '#0f172a', text: '#f8fafc' },
    effects: { blur: 16, opacity: 70, shadow: 'xl', gradient: 'none' },
    typography: { heading: 'Inter', body: 'Inter', weight: 500 },
    borders: { radius: 16, width: 1, style: 'solid', color: 'rgba(255,255,255,0.2)' },
    is_preset: 1
  },
  {
    name: 'Brutalism',
    description: 'Raw, high-contrast design with thick borders and bold typography.',
    category: 'Experimental',
    palette: { primary: '#000000', secondary: '#ffffff', accent: '#ffff00', bg: '#ffffff', text: '#000000' },
    effects: { blur: 0, opacity: 100, shadow: 'none', gradient: 'none' },
    typography: { heading: 'Courier Prime', body: 'Arial', weight: 700 },
    borders: { radius: 0, width: 4, style: 'solid', color: '#000000' },
    is_preset: 1
  },
  {
    name: 'Retro / Vaporwave',
    description: 'Nostalgic 80s aesthetic with neon gradients and grids.',
    category: 'Retro',
    palette: { primary: '#ff71ce', secondary: '#01cdfe', accent: '#b967ff', bg: '#2d1b4e', text: '#fffb96' },
    effects: { blur: 0, opacity: 100, shadow: 'md', gradient: 'linear(45deg, #ff71ce, #b967ff)' },
    typography: { heading: 'VT323', body: 'Press Start 2P', weight: 400 },
    borders: { radius: 4, width: 2, style: 'dashed', color: '#ff71ce' },
    is_preset: 1
  },
  {
    name: 'Neon Cyberpunk',
    description: 'Dark futuristic style with glowing neon accents and glitch effects.',
    category: 'Sci-Fi',
    palette: { primary: '#0aff0a', secondary: '#00f3ff', accent: '#ff003c', bg: '#050505', text: '#e0e0e0' },
    effects: { blur: 4, opacity: 90, shadow: 'neon', gradient: 'linear(90deg, #0aff0a, #00f3ff)' },
    typography: { heading: 'Orbitron', body: 'Roboto Mono', weight: 600 },
    borders: { radius: 2, width: 2, style: 'solid', color: '#00f3ff' },
    is_preset: 1
  },
  {
    name: 'Warm Minimalist',
    description: 'Clean, soft, and calming earth tones with plenty of whitespace.',
    category: 'Minimalist',
    palette: { primary: '#d4a373', secondary: '#faedcd', accent: '#e29578', bg: '#fefae0', text: '#4a4e69' },
    effects: { blur: 0, opacity: 100, shadow: 'sm', gradient: 'none' },
    typography: { heading: 'Playfair Display', body: 'Lato', weight: 400 },
    borders: { radius: 8, width: 0, style: 'none', color: 'transparent' },
    is_preset: 1
  },
  {
    name: 'Neumorphism',
    description: 'Soft UI design with extruded shapes and subtle shadows.',
    category: 'Modern',
    palette: { primary: '#a0a0a0', secondary: '#e0e0e0', accent: '#6c5ce7', bg: '#e0e5ec', text: '#4a5568' },
    effects: { blur: 0, opacity: 100, shadow: 'soft', gradient: 'none' },
    typography: { heading: 'Nunito', body: 'Open Sans', weight: 600 },
    borders: { radius: 20, width: 0, style: 'none', color: 'transparent' },
    is_preset: 1
  }
];

// Insert presets if table is empty
const presetCount = db.prepare('SELECT COUNT(*) as count FROM aesthetics WHERE is_preset = 1').get();
if (presetCount.count === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO aesthetics (name, description, category, palette, effects, typography, borders, is_preset)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertStmt.run(
        item.name,
        item.description,
        item.category,
        JSON.stringify(item.palette),
        JSON.stringify(item.effects),
        JSON.stringify(item.typography),
        JSON.stringify(item.borders),
        item.is_preset
      );
    }
  });
  insertMany(presets);
}

// Export database instance and query helpers
export default db;
export const queryAll = (sql, params = []) => db.prepare(sql).all(params);
export const queryGet = (sql, params = []) => db.prepare(sql).get(params);
export const queryRun = (sql, params = []) => db.prepare(sql).run(params);