import express from 'express';
import cors from 'cors';
import db, { queryAll, queryGet, queryRun } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// GET /api/aesthetics - List all with preview
app.get('/api/aesthetics', (req, res) => {
  try {
    const rows = queryAll('SELECT id, name, description, category, palette FROM aesthetics ORDER BY id');
    const data = rows.map(row => ({
      ...row,
      palette: JSON.parse(row.palette)
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/aesthetics/:id - Full config
app.get('/api/aesthetics/:id', (req, res) => {
  try {
    const row = queryGet('SELECT * FROM aesthetics WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Aesthetic not found' });
    }
    const data = {
      ...row,
      palette: JSON.parse(row.palette),
      effects: JSON.parse(row.effects),
      typography: JSON.parse(row.typography),
      borders: JSON.parse(row.borders)
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/aesthetics/randomize - Generate random aesthetic mix
app.post('/api/aesthetics/randomize', (req, res) => {
  try {
    const all = queryAll('SELECT * FROM aesthetics WHERE is_preset = 1');
    if (all.length < 2) {
      return res.status(400).json({ success: false, error: 'Not enough presets to mix' });
    }

    // Select two random distinct presets
    const idx1 = Math.floor(Math.random() * all.length);
    let idx2 = Math.floor(Math.random() * all.length);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * all.length);

    const baseRaw = all[idx1];
    const mixRaw = all[idx2];

    // Parse JSON columns
    const base = {
      ...baseRaw,
      palette: JSON.parse(baseRaw.palette),
      effects: JSON.parse(baseRaw.effects),
      typography: JSON.parse(baseRaw.typography),
      borders: JSON.parse(baseRaw.borders)
    };

    const mix = {
      palette: JSON.parse(mixRaw.palette),
      effects: JSON.parse(mixRaw.effects),
      typography: JSON.parse(mixRaw.typography),
      borders: JSON.parse(mixRaw.borders)
    };

    // Randomly mix properties
    const mixProp = (obj, src, prop) => {
      if (Math.random() > 0.5) obj[prop] = src[prop];
    };

    mixProp(base.palette, mix.palette, 'primary');
    mixProp(base.palette, mix.palette, 'secondary');
    mixProp(base.palette, mix.palette, 'accent');
    mixProp(base.effects, mix.effects, 'blur');
    mixProp(base.effects, mix.effects, 'shadow');
    mixProp(borders, mix.borders, 'radius');
    mixProp(base.typography, mix.typography, 'heading');

    // Return mixed config (not saved)
    const result = {
      id: -1,
      name: `Mix of ${baseRaw.name} & ${mixRaw.name}`,
      description: 'Randomly generated aesthetic',
      category: 'Mixed',
      ...base,
      is_preset: 0
    };

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/favorites - List all saved
app.get('/api/favorites', (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM favorites ORDER BY created_at DESC');
    const data = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      aesthetic_config: JSON.parse(row.aesthetic_config)
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/favorites - Save new with validation
app.post('/api/favorites', (req, res) => {
  try {
    const { name, tags, aesthetic_config } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!aesthetic_config || typeof aesthetic_config !== 'object') {
      return res.status(400).json({ success: false, error: 'Valid aesthetic_config is required' });
    }

    const info = queryRun(
      'INSERT INTO favorites (name, tags, aesthetic_config) VALUES (?, ?, ?)',
      [name.trim(), JSON.stringify(tags || []), JSON.stringify(aesthetic_config)]
    );

    res.json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/favorites/:id
app.delete('/api/favorites/:id', (req, res) => {
  try {
    const info = queryRun('DELETE FROM favorites WHERE id = ?', [req.params.id]);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: 'Favorite not found' });
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/export - Generate CSS/Tailwind/JSON
app.post('/api/export', (req, res) => {
  try {
    const { config, format } = req.body;
    
    if (!config || !format) {
      return res.status(400).json({ success: false, error: 'Config and format are required' });
    }

    const p = config.palette || {};
    const b = config.borders || {};
    let output = '';

    if (format === 'css') {
      output = `:root {\n`;
      output += `  --color-primary: ${p.primary || '#000000'};\n`;
      output += `  --color-secondary: ${p.secondary || '#ffffff'};\n`;
      output += `  --color-accent: ${p.accent || '#ff0000'};\n`;
      output += `  --color-bg: ${p.bg || '#ffffff'};\n`;
      output += `  --color-text: ${p.text || '#000000'};\n`;
      output += `  --border-radius: ${b.radius || 0}px;\n`;
      output += `  --border-width: ${b.width || 0}px;\n`;
      output += `}`;
    } else if (format === 'tailwind') {
      const tailwindConfig = {
        theme: {
          extend: {
            colors: {
              primary: p.primary,
              secondary: p.secondary,
              accent: p.accent,
              background: p.bg,
              text: p.text
            },
            borderRadius: {
              DEFAULT: `${b.radius || 0}px`
            }
          }
        }
      };
      output = JSON.stringify(tailwindConfig, null, 2);
    } else if (format === 'palette') {
      output = JSON.stringify(p, null, 2);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid format. Use css, tailwind, or palette.' });
    }

    res.json({ success: true, data: output });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile('index.html', { root: 'frontend' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Aesthetik server running on port ${PORT}`);
});