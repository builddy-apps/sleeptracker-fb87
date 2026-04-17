import Database from 'better-sqlite3';
import fs from 'fs';

// Ensure data directory exists
fs.mkdirSync('data', { recursive: true });

// Initialize database connection
const db = new Database('./data/app.db');
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
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

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM aesthetics WHERE is_preset = 0').get();
if (count.count > 0) {
  console.log('Data already seeded, skipping...');
  db.close();
  process.exit(0);
}

// Helper function to generate timestamps spread across the last 30 days
function randomDate(daysAgo) {
  const date = new Date(Date.now() - daysAgo * 86400000);
  return date.toISOString();
}

// Custom aesthetics (user-created styles)
const customAesthetics = [
  {
    name: 'Aurora Borealis',
    description: 'Ethereal northern lights palette with iridescent purples and greens dancing across a deep night sky.',
    category: 'Nature',
    palette: { primary: '#7c3aed', secondary: '#34d399', accent: '#c084fc', bg: '#0c0a1d', text: '#e2e8f0' },
    effects: { blur: 12, opacity: 85, shadow: 'lg', gradient: 'linear(135deg, #7c3aed, #34d399)' },
    typography: { heading: 'Outfit', body: 'Inter', weight: 500 },
    borders: { radius: 12, width: 1, style: 'solid', color: 'rgba(124,58,237,0.3)' },
    is_preset: 0,
    created_at: randomDate(28),
    updated_at: randomDate(5)
  },
  {
    name: 'Desert Sunset',
    description: 'Warm terracotta and golden hues inspired by southwestern landscapes at dusk.',
    category: 'Nature',
    palette: { primary: '#ea580c', secondary: '#fbbf24', accent: '#dc2626', bg: '#fffbeb', text: '#451a03' },
    effects: { blur: 0, opacity: 100, shadow: 'md', gradient: 'linear(180deg, #ea580c, #fbbf24)' },
    typography: { heading: 'DM Serif Display', body: 'Source Sans 3', weight: 400 },
    borders: { radius: 6, width: 2, style: 'solid', color: '#ea580c' },
    is_preset: 0,
    created_at: randomDate(25),
    updated_at: randomDate(12)
  },
  {
    name: 'Ocean Depths',
    description: 'Deep marine blues and bioluminescent accents evoking the mysterious deep sea.',
    category: 'Nature',
    palette: { primary: '#0369a1', secondary: '#06b6d4', accent: '#22d3ee', bg: '#082f49', text: '#e0f2fe' },
    effects: { blur: 8, opacity: 90, shadow: 'xl', gradient: 'linear(180deg, #0369a1, #06b6d4)' },
    typography: { heading: 'Space Grotesk', body: 'IBM Plex Sans', weight: 500 },
    borders: { radius: 10, width: 1, style: 'solid', color: 'rgba(6,182,212,0.4)' },
    is_preset: 0,
    created_at: randomDate(22),
    updated_at: randomDate(8)
  },
  {
    name: 'Corporate Navy',
    description: 'Professional and trustworthy palette with classic navy blue and clean whites.',
    category: 'Professional',
    palette: { primary: '#1e3a5f', secondary: '#f8fafc', accent: '#3b82f6', bg: '#ffffff', text: '#1e293b' },
    effects: { blur: 0, opacity: 100, shadow: 'sm', gradient: 'none' },
    typography: { heading: 'Montserrat', body: 'Open Sans', weight: 600 },
    borders: { radius: 4, width: 1, style: 'solid', color: '#e2e8f0' },
    is_preset: 0,
    created_at: randomDate(20),
    updated_at: randomDate(3)
  },
  {
    name: 'Pastel Dreams',
    description: 'Soft and dreamy palette with cotton candy colors and gentle gradients.',
    category: 'Playful',
    palette: { primary: '#f9a8d4', secondary: '#c4b5fd', accent: '#93c5fd', bg: '#fdf4ff', text: '#581c87' },
    effects: { blur: 16, opacity: 80, shadow: 'md', gradient: 'linear(135deg, #f9a8d4, #c4b5fd)' },
    typography: { heading: 'Quicksand', body: 'Nunito', weight: 400 },
    borders: { radius: 20, width: 0, style: 'none', color: 'transparent' },
    is_preset: 0,
    created_at: randomDate(18),
    updated_at: randomDate(7)
  },
  {
    name: 'Forest Canopy',
    description: 'Lush greens and earthy browns bringing the tranquility of ancient forests.',
    category: 'Nature',
    palette: { primary: '#15803d', secondary: '#a3e635', accent: '#65a30d', bg: '#f0fdf4', text: '#1a2e05' },
    effects: { blur: 0, opacity: 100, shadow: 'lg', gradient: 'linear(180deg, #15803d, #65a30d)' },
    typography: { heading: 'Fraunces', body: 'Lora', weight: 500 },
    borders: { radius: 8, width: 2, style: 'solid', color: '#15803d' },
    is_preset: 0,
    created_at: randomDate(15),
    updated_at: randomDate(2)
  },
  {
    name: 'Midnight Jazz',
    description: 'Sophisticated dark theme with elegant gold accents and smoky undertones.',
    category: 'Luxury',
    palette: { primary: '#d4af37', secondary: '#1a1a2e', accent: '#e6b422', bg: '#0f0f1a', text: '#f5f5dc' },
    effects: { blur: 4, opacity: 95, shadow: 'lg', gradient: 'linear(90deg, #d4af37, #e6b422)' },
    typography: { heading: 'Playfair Display', body: 'Cormorant Garamond', weight: 700 },
    borders: { radius: 3, width: 1, style: 'solid', color: '#d4af37' },
    is_preset: 0,
    created_at: randomDate(14),
    updated_at: randomDate(6)
  },
  {
    name: 'Tropical Paradise',
    description: 'Vibrant and energetic palette inspired by tropical flowers and exotic birds.',
    category: 'Playful',
    palette: { primary: '#f43f5e', secondary: '#fb923c', accent: '#a855f7', bg: '#fef3c7', text: '#422006' },
    effects: { blur: 0, opacity: 100, shadow: 'md', gradient: 'linear(45deg, #f43f5e, #fb923c, #a855f7)' },
    typography: { heading: 'Fredoka', body: 'Poppins', weight: 600 },
    borders: { radius: 16, width: 3, style: 'solid', color: '#f43f5e' },
    is_preset: 0,
    created_at: randomDate(12),
    updated_at: randomDate(4)
  },
  {
    name: 'Arctic Frost',
    description: 'Cool, crisp whites and icy blues creating a refreshing winter atmosphere.',
    category: 'Minimalist',
    palette: { primary: '#bfdbfe', secondary: '#e0f2fe', accent: '#38bdf8', bg: '#f8fafc', text: '#1e3a5f' },
    effects: { blur: 8, opacity: 90, shadow: 'sm', gradient: 'linear(180deg, #e0f2fe, #ffffff)' },
    typography: { heading: 'Raleway', body: 'Work Sans', weight: 300 },
    borders: { radius: 12, width: 1, style: 'solid', color: '#bfdbfe' },
    is_preset: 0,
    created_at: randomDate(10),
    updated_at: randomDate(1)
  },
  {
    name: 'Cherry Blossom',
    description: 'Delicate pinks and soft whites inspired by Japanese sakura season.',
    category: 'Elegant',
    palette: { primary: '#fda4af', secondary: '#fecdd3', accent: '#f472b6', bg: '#fff1f2', text: '#881337' },
    effects: { blur: 12, opacity: 85, shadow: 'md', gradient: 'linear(135deg, #fda4af, #f472b6)' },
    typography: { heading: 'Cormorant', body: 'Quicksand', weight: 400 },
    borders: { radius: 24, width: 0, style: 'none', color: 'transparent' },
    is_preset: 0,
    created_at: randomDate(9),
    updated_at: randomDate(3)
  },
  {
    name: 'Volcanic Ember',
    description: 'Fiery reds and deep charcoal creating a powerful, dramatic presence.',
    category: 'Bold',
    palette: { primary: '#dc2626', secondary: '#7f1d1d', accent: '#f97316', bg: '#1c1917', text: '#fef2f2' },
    effects: { blur: 0, opacity: 100, shadow: 'xl', gradient: 'linear(180deg, #dc2626, #7f1d1d)' },
    typography: { heading: 'Bebas Neue', body: 'Roboto', weight: 700 },
    borders: { radius: 2, width: 3, style: 'solid', color: '#dc2626' },
    is_preset: 0,
    created_at: randomDate(7),
    updated_at: randomDate(2)
  },
  {
    name: 'Tech Startup',
    description: 'Modern gradient-forward design with electric purple and clean typography.',
    category: 'Modern',
    palette: { primary: '#8b5cf6', secondary: '#6366f1', accent: '#06b6d4', bg: '#faf5ff', text: '#312e81' },
    effects: { blur: 20, opacity: 75, shadow: 'lg', gradient: 'linear(135deg, #8b5cf6, #06b6d4)' },
    typography: { heading: 'Inter', body: 'Inter', weight: 600 },
    borders: { radius: 16, width: 0, style: 'none', color: 'transparent' },
    is_preset: 0,
    created_at: randomDate(5),
    updated_at: randomDate(1)
  }
];

// Favorites data
const favorites = [
  {
    name: 'Landing Page Hero Section',
    tags: ['landing-page', 'gradient', 'modern'],
    aesthetic_config: {
      palette: { primary: '#8b5cf6', secondary: '#06b6d4', accent: '#f59e0b', bg: '#0f172a', text: '#f8fafc' },
      effects: { blur: 16, opacity: 80, shadow: 'xl', gradient: 'linear(135deg, #8b5cf6, #06b6d4)' },
      typography: { heading: 'Inter', body: 'Inter', weight: 700 },
      borders: { radius: 16, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(27),
    updated_at: randomDate(10)
  },
  {
    name: 'E-commerce Product Cards',
    tags: ['e-commerce', 'clean', 'minimal'],
    aesthetic_config: {
      palette: { primary: '#1e293b', secondary: '#f1f5f9', accent: '#f97316', bg: '#ffffff', text: '#334155' },
      effects: { blur: 0, opacity: 100, shadow: 'lg', gradient: 'none' },
      typography: { heading: 'Poppins', body: 'Inter', weight: 600 },
      borders: { radius: 12, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(24),
    updated_at: randomDate(15)
  },
  {
    name: 'Blog Post Layout',
    tags: ['blog', 'reading', 'serif'],
    aesthetic_config: {
      palette: { primary: '#1e293b', secondary: '#f8fafc', accent: '#6366f1', bg: '#ffffff', text: '#374151' },
      effects: { blur: 0, opacity: 100, shadow: 'sm', gradient: 'none' },
      typography: { heading: 'Merriweather', body: 'Lora', weight: 400 },
      borders: { radius: 0, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(21),
    updated_at: randomDate(9)
  },
  {
    name: 'Portfolio Showcase',
    tags: ['portfolio', 'creative', 'dark-mode'],
    aesthetic_config: {
      palette: { primary: '#ffffff', secondary: '#1e293b', accent: '#8b5cf6', bg: '#0f172a', text: '#e2e8f0' },
      effects: { blur: 12, opacity: 85, shadow: 'xl', gradient: 'none' },
      typography: { heading: 'Space Grotesk', body: 'Inter', weight: 500 },
      borders: { radius: 8, width: 1, style: 'solid', color: 'rgba(255,255,255,0.1)' }
    },
    created_at: randomDate(19),
    updated_at: randomDate(7)
  },
  {
    name: 'SaaS Dashboard',
    tags: ['dashboard', 'professional', 'analytics'],
    aesthetic_config: {
      palette: { primary: '#3b82f6', secondary: '#f1f5f9', accent: '#10b981', bg: '#ffffff', text: '#1e293b' },
      effects: { blur: 0, opacity: 100, shadow: 'sm', gradient: 'none' },
      typography: { heading: 'Inter', body: 'Inter', weight: 500 },
      borders: { radius: 8, width: 1, style: 'solid', color: '#e2e8f0' }
    },
    created_at: randomDate(17),
    updated_at: randomDate(5)
  },
  {
    name: 'Music Player UI',
    tags: ['music', 'dark-mode', 'gradient'],
    aesthetic_config: {
      palette: { primary: '#1db954', secondary: '#191414', accent: '#1ed760', bg: '#121212', text: '#ffffff' },
      effects: { blur: 20, opacity: 90, shadow: 'lg', gradient: 'linear(180deg, #1db954, #191414)' },
      typography: { heading: 'Montserrat', body: 'Montserrat', weight: 600 },
      borders: { radius: 12, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(16),
    updated_at: randomDate(8)
  },
  {
    name: 'Food Delivery App',
    tags: ['food', 'warm', 'appetizing'],
    aesthetic_config: {
      palette: { primary: '#ea580c', secondary: '#fff7ed', accent: '#dc2626', bg: '#ffffff', text: '#431407' },
      effects: { blur: 0, opacity: 100, shadow: 'md', gradient: 'none' },
      typography: { heading: 'Nunito', body: 'Nunito', weight: 700 },
      borders: { radius: 16, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(13),
    updated_at: randomDate(4)
  },
  {
    name: 'Fitness Tracker',
    tags: ['fitness', 'energetic', 'motivational'],
    aesthetic_config: {
      palette: { primary: '#ef4444', secondary: '#fee2e2', accent: '#f97316', bg: '#ffffff', text: '#1f2937' },
      effects: { blur: 0, opacity: 100, shadow: 'md', gradient: 'linear(135deg, #ef4444, #f97316)' },
      typography: { heading: 'Montserrat', body: 'Roboto', weight: 700 },
      borders: { radius: 12, width: 2, style: 'solid', color: '#ef4444' }
    },
    created_at: randomDate(11),
    updated_at: randomDate(3)
  },
  {
    name: 'Travel Booking Site',
    tags: ['travel', 'adventure', 'vibrant'],
    aesthetic_config: {
      palette: { primary: '#0ea5e9', secondary: '#f0f9ff', accent: '#f59e0b', bg: '#ffffff', text: '#0c4a6e' },
      effects: { blur: 8, opacity: 90, shadow: 'lg', gradient: 'linear(135deg, #0ea5e9, #38bdf8)' },
      typography: { heading: 'Poppins', body: 'Inter', weight: 500 },
      borders: { radius: 12, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(8),
    updated_at: randomDate(2)
  },
  {
    name: 'Crypto Exchange',
    tags: ['crypto', 'dark-mode', 'futuristic'],
    aesthetic_config: {
      palette: { primary: '#f59e0b', secondary: '#1e293b', accent: '#10b981', bg: '#0f172a', text: '#e2e8f0' },
      effects: { blur: 4, opacity: 95, shadow: 'neon', gradient: 'linear(90deg, #f59e0b, #10b981)' },
      typography: { heading: 'JetBrains Mono', body: 'Inter', weight: 600 },
      borders: { radius: 4, width: 1, style: 'solid', color: '#f59e0b' }
    },
    created_at: randomDate(6),
    updated_at: randomDate(1)
  },
  {
    name: 'Educational Platform',
    tags: ['education', 'friendly', 'accessible'],
    aesthetic_config: {
      palette: { primary: '#6366f1', secondary: '#eef2ff', accent: '#8b5cf6', bg: '#ffffff', text: '#312e81' },
      effects: { blur: 0, opacity: 100, shadow: 'sm', gradient: 'none' },
      typography: { heading: 'Nunito', body: 'Source Sans 3', weight: 600 },
      borders: { radius: 12, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(4),
    updated_at: randomDate(1)
  },
  {
    name: 'Social Media Feed',
    tags: ['social', 'colorful', 'engaging'],
    aesthetic_config: {
      palette: { primary: '#e11d48', secondary: '#fdf2f8', accent: '#8b5cf6', bg: '#ffffff', text: '#1f2937' },
      effects: { blur: 8, opacity: 90, shadow: 'md', gradient: 'linear(45deg, #e11d48, #8b5cf6)' },
      typography: { heading: 'Poppins', body: 'Inter', weight: 500 },
      borders: { radius: 16, width: 0, style: 'none', color: 'transparent' }
    },
    created_at: randomDate(3),
    updated_at: randomDate(0)
  }
];

// Insert all data in a transaction
const insertAll = db.transaction(() => {
  // Insert custom aesthetics
  const insertAesthetic = db.prepare(`
    INSERT INTO aesthetics (name, description, category, palette, effects, typography, borders, is_preset, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const aesthetic of customAesthetics) {
    insertAesthetic.run(
      aesthetic.name,
      aesthetic.description,
      aesthetic.category,
      JSON.stringify(aesthetic.palette),
      JSON.stringify(aesthetic.effects),
      JSON.stringify(aesthetic.typography),
      JSON.stringify(aesthetic.borders),
      aesthetic.is_preset,
      aesthetic.created_at,
      aesthetic.updated_at
    );
  }

  // Insert favorites
  const insertFavorite = db.prepare(`
    INSERT INTO favorites (name, tags, aesthetic_config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const favorite of favorites) {
    insertFavorite.run(
      favorite.name,
      JSON.stringify(favorite.tags),
      JSON.stringify(favorite.aesthetic_config),
      favorite.created_at,
      favorite.updated_at
    );
  }
});

// Execute the transaction
insertAll();

// Get final counts
const aestheticCount = db.prepare('SELECT COUNT(*) as count FROM aesthetics').get();
const customCount = db.prepare('SELECT COUNT(*) as count FROM aesthetics WHERE is_preset = 0').get();
const presetCount = db.prepare('SELECT COUNT(*) as count FROM aesthetics WHERE is_preset = 1').get();
const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM favorites').get();

console.log(`
╔══════════════════════════════════════════╗
║   Aesthetik Database Seeded Successfully ║
╠══════════════════════════════════════════╣
║                                          ║
║   Total Aesthetics: ${String(aestheticCount.count).padEnd(21)}║
║   - Presets: ${String(presetCount.count).padEnd(28)}║
║   - Custom:  ${String(customCount.count).padEnd(28)}║
║   Saved Favorites: ${String(favoriteCount.count).padEnd(21)}║
║                                          ║
║   Custom styles include:                 ║
║   • Aurora Borealis                      ║
║   • Desert Sunset                        ║
║   • Ocean Depths                         ║
║   • Corporate Navy                       ║
║   • Pastel Dreams                        ║
║   • Forest Canopy                        ║
║   • Midnight Jazz                        ║
║   • And more...                          ║
║                                          ║
║   Favorites include real-world           ║
║   use cases like Landing Pages,          ║
║   Dashboards, Portfolio Sites            ║
║                                          ║
╚══════════════════════════════════════════╝
`);

db.close();
process.exit(0);