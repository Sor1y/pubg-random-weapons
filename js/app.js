const STORAGE_KEY = 'pubg_game_state_v2';

const App = {
  state: null,
  currentSpinPlayer: 0,
  currentSpinSlot: 0,

  createInitialState() {
    return {
      map: 'erangel',
      totalRounds: 5,
      currentRound: 1,
      wheelMode: 'sequential',
      currentView: 'view-setup',
      players: [],
      roundHistory: [],
      pendingRewardPlayers: [],
      pendingPunishment: null,
      lastRoundSnapshot: null,
      spinState: {
        playerIndex: 0,
        slotIndex: 0,
      },
    };
  },

  createPlayer(name) {
    return {
      name,
      weapons: [null, null],
      scope: null,
      cards: [],
      scores: [],
      scoreAdjustments: [],
      totalScore: 0,
      activePunishment: null,
      punishmentExpiresAfterRound: null,
      punishmentDrawCount: 0,
      activeCards: [],
      roundEffects: [],
      thiefTarget: null,
      swapTarget: null,
    };
  },

  hydrateState(savedState) {
    const base = this.createInitialState();
    const hydrated = {
      ...base,
      ...savedState,
      players: (savedState.players || []).map(player => ({
        ...this.createPlayer(player.name || '玩家'),
        ...player,
        weapons: Array.isArray(player.weapons) ? player.weapons : [null, null],
        cards: Array.isArray(player.cards) ? player.cards : [],
        scores: Array.isArray(player.scores) ? player.scores : [],
        scoreAdjustments: Array.isArray(player.scoreAdjustments) ? player.scoreAdjustments : [],
        activeCards: Array.isArray(player.activeCards) ? player.activeCards : [],
        roundEffects: Array.isArray(player.roundEffects) ? player.roundEffects : [],
      })),
      roundHistory: Array.isArray(savedState.roundHistory) ? savedState.roundHistory : [],
      pendingRewardPlayers: Array.isArray(savedState.pendingRewardPlayers) ? savedState.pendingRewardPlayers : [],
      spinState: savedState.spinState || base.spinState,
    };

    if (!hydrated.players.length) {
      hydrated.currentView = 'view-setup';
    }

    return hydrated;
  },

  init() {
    this.state = this.createInitialState();
    this.renderMapSelector();
    this.loadState();
    this.populateSetupForm();
    this.renderMapPreview();
    this.syncTheme();
  },

  syncTheme() {
    document.body.dataset.map = this.state.map || 'erangel';
  },

  showView(id, persist = true) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
    this.state.currentView = id;
    this.syncTheme();

    if (persist) {
      this.saveState();
    }
  },

  showModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  },

  renderMapSelector() {
    const container = document.getElementById('map-selector');
    container.innerHTML = MAPS.map(map => {
      const exclusive = map.exclusiveWeapons.length ? map.exclusiveWeapons.join(' / ') : '无当前专属主武器';
      return `
        <button
          class="map-card ${map.id === this.state.map ? 'selected' : ''}"
          data-map="${map.id}"
          onclick="App.selectMap('${map.id}')"
          type="button"
        >
          <span class="map-accent" style="background:${map.accent}"></span>
          <span class="map-name">${map.name}</span>
          <span class="map-size">${map.size}</span>
          <span class="map-note">${exclusive}</span>
        </button>
      `;
    }).join('');
  },

  populateSetupForm() {
    document.getElementById('total-rounds').value = String(this.state.totalRounds);
    document.getElementById('wheel-mode').value = this.state.wheelMode;

    for (let index = 0; index < 4; index++) {
      const input = document.getElementById(`player-${index + 1}`);
      input.value = this.state.players[index]?.name || '';
    }

    document.querySelectorAll('.map-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.map === this.state.map);
    });
  },

  renderMapPreview() {
    const map = getMapById(this.state.map);
    const preview = document.getElementById('map-preview');
    const weapons = getWeaponsForMap(this.state.map);
    const exclusive = getExclusiveWeaponsForMap(this.state.map).map(weapon => weapon.name);
    const typeCounts = Object.keys(WEAPON_TYPES).map(type => `${type} ${getWeaponsByType(weapons, type).length}`).join(' · ');

    preview.innerHTML = `
      <div class="map-preview-head">
        <span class="map-preview-kicker">当前地图</span>
        <h3>${map.name}</h3>
        <p>${map.vibe}</p>
      </div>
      <div class="map-preview-stats">
        <div class="preview-stat">
          <span>尺寸</span>
          <strong>${map.size}</strong>
        </div>
        <div class="preview-stat">
          <span>主特性</span>
          <strong>${map.majorFeature}</strong>
        </div>
      </div>
      <div class="map-preview-block">
        <span class="preview-label">专属枪械</span>
        <div class="preview-tags">
          ${(exclusive.length ? exclusive : ['当前无专属主武器']).map(item => `<span class="preview-tag">${item}</span>`).join('')}
        </div>
      </div>
      <div class="map-preview-block">
        <span class="preview-label">枪池概览</span>
        <p class="map-preview-copy">${typeCounts}</p>
      </div>
    `;
  },

  selectMap(mapId) {
    this.state.map = mapId;
    this.renderMapSelector();
    this.renderMapPreview();
    this.syncTheme();
    this.saveState();
  },

  getModeLabel() {
    return this.state.wheelMode === 'simultaneous' ? '同时随机' : '轮流抽取';
  },

  getRoundProgressPercent() {
    return Math.max(0, Math.min(100, (this.state.currentRound / this.state.totalRounds) * 100));
  },

  getScoreAdjustmentTotal(player, roundIndex) {
    const adjustments = player.scoreAdjustments?.[roundIndex] || [];
    return adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
  },

  addScoreAdjustment(player, roundIndex, adjustment) {
    if (!player.scoreAdjustments[roundIndex]) {
      player.scoreAdjustments[roundIndex] = [];
    }
    player.scoreAdjustments[roundIndex].push(adjustment);
  },

  recalculateTotals() {
    this.state.players.forEach(player => {
      let total = 0;
      const longest = Math.max(player.scores.length, player.scoreAdjustments.length);
      for (let roundIndex = 0; roundIndex < longest; roundIndex++) {
        const baseScore = player.scores[roundIndex] || 0;
        total += baseScore + this.getScoreAdjustmentTotal(player, roundIndex);
      }
      player.totalScore = Math.round(total);
    });
  },

  resetPlayerRoundState(player) {
    player.weapons = [null, null];
    player.scope = null;
    player.activeCards = [];
    player.roundEffects = [];
    player.thiefTarget = null;
    player.swapTarget = null;
  },

  clearRoundArtifacts() {
    this.state.pendingRewardPlayers = [];
    this.state.pendingPunishment = null;
    this.state.lastRoundSnapshot = null;
  },

  cleanExpiredPunishments() {
    this.state.players.forEach(player => {
      if (player.punishmentExpiresAfterRound && this.state.currentRound > player.punishmentExpiresAfterRound) {
        player.activePunishment = null;
        player.punishmentExpiresAfterRound = null;
      }
    });
  },

  startGame() {
    const names = [];
    for (let index = 1; index <= 4; index++) {
      const input = document.getElementById(`player-${index}`);
      names.push(input.value.trim() || `玩家${index}`);
    }

    this.state = this.createInitialState();
    this.state.map = document.querySelector('.map-card.selected')?.dataset.map || this.state.map;
    this.state.totalRounds = parseInt(document.getElementById('total-rounds').value, 10);
    this.state.wheelMode = document.getElementById('wheel-mode').value;
    this.state.players = names.map(name => this.createPlayer(name));

    this.renderMapSelector();
    this.renderMapPreview();
    this.renderInitialCards();
    this.showView('view-initial-cards', false);
    this.saveState();
  },

  renderInitialCards() {
    const area = document.getElementById('initial-cards-area');
    const doneButton = document.getElementById('btn-cards-done');
    area.innerHTML = '';

    let drawnCount = 0;

    this.state.players.forEach(player => {
      const wrapper = document.createElement('div');
      wrapper.className = 'initial-card-slot';
      wrapper.innerHTML = `<p class="initial-card-name">${player.name}</p>`;

      if (player.cards.length > 0) {
        drawnCount++;
        const html = Cards.renderCardFront(player.cards[0]);
        wrapper.insertAdjacentHTML('beforeend', html.replace('card-front', 'card-front no-anim'));
      } else {
        Cards.renderCardBack(wrapper, card => {
          player.cards.push(card);
          this.saveState();
          this.renderInitialCards();
        });
      }

      area.appendChild(wrapper);
    });

    doneButton.style.display = drawnCount >= this.state.players.length ? 'block' : 'none';
  },

  finishInitialCards() {
    this.enterRound({ fresh: true });
  },

  enterRound({ fresh = false } = {}) {
    if (fresh) {
      this.cleanExpiredPunishments();
      this.clearRoundArtifacts();
      this.state.players.forEach(player => this.resetPlayerRoundState(player));
      this.currentSpinPlayer = 0;
      this.currentSpinSlot = 0;
      this.state.spinState = {
        playerIndex: 0,
        slotIndex: 0,
      };
    }

    this.renderRoundScreen();
    this.showView('view-round', false);
    this.saveState();
  },

  renderRoundScreen() {
    const map = getMapById(this.state.map);
    const allWeaponsDrawn = this.state.players.every(player => player.weapons.every(Boolean));
    const allScopesDrawn = this.state.players.every(player => player.scope);
    const tip = !allWeaponsDrawn
      ? '先确认这一局要不要打牌，再开始抽武器。'
      : allScopesDrawn
        ? '装备已经锁定，可以带着限制直接开打。'
        : '武器已经确定，接下来抽瞄准镜。';

    document.getElementById('round-number').textContent = this.state.currentRound;
    document.getElementById('round-map-chip').textContent = `${map.shortName} · ${map.size}`;
    document.getElementById('round-mode-chip').textContent = this.getModeLabel();
    document.getElementById('round-progress-chip').textContent = `第 ${this.state.currentRound}/${this.state.totalRounds} 局`;
    document.getElementById('round-progress-bar').style.width = `${this.getRoundProgressPercent()}%`;
    document.getElementById('round-tip').textContent = tip;

    this.renderPlayerStatusCards();
    this.syncRoundButtons();
  },

  getPlayerEffectLabels(player) {
    const labels = [];

    player.roundEffects.forEach(effect => {
      const mapping = {
        fist: '拳头限制 ×5',
        melee: '近战限制 ×3',
        no_scope: '4倍以上禁用',
        no_meds: '药品禁用',
      };
      if (mapping[effect]) labels.push(mapping[effect]);
    });

    if (player.activePunishment) {
      labels.push(`惩罚: ${player.activePunishment.name}`);
    }

    return labels;
  },

  getPlayerScopeLabel(player) {
    if (!player.scope) return '';

    let label = player.scope.name;

    if (player.roundEffects.includes('no_scope') && isHighMagnificationScope(player.scope)) {
      label += ' · 高倍封印';
    }

    if (player.activePunishment?.id === 'iron_sight') {
      label += ' · 本局只能机瞄';
    }

    return label;
  },

  renderPlayerStatusCards() {
    const container = document.getElementById('player-status-cards');
    container.innerHTML = this.state.players.map(player => {
      const mainWeapon = player.weapons[0] ? this.weaponBadge(player.weapons[0]) : '<span class="weapon-empty">待抽取</span>';
      const sideWeapon = player.weapons[1] ? this.weaponBadge(player.weapons[1]) : '<span class="weapon-empty">待抽取</span>';
      const scopeLabel = this.getPlayerScopeLabel(player);
      const cardsHtml = player.cards.map(card => Cards.renderMiniCard(card)).join('');
      const effectLabels = this.getPlayerEffectLabels(player);

      return `
        <div class="player-card">
          <div class="player-card-head">
            <div class="player-name">${player.name}</div>
            <div class="player-total">总分 ${player.totalScore}</div>
          </div>
          <div class="weapon-slot">[主] ${mainWeapon}</div>
          <div class="weapon-slot">[副] ${sideWeapon}</div>
          ${scopeLabel ? `<span class="scope-badge">${scopeLabel}</span>` : ''}
          ${effectLabels.length ? `<div class="status-tags">${effectLabels.map(label => `<span class="status-tag">${label}</span>`).join('')}</div>` : ''}
          <div class="card-hand">${cardsHtml || '<span class="empty-hand">无手牌</span>'}</div>
        </div>
      `;
    }).join('');

    document.getElementById('round-score-summary').innerHTML = this.state.players
      .map(player => `<span>${player.name}: <strong>${player.totalScore}</strong></span>`)
      .join('');
  },

  weaponBadge(weapon) {
    return `
      <span class="weapon-name">${weapon.name}</span>
      <span class="type-badge">${WEAPON_TYPES[weapon.type].name}</span>
    `;
  },

  syncRoundButtons() {
    const allWeaponsDrawn = this.state.players.every(player => player.weapons.every(Boolean));
    const allScopesDrawn = this.state.players.every(player => player.scope);

    document.getElementById('btn-use-cards').disabled = false;
    document.getElementById('btn-spin-weapons').disabled = allWeaponsDrawn;
    document.getElementById('btn-spin-scopes').disabled = !allWeaponsDrawn || allScopesDrawn;
    document.getElementById('btn-ready').disabled = !allScopesDrawn;
  },

  openCardUse() {
    this.openCardUseForPlayer(0);
  },

  openCardUseForPlayer(playerIdx) {
    if (playerIdx >= this.state.players.length) {
      this.closeModal();
      return;
    }

    const player = this.state.players[playerIdx];
    const html = Cards.renderCardUseModal(
      player,
      this.state.players,
      'App.useCard',
      'App.closeModal'
    );

    this.showModal(html);

    document.querySelectorAll('.modal-card-item').forEach(item => {
      item.addEventListener('click', () => {
        const cardIndex = parseInt(item.dataset.cardIndex, 10);
        this.handleCardUse(playerIdx, cardIndex);
      });
    });

    const nextLabel = document.createElement('p');
    nextLabel.className = 'modal-progress';
    nextLabel.textContent = `(${playerIdx + 1}/${this.state.players.length})`;
    document.getElementById('modal-content').appendChild(nextLabel);

    if (playerIdx < this.state.players.length - 1) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-secondary';
      nextBtn.textContent = `下一位: ${this.state.players[playerIdx + 1].name}`;
      nextBtn.onclick = () => this.openCardUseForPlayer(playerIdx + 1);
      document.getElementById('modal-content').appendChild(nextBtn);
    }
  },

  cardNeedsTarget(card) {
    return !['shield', 'double', 'swap_all'].includes(card.effect);
  },

  canTargetCard(card, playerIdx, targetIdx) {
    const player = this.state.players[playerIdx];
    const target = this.state.players[targetIdx];

    if (!card || !player || !target) return false;

    if (['thief', 'swap_score', 'steal_weapon'].includes(card.effect) && playerIdx === targetIdx) {
      return false;
    }

    if (['reroll'].includes(card.effect)) {
      return target.weapons.some(Boolean);
    }

    if (card.effect === 'steal_weapon') {
      return player.weapons.some(Boolean) && target.weapons.some(Boolean);
    }

    if (card.effect === 'swap_all') {
      return this.state.players.filter(item => item.weapons.some(Boolean)).length >= 2;
    }

    return true;
  },

  handleCardUse(playerIdx, cardIndex) {
    const player = this.state.players[playerIdx];
    const card = player.cards[cardIndex];

    if (!card) return;

    if (card.effect === 'swap_all' && this.state.players.filter(item => item.weapons.some(Boolean)).length < 2) {
      this.showModal(`
        <h3>现在还不能用这张卡</h3>
        <p class="modal-copy">至少要有两名玩家已经拥有武器，才能进行全队武器互换。</p>
        <button class="btn btn-primary" onclick="App.openCardUseForPlayer(${playerIdx})">返回</button>
      `);
      return;
    }

    if (!this.cardNeedsTarget(card)) {
      this.executeCard(playerIdx, cardIndex, null);
      return;
    }

    this.showModal(`
      <h3>使用 ${card.icon} ${card.name}</h3>
      <p class="modal-copy">${card.description}</p>
      <h4 class="modal-subtitle">选择目标</h4>
      <div class="target-selector">
        ${this.state.players.map((target, targetIdx) => {
          const enabled = this.canTargetCard(card, playerIdx, targetIdx);
          return `
            <button
              class="target-btn ${enabled ? '' : 'is-disabled'}"
              onclick="${enabled ? `App.executeCard(${playerIdx}, ${cardIndex}, ${targetIdx})` : ''}"
              ${enabled ? '' : 'disabled'}
            >
              ${target.name}
            </button>
          `;
        }).join('')}
      </div>
      <button class="btn btn-secondary" onclick="App.openCardUseForPlayer(${playerIdx})">取消</button>
    `);
  },

  drawWeaponFromTaken(takenIds) {
    const pool = this.buildWeightedPool(takenIds);
    const result = weightedRandom(pool);
    takenIds.push(result.id);
    return { ...result };
  },

  getTakenWeaponIds({ ignorePlayerIndexes = [] } = {}) {
    const takenIds = [];
    this.state.players.forEach((player, playerIdx) => {
      if (ignorePlayerIndexes.includes(playerIdx)) return;
      player.weapons.forEach(weapon => {
        if (weapon) takenIds.push(weapon.id);
      });
    });
    return takenIds;
  },

  buildWeightedPool(takenIds = []) {
    const basePool = getWeaponsForMap(this.state.map);
    return basePool.map(weapon => {
      const count = takenIds.filter(id => id === weapon.id).length;
      return {
        ...weapon,
        weight: count === 0 ? weapon.weight : weapon.weight * Math.pow(0.15, count),
      };
    });
  },

  getWeightedPool(options = {}) {
    return this.buildWeightedPool(this.getTakenWeaponIds(options));
  },

  executeCard(playerIdx, cardIndex, targetIdx) {
    const player = this.state.players[playerIdx];
    const card = player.cards[cardIndex];

    if (!card) return;

    if (targetIdx !== null && !this.canTargetCard(card, playerIdx, targetIdx)) {
      return;
    }

    switch (card.effect) {
      case 'shield':
      case 'double':
        player.activeCards.push(card.effect);
        break;

      case 'thief':
        player.activeCards.push('thief');
        player.thiefTarget = targetIdx;
        break;

      case 'swap_score':
        player.activeCards.push('swap_score');
        player.swapTarget = targetIdx;
        break;

      case 'melee_only':
      case 'no_scope':
      case 'no_meds':
        this.state.players[targetIdx].roundEffects.push(card.effect);
        break;

      case 'reroll': {
        const target = this.state.players[targetIdx];
        if (!target.weapons.some(Boolean)) {
          this.showModal(`
            <h3>该玩家还没有武器</h3>
            <p class="modal-copy">等目标抽完武器后，再用这张卡更有节目效果。</p>
            <button class="btn btn-primary" onclick="App.openCardUseForPlayer(${playerIdx})">返回</button>
          `);
          return;
        }

        const takenIds = this.getTakenWeaponIds({ ignorePlayerIndexes: [targetIdx] });
        target.weapons[0] = this.drawWeaponFromTaken(takenIds);
        target.weapons[1] = this.drawWeaponFromTaken(takenIds);

        player.cards.splice(cardIndex, 1);
        this.renderPlayerStatusCards();
        this.syncRoundButtons();
        this.saveState();
        this.showModal(`
          <h3>${target.name} 的武器已重新随机</h3>
          <div class="result-summary">
            <p>主武器: <strong>${target.weapons[0].name}</strong></p>
            <p>副武器: <strong>${target.weapons[1].name}</strong></p>
          </div>
          <button class="btn btn-primary" onclick="App.closeModal()">确认</button>
        `);
        return;
      }

      case 'swap_all':
        this.showSwapAllUI(playerIdx, cardIndex);
        return;

      case 'steal_weapon':
        this.showWeaponSwapSelector(playerIdx, cardIndex, targetIdx);
        return;

      default:
        break;
    }

    player.cards.splice(cardIndex, 1);
    this.renderPlayerStatusCards();
    this.syncRoundButtons();
    this.closeModal();
    this.saveState();
  },

  showWeaponSwapSelector(playerIdx, cardIndex, targetIdx) {
    const player = this.state.players[playerIdx];
    const target = this.state.players[targetIdx];

    if (!player.weapons.some(Boolean) || !target.weapons.some(Boolean)) {
      this.showModal(`
        <h3>双方都需要已有武器</h3>
        <p class="modal-copy">等双方至少抽到 1 把武器后，再使用交换类卡牌。</p>
        <button class="btn btn-primary" onclick="App.openCardUseForPlayer(${playerIdx})">返回</button>
      `);
      return;
    }

    const combinations = [];
    player.weapons.forEach((myWeapon, mySlot) => {
      target.weapons.forEach((targetWeapon, targetSlot) => {
        if (myWeapon && targetWeapon) {
          combinations.push({
            mySlot,
            targetSlot,
            label: `你的${mySlot === 0 ? '主' : '副'}武器 ${myWeapon.name} ↔ ${target.name} 的${targetSlot === 0 ? '主' : '副'}武器 ${targetWeapon.name}`,
          });
        }
      });
    });

    this.showModal(`
      <h3>选择要交换的武器</h3>
      <div class="swap-grid">
        ${combinations.map(item => `
          <button
            class="swap-option"
            onclick="App.completeWeaponSwap(${playerIdx}, ${targetIdx}, ${item.mySlot}, ${item.targetSlot}, ${cardIndex})"
            type="button"
          >
            ${item.label}
          </button>
        `).join('')}
      </div>
      <button class="btn btn-secondary" onclick="App.openCardUseForPlayer(${playerIdx})">取消</button>
    `);
  },

  completeWeaponSwap(playerIdx, targetIdx, mySlot, targetSlot, cardIndex) {
    const player = this.state.players[playerIdx];
    const target = this.state.players[targetIdx];
    const myWeapon = player.weapons[mySlot];
    const targetWeapon = target.weapons[targetSlot];

    player.weapons[mySlot] = targetWeapon;
    target.weapons[targetSlot] = myWeapon;
    player.cards.splice(cardIndex, 1);

    this.renderPlayerStatusCards();
    this.syncRoundButtons();
    this.saveState();
    this.showModal(`
      <h3>交换完成</h3>
      <div class="result-summary">
        <p>${player.name} 获得 <strong>${targetWeapon.name}</strong></p>
        <p>${target.name} 获得 <strong>${myWeapon.name}</strong></p>
      </div>
      <button class="btn btn-primary" onclick="App.closeModal()">确认</button>
    `);
  },

  showSwapAllUI(playerIdx, cardIndex) {
    const players = this.state.players;
    const weaponPairs = players.map(player => player.weapons.map(weapon => weapon ? { ...weapon } : null));
    const shuffled = [...weaponPairs].sort(() => Math.random() - 0.5);

    players.forEach((player, index) => {
      player.weapons = shuffled[index];
    });

    players[playerIdx].cards.splice(cardIndex, 1);
    this.renderPlayerStatusCards();
    this.syncRoundButtons();
    this.saveState();

    this.showModal(`
      <h3>${players[playerIdx].name} 发动全队武器互换</h3>
      <p class="modal-copy">本次效果按随机重分配处理。</p>
      <div class="result-summary">
        ${players.map(player => `
          <p><strong>${player.name}</strong>: ${(player.weapons[0] && player.weapons[1])
            ? `${player.weapons[0].name} / ${player.weapons[1].name}`
            : '暂无完整武器组'}</p>
        `).join('')}
      </div>
      <button class="btn btn-primary" onclick="App.closeModal()">确认</button>
    `);
  },

  startWeaponSpin() {
    if (this.state.wheelMode === 'simultaneous') {
      this.spinAllSimultaneous();
      return;
    }

    this.currentSpinPlayer = 0;
    this.currentSpinSlot = 0;
    this.state.spinState = {
      playerIndex: 0,
      slotIndex: 0,
    };
    this.renderWeaponDrawScreen();
  },

  renderWeaponDrawScreen() {
    while (this.currentSpinPlayer < this.state.players.length) {
      const p = this.state.players[this.currentSpinPlayer];
      if (p.roundEffects.includes('melee_only')) {
        this.currentSpinPlayer++;
        this.currentSpinSlot = 0;
        continue;
      }
      break;
    }

    const player = this.state.players[this.currentSpinPlayer];
    if (!player) {
      this.afterAllWeaponsDrawn();
      return;
    }

    const map = getMapById(this.state.map);
    const slotLabel = this.currentSpinSlot === 0 ? '第 1 把 · 主武器' : '第 2 把 · 副武器';
    const historyHtml = player.weapons
      .map((weapon, slotIndex) => {
        if (!weapon) return '';
        const slotName = slotIndex === 0 ? '主武器' : '副武器';
        return `
          <div class="draw-result-display">
            <div class="result-weapon">${slotName}: ${weapon.name}</div>
            <div class="result-info">
              <span>${WEAPON_TYPES[weapon.type].name}</span>
            </div>
          </div>
        `;
      })
      .join('');

    document.getElementById('draw-map-chip').textContent = map.shortName;
    document.getElementById('draw-order-chip').textContent = `${player.name} · ${this.currentSpinPlayer + 1}/${this.state.players.length}`;
    document.getElementById('draw-player-name').textContent = player.name;
    document.getElementById('draw-subtitle').textContent = slotLabel;
    document.getElementById('draw-history').innerHTML = historyHtml;

    WeaponDraw.init(this.getWeightedPool(), result => {
      this.onWeaponResult(result);
    });

    const button = document.getElementById('btn-draw');
    button.textContent = '抽取！';
    button.onclick = () => WeaponDraw.draw();

    this.state.spinState = {
      playerIndex: this.currentSpinPlayer,
      slotIndex: this.currentSpinSlot,
    };

    this.showView('view-weapon-draw', false);
    this.saveState();
  },

  onWeaponResult(weapon) {
    const player = this.state.players[this.currentSpinPlayer];
    player.weapons[this.currentSpinSlot] = { ...weapon };

    if (this.currentSpinSlot === 0) {
      this.currentSpinSlot = 1;
    } else {
      this.currentSpinPlayer++;
      this.currentSpinSlot = 0;
    }

    this.state.spinState = {
      playerIndex: this.currentSpinPlayer,
      slotIndex: this.currentSpinSlot,
    };
    this.saveState();

    const button = document.getElementById('btn-draw');
    if (this.currentSpinPlayer >= this.state.players.length) {
      button.textContent = '全员抽取完毕！';
      button.onclick = () => this.afterAllWeaponsDrawn();
      return;
    }

    button.textContent = this.currentSpinSlot === 0 ? `下一位: ${this.state.players[this.currentSpinPlayer].name}` : '继续抽副武器';
    button.onclick = () => this.renderWeaponDrawScreen();
  },

  spinAllSimultaneous() {
    const takenIds = [];

    this.state.players.forEach(player => {
      if (player.roundEffects.includes('melee_only')) return;
      player.weapons[0] = this.drawWeaponFromTaken(takenIds);
      player.weapons[1] = this.drawWeaponFromTaken(takenIds);
    });

    this.afterAllWeaponsDrawn();

    this.showModal(`
      <h3>同时抽取完成</h3>
      <div class="result-summary">
        ${this.state.players.map(player => {
          if (player.roundEffects.includes('melee_only')) return `<p><strong>${player.name}</strong>: 近战挑战 👊</p>`;
          return `<p><strong>${player.name}</strong>: ${player.weapons[0]?.name || '无'} / ${player.weapons[1]?.name || '无'}</p>`;
        }).join('')}
      </div>
      <button class="btn btn-primary" onclick="App.closeModal()">确认</button>
    `);
  },

  afterAllWeaponsDrawn() {
    this.renderRoundScreen();
    this.showView('view-round', false);
    this.saveState();
  },

  spinScopes() {
    this.state.players.forEach(player => {
      player.scope = weightedRandom(SCOPES);
    });

    this.renderRoundScreen();
    this.saveState();

    this.showModal(`
      <h3>瞄准镜抽取结果</h3>
      <div class="result-summary">
        ${this.state.players.map(player => `
          <p><strong>${player.name}</strong>: ${this.getPlayerScopeLabel(player)}</p>
        `).join('')}
      </div>
      <button class="btn btn-primary" onclick="App.closeModal()">确认</button>
    `);
  },

  getPlayerRestrictionSummary(player) {
    const details = [];

    if (player.roundEffects.includes('melee_only')) details.push('本局近战挑战，计分补偿 ×4');
    if (player.roundEffects.includes('no_scope')) details.push('4 倍以上倍镜禁用');
    if (player.roundEffects.includes('no_meds')) details.push('饮料和止痛药禁用');
    if (player.activePunishment) details.push(`惩罚: ${player.activePunishment.name} · ${player.activePunishment.description}`);

    return details;
  },

  showLoadout() {
    const map = getMapById(this.state.map);
    document.getElementById('loadout-map-chip').textContent = map.shortName;
    document.getElementById('loadout-round-chip').textContent = `第 ${this.state.currentRound} 局`;

    const container = document.getElementById('loadout-display');
    container.innerHTML = this.state.players.map(player => {
      const restrictions = this.getPlayerRestrictionSummary(player);
      return `
        <div class="loadout-player">
          <div class="player-name">${player.name}</div>
          ${player.weapons[0] ? `<div class="loadout-weapon"><span>${player.weapons[0].name}</span><span class="type-badge">${WEAPON_TYPES[player.weapons[0].type].name}</span></div>` : ''}
          ${player.weapons[1] ? `<div class="loadout-weapon"><span>${player.weapons[1].name}</span><span class="type-badge">${WEAPON_TYPES[player.weapons[1].type].name}</span></div>` : ''}
          ${player.scope ? `<span class="loadout-scope">${this.getPlayerScopeLabel(player)}</span>` : ''}
          ${restrictions.length ? `<div class="loadout-stack">${restrictions.map(item => `<span class="effect-tag">${item}</span>`).join('')}</div>` : ''}
        </div>
      `;
    }).join('');

    const activeEffects = [];
    this.state.players.forEach(player => {
      this.getPlayerRestrictionSummary(player).forEach(item => {
        activeEffects.push(`${player.name}: ${item}`);
      });
    });

    document.getElementById('active-effects').innerHTML = activeEffects.map(item => `<span class="effect-tag">${item}</span>`).join('');
    document.getElementById('loadout-subtitle').textContent = `${map.name} · ${this.getModeLabel()} · 装备锁定后请按本局限制进行游戏。`;

    this.showView('view-loadout', false);
    this.saveState();
  },

  goToMatch() {
    this.renderScoringView();
  },

  renderScoringView() {
    const map = getMapById(this.state.map);
    document.getElementById('scoring-map-chip').textContent = map.shortName;
    document.getElementById('scoring-round-chip').textContent = `第 ${this.state.currentRound} 局`;
    document.getElementById('scoring-round-number').textContent = this.state.currentRound;

    const inputs = document.getElementById('damage-inputs');
    inputs.innerHTML = this.state.players.map((player, index) => `
      <div class="damage-input-group">
        <label>${player.name}</label>
        <input type="number" id="damage-${index}" placeholder="输入伤害" min="0">
      </div>
    `).join('');

    const button = document.getElementById('btn-calculate');
    const animation = document.getElementById('scoring-animation');
    const ranking = document.getElementById('round-ranking');

    if (this.state.lastRoundSnapshot && this.state.lastRoundSnapshot.round === this.state.currentRound) {
      inputs.style.display = 'none';
      button.style.display = 'none';
      animation.style.display = 'block';
      animation.innerHTML = this.state.lastRoundSnapshot.animationHtml;
      ranking.style.display = 'block';
      ranking.innerHTML = this.state.lastRoundSnapshot.rankingHtml;
      this.renderPendingRewardCards();
    } else {
      inputs.style.display = 'grid';
      button.style.display = 'block';
      animation.style.display = 'none';
      animation.innerHTML = '';
      ranking.style.display = 'none';
      ranking.innerHTML = '';
      document.getElementById('post-round-cards').style.display = 'none';
      document.getElementById('post-round-card-area').innerHTML = '';
      document.getElementById('btn-next-round').style.display = 'none';
    }

    this.showView('view-scoring', false);
    this.saveState();
  },

  recordRoundResults(results) {
    const roundEntry = {
      round: this.state.currentRound,
      map: this.state.map,
      results: results.map((result, index) => ({
        playerIndex: index,
        playerName: result.player.name,
        damage: result.damage,
        tail: result.tail,
        finalScore: result.finalScore,
        op: result.op ? { op: result.op.op, label: result.op.label } : null,
        afterOp: result.afterOp,
        weaponType: result.weaponType,
        weaponName: result.weaponName,
        doubleCount: result.doubleCount || 0,
        meleeMultiplier: result.meleeMultiplier || 1,
        thiefStolen: result.thiefStolen || 0,
        thiefFrom: result.thiefFrom || null,
        swapped: result.swapped || null,
      })),
    };

    const existingIndex = this.state.roundHistory.findIndex(entry => entry.round === roundEntry.round);
    if (existingIndex >= 0) {
      this.state.roundHistory[existingIndex] = roundEntry;
    } else {
      this.state.roundHistory.push(roundEntry);
    }
  },

  captureScoringSnapshot() {
    this.state.lastRoundSnapshot = {
      round: this.state.currentRound,
      animationHtml: document.getElementById('scoring-animation').innerHTML,
      rankingHtml: document.getElementById('round-ranking').innerHTML,
    };
  },

  setPendingRewards(sortedResults) {
    const topPlayer = sortedResults[0].player;
    const bottomPlayer = sortedResults[sortedResults.length - 1].player;

    const rewardPlayerIndexes = [this.state.players.indexOf(topPlayer), this.state.players.indexOf(bottomPlayer)];
    this.state.pendingRewardPlayers = rewardPlayerIndexes.map(playerIndex => {
      const player = this.state.players[playerIndex];
      return {
        playerIndex,
        status: player.cards.length >= 2 ? 'full' : 'pending',
        card: null,
      };
    });
  },

  renderPendingRewardCards() {
    const entries = this.state.pendingRewardPlayers || [];
    const area = document.getElementById('post-round-cards');
    const container = document.getElementById('post-round-card-area');
    const nextButton = document.getElementById('btn-next-round');

    if (!entries.length) {
      area.style.display = 'none';
      nextButton.style.display = 'block';
      return;
    }

    area.style.display = 'block';
    container.innerHTML = '';

    const desc = document.createElement('p');
    desc.className = 'reward-desc';
    desc.innerHTML = entries
      .map(entry => `<strong>${this.state.players[entry.playerIndex].name}</strong>`)
      .join(' 和 ') + ' 抽取事件卡';
    container.appendChild(desc);

    const grid = document.createElement('div');
    grid.className = 'reward-grid';
    container.appendChild(grid);

    entries.forEach(entry => {
      const player = this.state.players[entry.playerIndex];
      const slot = document.createElement('div');
      slot.className = 'reward-slot';
      slot.innerHTML = `<p class="reward-player-name">${player.name}</p>`;

      if (entry.status === 'full') {
        slot.insertAdjacentHTML('beforeend', '<p class="reward-full">手牌已满（2张）</p>');
      } else if (entry.status === 'drawn' && entry.card) {
        const html = Cards.renderCardFront(entry.card);
        slot.insertAdjacentHTML('beforeend', html.replace('card-front', 'card-front no-anim'));
      } else {
        Cards.renderCardBack(slot, card => {
          player.cards.push(card);
          entry.status = 'drawn';
          entry.card = card;
          this.renderPlayerStatusCards();
          this.saveState();
          this.renderPendingRewardCards();
        });
      }

      grid.appendChild(slot);
    });

    const allDone = entries.every(entry => entry.status !== 'pending');
    nextButton.style.display = allDone ? 'block' : 'none';
    if (allDone) {
      const isLast = this.state.currentRound >= this.state.totalRounds;
      nextButton.textContent = isLast ? '结束本轮' : '下一局';
    }
    this.saveState();
  },

  nextRound() {
    this.state.pendingRewardPlayers = [];
    this.state.lastRoundSnapshot = null;

    if (this.state.currentRound >= this.state.totalRounds) {
      this.renderFinal();
      return;
    }

    this.showPunishment();
  },

  showPunishment() {
    const players = this.state.players;
    const weights = players.map(p => {
      const base = 25;
      const reduction = (p.punishmentDrawCount || 0) * 8;
      return Math.max(2, base - reduction);
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let rand = Math.random() * totalWeight;
    let chosenIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { chosenIndex = i; break; }
    }

    const chosen = players[chosenIndex];
    chosen.punishmentDrawCount = (chosen.punishmentDrawCount || 0) + 1;

    const punishment = Cards.drawPunishmentCard();
    chosen.activePunishment = punishment;
    chosen.punishmentExpiresAfterRound = this.state.currentRound + 1;

    const probabilities = weights.map((w, i) => ({
      name: players[i].name,
      pct: Math.round(w / totalWeight * 100),
    }));

    this.state.pendingPunishment = {
      playerIndex: chosenIndex,
      punishment,
      rerolled: false,
      cost: 0,
      probabilities,
    };

    this.renderPunishmentView();
  },

  renderPunishmentView() {
    const data = this.state.pendingPunishment;
    if (!data) return;

    const player = this.state.players[data.playerIndex];

    document.getElementById('punishment-phase-chip').textContent = `第 ${this.state.currentRound} 局结束`;
    const isLast = this.state.currentRound >= this.state.totalRounds;
    document.getElementById('punishment-round-chip').textContent = isLast ? '最后一局' : `下一局生效`;

    document.getElementById('phase-summary').innerHTML = '';

    document.getElementById('punishment-area').innerHTML = `
      <p class="punishment-lead"><strong>${player.name}</strong> 被随机选中！</p>
      ${Cards.renderPunishmentCard(data.punishment)}
      ${!data.rerolled ? `
        <button class="btn btn-reroll" onclick="App.rerollPunishment()">
          扣 3 分重抽一次
        </button>
      ` : `<p class="punishment-note">已重抽，扣除 3 分</p>`}
    `;

    this.showView('view-punishment', false);
    this.saveState();
  },

  rerollPunishment() {
    const data = this.state.pendingPunishment;
    if (!data || data.rerolled) return;

    const player = this.state.players[data.playerIndex];
    const cost = 3;
    let newPunishment = Cards.drawPunishmentCard();
    let guard = 0;

    while (newPunishment.id === data.punishment.id && guard < 8) {
      newPunishment = Cards.drawPunishmentCard();
      guard++;
    }

    this.addScoreAdjustment(player, this.state.currentRound - 1, {
      label: '惩罚重抽',
      amount: -cost,
    });

    player.activePunishment = newPunishment;
    player.punishmentExpiresAfterRound = this.state.currentRound + 1;
    data.punishment = newPunishment;
    data.rerolled = true;
    data.cost = cost;

    this.recalculateTotals();
    this.renderPunishmentView();
  },

  afterPunishment() {
    this.state.pendingPunishment = null;

    if (this.state.currentRound >= this.state.totalRounds) {
      this.renderFinal();
      return;
    }

    this.state.currentRound++;
    this.enterRound({ fresh: true });
  },

  buildFinalSummary(sortedPlayers) {
    const map = getMapById(this.state.map);
    const bestRound = [];

    this.state.players.forEach(player => {
      player.scores.forEach((score, roundIndex) => {
        bestRound.push({
          playerName: player.name,
          round: roundIndex + 1,
          score: score + this.getScoreAdjustmentTotal(player, roundIndex),
        });
      });
    });

    bestRound.sort((left, right) => right.score - left.score);
    const highestSingle = bestRound[0];
    const winner = sortedPlayers[0];

    return `
      <div class="summary-card">
        <span>冠军</span>
        <strong>${winner.name}</strong>
        <em>${winner.totalScore} 分</em>
      </div>
      <div class="summary-card">
        <span>最佳单局</span>
        <strong>${highestSingle ? highestSingle.playerName : '-'}</strong>
        <em>${highestSingle ? `第 ${highestSingle.round} 局 · ${highestSingle.score} 分` : '暂无记录'}</em>
      </div>
      <div class="summary-card">
        <span>地图</span>
        <strong>${map.shortName}</strong>
        <em>${map.vibe}</em>
      </div>
      <div class="summary-card">
        <span>局数</span>
        <strong>${this.state.totalRounds} 局</strong>
        <em>${this.getModeLabel()}</em>
      </div>
    `;
  },

  buildScoreCell(player, roundIndex) {
    const baseScore = player.scores[roundIndex];
    const adjustments = player.scoreAdjustments?.[roundIndex] || [];
    const adjustmentTotal = this.getScoreAdjustmentTotal(player, roundIndex);

    if (baseScore === undefined && !adjustments.length) {
      return '-';
    }

    if (!adjustments.length) {
      return String(baseScore || 0);
    }

    const net = (baseScore || 0) + adjustmentTotal;
    const detail = adjustments.map(item => `${item.label} ${item.amount > 0 ? '+' : ''}${item.amount}`).join(' / ');
    return `
      <div class="score-cell">
        <strong>${net}</strong>
        <span>${detail}</span>
      </div>
    `;
  },

  renderFinal() {
    this.recalculateTotals();

    const map = getMapById(this.state.map);
    const sortedPlayers = [...this.state.players].sort((left, right) => right.totalScore - left.totalScore);
    document.getElementById('final-map-chip').textContent = map.shortName;
    document.getElementById('final-rounds-chip').textContent = `${this.state.totalRounds} 局制`;
    document.getElementById('final-summary').innerHTML = this.buildFinalSummary(sortedPlayers);

    document.getElementById('final-ranking').innerHTML = sortedPlayers.map((player, index) => {
      const rank = index + 1;
      return `
        <div class="rank-row">
          <div class="rank-position rank-${rank}">${rank}</div>
          <div class="rank-name">${player.name}</div>
          <div class="rank-score">${player.totalScore}</div>
        </div>
      `;
    }).join('');

    let tableHtml = '<table><thead><tr><th>局数</th>';
    this.state.players.forEach(player => {
      tableHtml += `<th>${player.name}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    const totalRounds = Math.max(...this.state.players.map(player => player.scores.length));
    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
      tableHtml += `<tr><td>第 ${roundIndex + 1} 局</td>`;
      this.state.players.forEach(player => {
        tableHtml += `<td>${this.buildScoreCell(player, roundIndex)}</td>`;
      });
      tableHtml += '</tr>';
    }

    tableHtml += '<tr class="total-row"><td>总分</td>';
    this.state.players.forEach(player => {
      tableHtml += `<td>${player.totalScore}</td>`;
    });
    tableHtml += '</tr></tbody></table>';

    document.getElementById('score-details').innerHTML = tableHtml;
    this.showView('view-final', false);
    this.saveState();
  },

  restart() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.createInitialState();
    this.currentSpinPlayer = 0;
    this.currentSpinSlot = 0;
    this.renderMapSelector();
    this.populateSetupForm();
    this.renderMapPreview();
    this.showView('view-setup', false);
  },

  saveState() {
    this.state.spinState = {
      playerIndex: this.currentSpinPlayer,
      slotIndex: this.currentSpinSlot,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  restoreFromCurrentView() {
    switch (this.state.currentView) {
      case 'view-initial-cards':
        this.renderInitialCards();
        this.showView('view-initial-cards', false);
        break;

      case 'view-loadout':
        this.renderRoundScreen();
        this.showLoadout();
        break;

      case 'view-scoring':
        this.renderScoringView();
        break;

      case 'view-punishment':
        this.renderPunishmentView();
        break;

      case 'view-final':
        this.renderFinal();
        break;

      case 'view-weapon-draw':
        this.currentSpinPlayer = this.state.spinState?.playerIndex || 0;
        this.currentSpinSlot = this.state.spinState?.slotIndex || 0;
        this.renderWeaponDrawScreen();
        break;

      case 'view-round':
      default:
        this.renderRoundScreen();
        this.showView('view-round', false);
        this.saveState();
        break;
    }
  },

  loadState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return;

    try {
      const parsed = JSON.parse(savedState);
      const hydrated = this.hydrateState(parsed);

      if (!hydrated.players.length || hydrated.currentRound <= 0) {
        return;
      }

      const resume = confirm('检测到未完成的游戏，是否继续？');
      if (!resume) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      this.state = hydrated;
      this.currentSpinPlayer = this.state.spinState?.playerIndex || 0;
      this.currentSpinSlot = this.state.spinState?.slotIndex || 0;
      this.renderMapSelector();
      this.populateSetupForm();
      this.renderMapPreview();
      this.restoreFromCurrentView();
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();

  document.getElementById('modal-overlay').addEventListener('click', event => {
    if (event.target === event.currentTarget) {
      App.closeModal();
    }
  });
});
