const WeaponDraw = {
  isDrawing: false,
  currentGridId: null,

  renderGrid(containerId, players, label) {
    this.currentGridId = containerId;
    const grid = document.getElementById(containerId);
    grid.innerHTML = players.map((p, i) => {
      const existing = label === 'sub' ? (p.weapons[0] ? `<div class="draw-slot-sub">主: ${p.weapons[0].name}</div>` : '') : '';
      return `
        <div class="draw-slot" data-slot-index="${i}">
          <div class="draw-slot-name">${p.name}</div>
          <div class="draw-slot-card" data-role="card">
            <div class="draw-slot-weapon" data-role="name">?</div>
            <div class="draw-slot-info" data-role="info"></div>
          </div>
          ${existing}
        </div>
      `;
    }).join('');
  },

  getSlotElements(index) {
    const grid = this.currentGridId ? document.getElementById(this.currentGridId) : null;
    if (!grid) return { card: null, name: null, info: null };
    const slot = grid.querySelector(`[data-slot-index="${index}"]`);
    if (!slot) return { card: null, name: null, info: null };
    return {
      card: slot.querySelector('[data-role="card"]'),
      name: slot.querySelector('[data-role="name"]'),
      info: slot.querySelector('[data-role="info"]'),
    };
  },

  drawAll(pools, onAllDone) {
    if (this.isDrawing) return;
    this.isDrawing = true;

    const count = pools.length;
    const results = pools.map(pool => weightedRandom(pool));
    let finished = 0;

    pools.forEach((pool, i) => {
      const { card: cardEl, name: nameEl, info: infoEl } = this.getSlotElements(i);
      if (!nameEl || !cardEl) {
        finished++;
        if (finished >= count) {
          this.isDrawing = false;
          if (onAllDone) onAllDone(results);
        }
        return;
      }

      cardEl.className = 'draw-slot-card drawing';
      const totalIter = 25 + Math.floor(Math.random() * 8);
      const staggerDelay = i * 400;

      setTimeout(() => {
        let iter = 0;
        const cycle = () => {
          const rw = pool[Math.floor(Math.random() * pool.length)];
          nameEl.textContent = rw.name || rw.value || '?';
          if (rw.type && WEAPON_TYPES[rw.type]) {
            infoEl.textContent = WEAPON_TYPES[rw.type].name;
          } else {
            infoEl.textContent = '';
          }

          iter++;
          if (iter >= totalIter) {
            const result = results[i];
            nameEl.textContent = result.name || result.value || '?';
            if (result.type && WEAPON_TYPES[result.type]) {
              infoEl.textContent = WEAPON_TYPES[result.type].name;
            } else {
              infoEl.textContent = typeof getScopeDisplayName === 'function' ? getScopeDisplayName(result) : (result.name || '');
            }
            cardEl.className = 'draw-slot-card result';

            finished++;
            if (finished >= count) {
              this.isDrawing = false;
              if (onAllDone) onAllDone(results);
            }
            return;
          }

          const progress = iter / totalIter;
          const delay = 25 + progress * progress * 240;
          setTimeout(cycle, delay);
        };
        cycle();
      }, staggerDelay);
    });
  },
};
