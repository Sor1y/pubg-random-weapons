const WeaponDraw = {
  weapons: [],
  onResult: null,
  isDrawing: false,

  init(weapons, onResult) {
    this.weapons = weapons;
    this.onResult = onResult;
    this.isDrawing = false;
    const card = document.getElementById('draw-card');
    card.className = 'draw-card';
    document.getElementById('draw-weapon-name').textContent = '?';
    document.getElementById('draw-weapon-info').textContent = '点击下方按钮抽取';
  },

  draw() {
    if (this.isDrawing || this.weapons.length === 0) return;
    this.isDrawing = true;

    const result = weightedRandom(this.weapons);
    const nameEl = document.getElementById('draw-weapon-name');
    const infoEl = document.getElementById('draw-weapon-info');
    const card = document.getElementById('draw-card');
    const btn = document.getElementById('btn-draw');

    btn.disabled = true;
    btn.textContent = '抽取中...';
    card.className = 'draw-card drawing';

    let iteration = 0;
    const totalIterations = 30 + Math.floor(Math.random() * 10);

    const cycle = () => {
      const rw = this.weapons[Math.floor(Math.random() * this.weapons.length)];
      nameEl.textContent = rw.name;
      infoEl.innerHTML = `<span class="tier-badge tier-${rw.tier}">${rw.tier}</span> <span>${WEAPON_TYPES[rw.type].name}</span>`;

      iteration++;

      if (iteration >= totalIterations) {
        nameEl.textContent = result.name;
        infoEl.innerHTML = `<span class="tier-badge tier-${result.tier}">${result.tier}</span> <span>${WEAPON_TYPES[result.type].name}</span>`;
        card.className = 'draw-card result';
        this.isDrawing = false;
        btn.disabled = false;
        btn.textContent = '抽取！';
        if (this.onResult) this.onResult(result);
        return;
      }

      const progress = iteration / totalIterations;
      const delay = 20 + progress * progress * 260;
      setTimeout(cycle, delay);
    };

    cycle();
  },
};
