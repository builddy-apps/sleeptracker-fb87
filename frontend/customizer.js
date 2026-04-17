class Customizer {
  constructor() {
    this.config = null;
    this.defaults = null;
    this.init();
  }

  init() {
    this.createDrawer();
    this.loadAesthetic();
    this.renderControls();
  }

  createDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'customizer-drawer';
    drawer.className = 'fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl transform translate-x-full transition-transform duration-300 z-50 overflow-y-auto custom-scrollbar';
    drawer.innerHTML = `
      <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Customize</h2>
          <button onclick="window.customizer.close()" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="customizer-content"></div>
        <div class="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button onclick="window.customizer.reset()" class="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Reset</button>
          <button onclick="window.customizer.apply()" class="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Apply</button>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  loadAesthetic() {
    const current = State.currentAesthetic || this.getDefaultConfig();
    this.config = JSON.parse(JSON.stringify(current));
    this.defaults = JSON.parse(JSON.stringify(current));
  }

  getDefaultConfig() {
    return {
      palette: { primary: '#0ea5e9', secondary: '#64748b', accent: '#a855f7', bg: '#f8fafc', text: '#0f172a' },
      effects: { blur: 0, opacity: 100, shadow: 'md' },
      borders: { radius: 8, width: 1, style: 'solid' },
      gradient: { direction: 'to right', stops: ['#0ea5e9', '#a855f7'] }
    };
  }

  renderControls() {
    const html = `
      <section class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Colors</h3>
        ${this.renderColorInputs()}
      </section>
      <section class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Effects</h3>
        ${this.renderEffectInputs()}
      </section>
      <section class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Borders</h3>
        ${this.renderBorderInputs()}
      </section>
      <section class="space-y-4">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Gradients</h3>
        ${this.renderGradientInputs()}
      </section>
    `;
    document.getElementById('customizer-content').innerHTML = html;
  }

  renderColorInputs() {
    const colors = ['primary', 'secondary', 'accent', 'bg', 'text'];
    return colors.map(k => `
      <div class="flex items-center gap-3">
        <input type="color" value="${this.config.palette[k]}" onchange="window.customizer.update('palette.${k}', this.value)" class="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent">
        <div class="flex-1">
          <label class="text-xs text-slate-500 dark:text-slate-400 capitalize">${k === 'bg' ? 'Background' : k}</label>
          <input type="text" value="${this.config.palette[k]}" onchange="window.customizer.update('palette.${k}', this.value)" class="w-full mt-1 px-2 py-1 text-sm font-mono bg-slate-100 dark:bg-slate-800 rounded-md border-0 text-slate-700 dark:text-slate-300">
        </div>
      </div>
    `).join('');
  }

  renderEffectInputs() {
    const e = this.config.effects;
    return `
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Blur: ${e.blur}px</label>
        <input type="range" min="0" max="40" value="${e.blur}" oninput="window.customizer.update('effects.blur', this.value)" class="w-full mt-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
      </div>
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Opacity: ${e.opacity}%</label>
        <input type="range" min="0" max="100" value="${e.opacity}" oninput="window.customizer.update('effects.opacity', this.value)" class="w-full mt-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
      </div>
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Shadow</label>
        <select onchange="window.customizer.update('effects.shadow', this.value)" class="w-full mt-1 px-2 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-md border-0 text-slate-700 dark:text-slate-300">
          ${['none','sm','md','lg','xl'].map(s => `<option value="${s}" ${e.shadow===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    `;
  }

  renderBorderInputs() {
    const b = this.config.borders;
    return `
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Radius: ${b.radius}px</label>
        <input type="range" min="0" max="24" value="${b.radius}" oninput="window.customizer.update('borders.radius', this.value)" class="w-full mt-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
      </div>
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Width: ${b.width}px</label>
        <input type="range" min="0" max="8" value="${b.width}" oninput="window.customizer.update('borders.width', this.value)" class="w-full mt-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
      </div>
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Style</label>
        <select onchange="window.customizer.update('borders.style', this.value)" class="w-full mt-1 px-2 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-md border-0 text-slate-700 dark:text-slate-300">
          ${['solid','dashed','dotted','double'].map(s => `<option value="${s}" ${b.style===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    `;
  }

  renderGradientInputs() {
    const g = this.config.gradient;
    return `
      <div>
        <label class="text-xs text-slate-500 dark:text-slate-400">Direction</label>
        <select onchange="window.customizer.update('gradient.direction', this.value)" class="w-full mt-1 px-2 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-md border-0 text-slate-700 dark:text-slate-300">
          ${['to right','to left','to bottom','to top','45deg'].map(d => `<option value="${d}" ${g.direction===d?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div id="gradient-stops" class="space-y-2">${g.stops.map((s,i) => `
        <div class="flex items-center gap-2">
          <input type="color" value="${s}" onchange="window.customizer.updateGradientStop(${i}, this.value)" class="w-8 h-8 rounded cursor-pointer border-0 bg-transparent">
          <input type="text" value="${s}" onchange="window.customizer.updateGradientStop(${i}, this.value)" class="flex-1 px-2 py-1 text-sm font-mono bg-slate-100 dark:bg-slate-800 rounded-md border-0 text-slate-700 dark:text-slate-300">
          <button onclick="window.customizer.removeGradientStop(${i})" class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      `).join('')}</div>
      <button onclick="window.customizer.addGradientStop()" class="w-full py-1.5 px-3 text-sm text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950">+ Add Color Stop</button>
    `;
  }

  update(path, value) {
    const keys = path.split('.');
    let obj = this.config;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = ['blur','opacity','radius','width'].includes(keys[keys.length - 1]) ? parseInt(value) : value;
    this.updatePreview();
  }

  updateGradientStop(index, value) {
    this.config.gradient.stops[index] = value;
    this.updatePreview();
  }

  addGradientStop() {
    if (this.config.gradient.stops.length >= 5) return Toast.error('Maximum 5 stops');
    this.config.gradient.stops.push('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'));
    this.renderControls();
    this.updatePreview();
  }

  removeGradientStop(index) {
    if (this.config.gradient.stops.length <= 2) return Toast.error('Minimum 2 stops');
    this.config.gradient.stops.splice(index, 1);
    this.renderControls();
    this.updatePreview();
  }

  updatePreview() {
    const p = this.config.palette, e = this.config.effects, b = this.config.borders;
    const root = document.documentElement;
    root.style.setProperty('--custom-primary', p.primary);
    root.style.setProperty('--custom-secondary', p.secondary);
    root.style.setProperty('--custom-accent', p.accent);
    root.style.setProperty('--custom-bg', p.bg);
    root.style.setProperty('--custom-text', p.text);
    
    document.querySelectorAll('.aesthetic-btn').forEach(el => {
      el.style.backgroundColor = p.primary;
      el.style.color = this.getContrast(p.primary);
      el.style.borderRadius = `${b.radius}px`;
      el.style.boxShadow = this.getShadow(e.shadow);
      el.style.backdropFilter = `blur(${e.blur}px)`;
      el.style.opacity = e.opacity / 100;
    });
    
    document.querySelectorAll('.aesthetic-btn-secondary').forEach(el => {
      el.style.backgroundColor = p.secondary;
      el.style.color = this.getContrast(p.secondary);
      el.style.borderRadius = `${b.radius}px`;
      el.style.border = `${b.width}px ${b.style} ${p.text}`;
      el.style.backdropFilter = `blur(${e.blur}px)`;
    });
    
    document.querySelectorAll('.showcase-section').forEach(el => {
      el.style.backgroundColor = p.bg;
      el.style.borderRadius = `${b.radius}px`;
      el.style.border = `${b.width}px ${b.style} ${p.text}40`;
      el.style.boxShadow = this.getShadow(e.shadow);
    });

    if (this.config.gradient.stops.length > 1) {
      const grad = `linear-gradient(${this.config.gradient.direction}, ${this.config.gradient.stops.join(', ')})`;
      document.querySelectorAll('.gradient-preview').forEach(el => el.style.background = grad);
    }
  }

  getContrast(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return ((0.299*r + 0.587*g + 0.114*b) / 255) > 0.5 ? '#000' : '#fff';
  }

  getShadow(s) {
    const shadows = { none:'none', sm:'0 1px 2px rgba(0,0,0,0.05)', md:'0 4px 6px rgba(0,0,0,0.1)', lg:'0 10px 15px rgba(0,0,0,0.1)', xl:'0 20px 25px rgba(0,0,0,0.1)' };
    return shadows[s] || shadows.md;
  }

  apply() {
    State.currentAesthetic = JSON.parse(JSON.stringify(this.config));
    this.defaults = JSON.parse(JSON.stringify(this.config));
    this.close();
    Toast.success('Customization applied!');
  }

  reset() {
    this.config = JSON.parse(JSON.stringify(this.defaults));
    this.renderControls();
    this.updatePreview();
    Toast.info('Reset to defaults');
  }

  open() {
    this.loadAesthetic();
    this.renderControls();
    this.updatePreview();
    document.getElementById('customizer-drawer').classList.remove('translate-x-full');
  }

  close() {
    document.getElementById('customizer-drawer').classList.add('translate-x-full');
  }
}

const Export = {
  generateCSS(c) {
    const p = c.palette, e = c.effects, b = c.borders;
    return `:root {\n  --primary: ${p.primary};\n  --secondary: ${p.secondary};\n  --accent: ${p.accent};\n  --bg: ${p.bg};\n  --text: ${p.text};\n  --blur: ${e.blur}px;\n  --radius: ${b.radius}px;\n}`;
  },
  generateTailwind(c) {
    const p = c.palette, b = c.borders;
    return `module.exports = {\n  theme: {\n    extend: {\n      colors: { primary: '${p.primary}', secondary: '${p.secondary}', accent: '${p.accent}', bg: '${p.bg}', text: '${p.text}' },\n      borderRadius: { DEFAULT: '${b.radius}px' }\n    }\n  }\n}`;
  },
  generatePalette(c) { return JSON.stringify(c.palette, null, 2); },
  async copy(text) {
    try { await navigator.clipboard.writeText(text); Toast.success('Copied!'); }
    catch (e) { Toast.error('Copy failed'); }
  }
};

function openDrawer() { window.customizer.open(); }

function saveAesthetic() {
  const config = State.currentAesthetic || window.customizer?.config;
  if (!config) return Toast.error('No config to save');
  const name = prompt('Name your aesthetic:', 'My Style');
  if (!name) return;
  API.post('/api/favorites', { name, aesthetic_config: JSON.stringify(config) })
    .then(res => res.success && Toast.success('Saved!'))
    .catch(e => Toast.error('Save failed'));
}

function exportConfig(format) {
  const config = State.currentAesthetic || window.customizer?.config;
  if (!config) return Toast.error('No config to export');
  const outputs = { css: Export.generateCSS, tailwind: Export.generateTailwind, palette: Export.generatePalette };
  if (outputs[format]) Export.copy(outputs[format](config));
}

window.customizer = new Customizer();