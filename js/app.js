const STORAGE_KEY = 'pubg_game_state_v3';
const PLAYER_LIBRARY_KEY = 'pubg_player_library_v1';

const App = {
  state: null,
  playerLibrary: [],
  activePlayerInputIndex: 0,
  currentSpinPlayer: 0,
  currentSpinSlot: 0,
  cardPhaseSession: null,

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
      pendingPunishments: [],
      drawHistory: normalizeDrawHistory(),
      lastRoundSnapshot: null,
      cardPhaseCompleted: false,
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
      scopes: [],
      cards: [],
      scores: [],
      scoreAdjustments: [],
      totalScore: 0,
      activePunishment: null,
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
        scopes: Array.isArray(player.scopes)
          ? player.scopes
          : player.scope
            ? [player.scope]
            : [],
        cards: Array.isArray(player.cards) ? player.cards : [],
        scores: Array.isArray(player.scores) ? player.scores : [],
        scoreAdjustments: Array.isArray(player.scoreAdjustments) ? player.scoreAdjustments : [],
        activeCards: Array.isArray(player.activeCards) ? player.activeCards : [],
        roundEffects: Array.isArray(player.roundEffects) ? player.roundEffects : [],
      })),
      roundHistory: Array.isArray(savedState.roundHistory) ? savedState.roundHistory : [],
      pendingRewardPlayers: Array.isArray(savedState.pendingRewardPlayers) ? savedState.pendingRewardPlayers : [],
      pendingPunishments: Array.isArray(savedState.pendingPunishments) ? savedState.pendingPunishments : [],
      drawHistory: normalizeDrawHistory(savedState.drawHistory),
      spinState: savedState.spinState || base.spinState,
      cardPhaseCompleted: Boolean(savedState.cardPhaseCompleted),
    };

    if (!hydrated.players.length) {
      hydrated.currentView = 'view-setup';
    }

    hydrated.map = getMapById(hydrated.map) ? hydrated.map : base.map;

    return hydrated;
  },

  init() {
    this.state = this.createInitialState();
    this.playerLibrary = this.loadPlayerLibrary();
    this.attachSetupListeners();

    const restored = this.loadState();
    if (!restored) {
      this.populateSetupForm();
      this.renderPlayerLibrary();
      this.syncTheme();
      this.showView('view-setup', false);
    }
  },

  attachSetupListeners() {
    for (let index = 0; index < 4; index++) {
      const input = document.getElementById(`player-${index + 1}`);
      if (!input) continue;

      input.addEventListener('focus', () => {
        this.selectPlayerSlot(index);
      });
    }

    const rosterInput = document.getElementById('roster-name-input');
    if (rosterInput) {
      rosterInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.addPlayerLibraryName();
        }
      });
    }
  },

  loadPlayerLibrary() {
    const saved = localStorage.getItem(PLAYER_LIBRARY_KEY);
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed
          .map(name => String(name || '').trim())
          .filter(Boolean)
        : [];
    } catch (error) {
      return [];
    }
  },

  savePlayerLibrary() {
    localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(this.playerLibrary));
  },

  rememberNames(names) {
    const nextLibrary = [...this.playerLibrary];
    names.forEach(name => {
      if (name && !nextLibrary.includes(name)) {
        nextLibrary.push(name);
      }
    });
    this.playerLibrary = nextLibrary;
    this.savePlayerLibrary();
    this.renderPlayerLibrary();
  },

  renderPlayerLibrary() {
    const container = document.getElementById('player-library-list');
    if (!container) return;

    container.innerHTML = this.playerLibrary.length
      ? this.playerLibrary.map(name => `
          <button class="library-chip" type="button" onclick="App.usePlayerLibraryName('${name.replace(/'/g, "\\'")}')">
            ${name}
          </button>
        `).join('')
      : '';

    document.querySelectorAll('.player-slot').forEach((slot, index) => {
      slot.classList.toggle('is-active', index === this.activePlayerInputIndex);
    });
  },

  selectPlayerSlot(index) {
    this.activePlayerInputIndex = index;
    this.renderPlayerLibrary();
  },

  getPreferredPlayerSlotIndex() {
    if (this.activePlayerInputIndex >= 0) {
      return this.activePlayerInputIndex;
    }

    for (let index = 0; index < 4; index++) {
      const value = document.getElementById(`player-${index + 1}`)?.value.trim();
      if (!value) return index;
    }

    return 0;
  },

  usePlayerLibraryName(name) {
    const slotIndex = this.getPreferredPlayerSlotIndex();
    const input = document.getElementById(`player-${slotIndex + 1}`);
    if (!input) return;

    input.value = name;
    input.focus();
    this.selectPlayerSlot(slotIndex);
  },

  addPlayerLibraryName() {
    const input = document.getElementById('roster-name-input');
    if (!input) return;

    const name = input.value.trim();
    if (!name) return;

    if (!this.playerLibrary.includes(name)) {
      this.playerLibrary.push(name);
      this.savePlayerLibrary();
    }

    input.value = '';
    this.renderPlayerLibrary();
    this.usePlayerLibraryName(name);
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

  enhanceAccordions(root = document) {
    root.querySelectorAll('details[data-accordion]').forEach(details => {
      if (details.dataset.accordionBound === 'true') return;

      const summary = details.querySelector('summary');
      const content = details.querySelector('[data-accordion-content]');
      if (!summary || !content) return;

      details.dataset.accordionBound = 'true';
      details.classList.toggle('is-open', details.open);
      content.style.height = details.open ? 'auto' : '0px';

      summary.addEventListener('click', event => {
        event.preventDefault();
        this.toggleAccordion(details);
      });
    });
  },

  toggleAccordion(details) {
    const content = details.querySelector('[data-accordion-content]');
    const inner = content?.firstElementChild;
    if (!content || !inner || details.dataset.animating === 'true') return;

    const isOpening = !details.open;
    const group = details.dataset.accordionGroup;
    const startHeight = content.offsetHeight;
    const targetHeight = inner.scrollHeight;

    if (isOpening && group) {
      details.parentElement?.querySelectorAll(`details[data-accordion][data-accordion-group="${group}"]`).forEach(other => {
        if (other !== details && other.open && other.dataset.animating !== 'true') {
          this.toggleAccordion(other);
        }
      });
    }

    details.dataset.animating = 'true';
    content.style.height = `${startHeight}px`;

    if (isOpening) {
      details.open = true;
      requestAnimationFrame(() => {
        details.classList.add('is-open');
        content.style.height = `${targetHeight}px`;
      });
    } else {
      requestAnimationFrame(() => {
        details.classList.remove('is-open');
        content.style.height = '0px';
      });
    }

    const handleTransitionEnd = transitionEvent => {
      if (transitionEvent.propertyName !== 'height') return;

      content.removeEventListener('transitionend', handleTransitionEnd);
      details.dataset.animating = 'false';

      if (isOpening) {
        content.style.height = 'auto';
      } else {
        details.open = false;
      }
    };

    content.addEventListener('transitionend', handleTransitionEnd);
  },

  populateSetupForm() {
    document.getElementById('total-rounds').value = String(this.state.totalRounds);

    for (let index = 0; index < 4; index++) {
      const input = document.getElementById(`player-${index + 1}`);
      if (!input) continue;
      input.value = this.state.players[index]?.name || '';
    }

    this.selectPlayerSlot(0);
  },

  renderMapSelector() {
    const container = document.getElementById('round-map-selector');
    if (!container) return;

    container.innerHTML = MAPS.map(map => `
        <button
          class="map-card ${map.id === this.state.map ? 'selected' : ''}"
          data-map="${map.id}"
          onclick="App.selectMap('${map.id}')"
          type="button"
        >
          <span class="map-name">${map.name}</span>
          <span class="map-size">${map.size}</span>
        </button>
      `
    ).join('');
  },

  renderMapPreview() {
    const preview = document.getElementById('round-map-preview');
    if (!preview) return;

    const map = getMapById(this.state.map);
    const weapons = getWeaponsForMap(this.state.map);
    const exclusive = getExclusiveWeaponsForMap(this.state.map).map(weapon => weapon.name);
    const poolHtml = Object.keys(WEAPON_TYPES).map((type, index) => {
      const typedWeapons = getWeaponsByType(weapons, type);
      return `
        <details class="weapon-pool-group" data-accordion data-accordion-group="weapon-pool">
          <summary class="weapon-pool-summary">
            <span>${WEAPON_TYPES[type].name}</span>
            <strong>${typedWeapons.length} 把</strong>
          </summary>
          <div class="weapon-pool-content" data-accordion-content>
            <div class="weapon-pool-list">
              ${typedWeapons.map(weapon => `<span class="weapon-pill">${weapon.name}</span>`).join('')}
            </div>
          </div>
        </details>
      `;
    }).join('');

    preview.innerHTML = `
      <div class="map-preview-head">
        <span class="map-preview-kicker">本局地图</span>
        <h3>${map.name}</h3>
      </div>
      <div class="map-preview-meta">
        <div class="preview-inline-stat">
          <span>尺寸</span>
          <strong>${map.size}</strong>
        </div>
        <div class="preview-inline-stat preview-inline-stat-tags">
          <span>专属枪械</span>
          <div class="preview-tags">
            ${(exclusive.length ? exclusive : ['当前无专属主武器']).map(item => `<span class="preview-tag">${item}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="map-preview-block map-preview-block-pool">
        <span class="preview-label">枪池概览</span>
        <div class="weapon-pool-groups">${poolHtml}</div>
      </div>
    `;

    this.enhanceAccordions(preview);
  },

  renderRoundMapSelection() {
    document.getElementById('map-pick-round-chip').textContent = `第 ${this.state.currentRound}/${this.state.totalRounds} 局`;
    document.getElementById('map-pick-mode-chip').textContent = this.getModeLabel();
    this.renderMapSelector();
    this.renderMapPreview();
    this.showView('view-map-select', false);
    this.saveState();
  },

  selectMap(mapId) {
    this.state.map = mapId;
    this.renderMapSelector();
    this.renderMapPreview();
    this.syncTheme();
    this.saveState();
  },

  confirmRoundMap() {
    this.drawRoundPunishments();
  },

  getModeLabel() {
    return '同时抽取';
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
    player.scopes = [];
    player.activePunishment = null;
    player.activeCards = [];
    player.roundEffects = [];
    player.thiefTarget = null;
    player.swapTarget = null;
  },

  clearRoundArtifacts() {
    this.state.pendingRewardPlayers = [];
    this.state.pendingPunishments = [];
    this.state.lastRoundSnapshot = null;
    this.state.cardPhaseCompleted = false;
  },

  prepareRoundSetup() {
    this.clearRoundArtifacts();
    this.state.players.forEach(player => this.resetPlayerRoundState(player));
    this.currentSpinPlayer = 0;
    this.currentSpinSlot = 0;
    this.cardPhaseSession = null;
    this.state.spinState = {
      playerIndex: 0,
      slotIndex: 0,
    };

    this.renderRoundMapSelection();
  },

  startGame() {
    const names = [];
    const customNames = [];
    for (let index = 1; index <= 4; index++) {
      const input = document.getElementById(`player-${index}`);
      const trimmed = input.value.trim();
      names.push(trimmed || `玩家${index}`);
      if (trimmed) {
        customNames.push(trimmed);
      }
    }

    this.state = this.createInitialState();
    this.state.totalRounds = parseInt(document.getElementById('total-rounds').value, 10);
    this.state.wheelMode = 'simultaneous';
    this.state.players = names.map(name => this.createPlayer(name));
    this.rememberNames(customNames);
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
    this.prepareRoundSetup();
  },

  drawRoundPunishments() {
    const playerIndexes = shuffleArray(this.state.players.map((_, index) => index)).slice(0, Math.min(2, this.state.players.length));
    const usedPunishmentIds = [];

    this.state.pendingPunishments = playerIndexes.map(playerIndex => {
      const punishment = Cards.drawPunishmentCard(this.state, { excludeIds: usedPunishmentIds });
      if (punishment) {
        usedPunishmentIds.push(punishment.id);
      }
      this.state.players[playerIndex].activePunishment = punishment;
      return {
        playerIndex,
        punishment,
        rerolled: false,
        cost: 0,
      };
    });

    this.renderPunishmentView();
  },

  renderPunishmentView() {
    const entries = this.state.pendingPunishments || [];
    document.getElementById('punishment-phase-chip').textContent = `第 ${this.state.currentRound}/${this.state.totalRounds} 局`;
    document.getElementById('punishment-round-chip').textContent = '随机两人抽取';
    document.getElementById('phase-summary').innerHTML = `
      <div class="phase-summary-card">
        <strong>本局开始时随机两名玩家抽取惩罚卡</strong>
        <span>惩罚立即生效，若想重抽，仍然可以扣 3 分换一次。</span>
      </div>
    `;

    document.getElementById('punishment-area').innerHTML = `
      <div class="punishment-grid">
        ${entries.map((entry, entryIndex) => {
          const player = this.state.players[entry.playerIndex];
          return `
            <div class="punishment-player-card">
              <p class="punishment-player-name">${player.name}</p>
              ${Cards.renderPunishmentCard(entry.punishment)}
              ${entry.rerolled
                ? '<p class="punishment-note">已重抽，扣除 3 分</p>'
                : `<button class="btn btn-reroll" onclick="App.rerollPunishment(${entryIndex})">扣 3 分重抽</button>`}
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('btn-punishment-done').textContent = '进入本局';
    this.showView('view-punishment', false);
    this.saveState();
  },

  rerollPunishment(entryIndex) {
    const entry = this.state.pendingPunishments?.[entryIndex];
    if (!entry || entry.rerolled) return;

    const player = this.state.players[entry.playerIndex];
    const excludeIds = this.state.pendingPunishments
      .map((item, index) => (index === entryIndex ? item.punishment?.id : item.punishment?.id))
      .filter(Boolean);
    const newPunishment = Cards.drawPunishmentCard(this.state, { excludeIds });

    if (!newPunishment) {
      return;
    }

    this.addScoreAdjustment(player, this.state.currentRound - 1, {
      label: '惩罚重抽',
      amount: -3,
    });

    player.activePunishment = newPunishment;
    entry.punishment = newPunishment;
    entry.rerolled = true;
    entry.cost = 3;

    this.recalculateTotals();
    this.renderPunishmentView();
  },

  afterPunishment() {
    this.state.pendingPunishments = [];
    this.saveState();
    this.runRoundEquipmentDraw();
  },

  runRoundEquipmentDraw() {
    this.currentDrawSlot = 0;
    this.renderWeaponDrawPage();
    setTimeout(() => this.drawAllWeapons(), 450);
  },

  areAllWeaponsDrawn() {
    return this.state.players.every(player => player.weapons.every(Boolean));
  },

  areAllScopesDrawn() {
    return this.state.players.every(player => player.scopes.length >= 2);
  },

  renderRoundScreen() {
    const map = getMapById(this.state.map);
    const allScopesDrawn = this.areAllScopesDrawn();
    const tip = this.state.cardPhaseCompleted
      ? '道具卡阶段已完成，确认限制和装备后就能开打。'
      : allScopesDrawn
        ? this.getCardPhaseRuleText()
        : '本局装备已随机完成。';

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
        melee_only: '近战挑战',
        no_scope: '4倍以上禁用',
        no_meds: '药品禁用',
      };
      if (mapping[effect]) labels.push(mapping[effect]);
    });

    if (player.activePunishment) {
      labels.push(`惩罚: ${player.activePunishment.name}`);
    }

    labels.push(...this.getPlayerActiveCardLabels(player));

    return labels;
  },

  getPlayerActiveCardLabels(player) {
    const labels = [];

    player.activeCards.forEach(effect => {
      if (effect === 'shield') {
        labels.push('道具: 护盾');
      } else if (effect === 'double') {
        labels.push('道具: 双倍快乐');
      } else if (effect === 'thief') {
        const targetName = this.state.players[player.thiefTarget]?.name;
        labels.push(`道具: 小偷${targetName ? ` → ${targetName}` : ''}`);
      } else if (effect === 'swap_score') {
        const targetName = this.state.players[player.swapTarget]?.name;
        labels.push(`道具: 乾坤大挪移${targetName ? ` → ${targetName}` : ''}`);
      }
    });

    return labels;
  },

  getPlayerScopeInfo(player) {
    return player.scopes.map(scope => {
      if (player.roundEffects.includes('no_scope') && isHighMagnificationScope(scope)) {
        return {
          label: `${getScopeDisplayName(scope)} · 禁用`,
          className: 'is-blocked',
        };
      }

      return {
        label: getScopeDisplayName(scope),
        className: '',
      };
    });
  },

  renderPlayerStatusCards() {
    const container = document.getElementById('player-status-cards');
    container.innerHTML = this.state.players.map(player => {
      const mainWeapon = player.weapons[0] ? this.weaponBadge(player.weapons[0]) : '<span class="weapon-empty">待抽取</span>';
      const sideWeapon = player.weapons[1] ? this.weaponBadge(player.weapons[1]) : '<span class="weapon-empty">待抽取</span>';
      const scopeInfo = this.getPlayerScopeInfo(player);
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
          ${scopeInfo.length ? `
            <div class="scope-list">
              ${scopeInfo.map(scope => `<span class="scope-badge ${scope.className}">${scope.label}</span>`).join('')}
            </div>
          ` : ''}
          ${effectLabels.length ? `<div class="status-tags">${effectLabels.map(label => `<span class="status-tag">${label}</span>`).join('')}</div>` : ''}
          <div class="card-hand">${cardsHtml || '<span class="empty-hand">无道具卡</span>'}</div>
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
    const allScopesDrawn = this.areAllScopesDrawn();

    document.getElementById('btn-use-cards').disabled = !allScopesDrawn || this.state.cardPhaseCompleted;
    document.getElementById('btn-ready').disabled = !allScopesDrawn || !this.state.cardPhaseCompleted;
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
      const weight = getWeaponBaseWeight(weapon) * (count === 0 ? 1 : Math.pow(0.15, count));
      return {
        ...weapon,
        weight,
      };
    });
  },

  getWeightedPool(options = {}) {
    return this.buildWeightedPool(this.getTakenWeaponIds(options));
  },

  drawWeaponFromTaken(takenIds) {
    const pool = this.buildWeightedPool(takenIds);
    const result = weightedRandom(pool);
    takenIds.push(result.id);
    return { ...result };
  },

  drawWeaponPairForPlayer(playerIdx) {
    const takenIds = this.getTakenWeaponIds({ ignorePlayerIndexes: [playerIdx] });
    return [
      this.drawWeaponFromTaken(takenIds),
      this.drawWeaponFromTaken(takenIds),
    ];
  },

  drawPlayerScopes() {
    return drawUniqueWeightedItems(SCOPES, 2).map(scope => ({ ...scope }));
  },

  startWeaponSpin() {
    this.currentDrawSlot = 0;
    this.renderWeaponDrawPage();
  },

  renderWeaponDrawPage() {
    const players = this.state.players;
    const slotLabel = this.currentDrawSlot === 0 ? '主武器' : '副武器';
    document.getElementById('draw-subtitle').textContent = `正在随机${slotLabel}`;

    WeaponDraw.renderGrid('draw-grid', players, this.currentDrawSlot === 0 ? 'main' : 'sub');

    const btn = document.getElementById('btn-draw-all');
    btn.textContent = '准备抽取...';
    btn.disabled = true;

    this.showView('view-weapon-draw', false);
    this.saveState();
  },

  drawAllWeapons() {
    const players = this.state.players;
    const slot = this.currentDrawSlot;

    const btn = document.getElementById('btn-draw-all');
    btn.disabled = true;
    btn.textContent = '抽取中...';

    const takenIds = [];
    players.forEach(p => {
      p.weapons.forEach(w => { if (w) takenIds.push(w.id); });
    });

    players.forEach((p, i) => {
      if (p.roundEffects.includes('melee_only')) {
        const { name: nameEl, card: cardEl } = WeaponDraw.getSlotElements(i);
        if (nameEl) nameEl.textContent = '近战挑战';
        if (cardEl) cardEl.className = 'draw-slot-card result';
      }
    });

    const pools = players.map(p => {
      if (p.roundEffects.includes('melee_only')) return null;
      return this.buildWeightedPool(takenIds);
    });

    const hasAnimation = pools.some(p => p !== null);
    if (!hasAnimation) {
      this.afterSlotDrawn();
      return;
    }

    const allPools = pools.map(p => p || this.buildWeightedPool(takenIds));

    WeaponDraw.drawAll(allPools, (results) => {
      results.forEach((weapon, i) => {
        if (!players[i].roundEffects.includes('melee_only')) {
          players[i].weapons[slot] = { ...weapon };
        }
      });
      this.saveState();
      this.afterSlotDrawn();
    });
  },

  afterSlotDrawn(results) {
    const btn = document.getElementById('btn-draw-all');
    if (this.currentDrawSlot === 0) {
      this.currentDrawSlot = 1;
      btn.textContent = '抽取副武器中...';
      btn.disabled = true;
      setTimeout(() => {
        this.renderWeaponDrawPage();
        setTimeout(() => this.drawAllWeapons(), 300);
      }, 900);
    } else {
      btn.textContent = '继续抽取瞄准镜...';
      btn.disabled = true;
      setTimeout(() => this.afterAllWeaponsDrawn(), 900);
    }
  },

  spinAllSimultaneous() {
    this.startWeaponSpin();
  },

  renderWeaponDrawScreen() {
    this.renderWeaponDrawPage();
  },

  onWeaponResult() {},

  afterAllWeaponsDrawn() {
    this.spinScopes();
  },

  spinScopes() {
    const players = this.state.players;
    WeaponDraw.renderGrid('scope-draw-grid', players, 'scope');

    const scopePools = players.map(() => [...SCOPES]);
    const btn = document.getElementById('btn-scope-done');
    btn.style.display = 'none';

    this.showView('view-scope-draw', false);

    setTimeout(() => {
      WeaponDraw.drawAll(scopePools, (results) => {
        players.forEach((p, i) => {
          const drawn1 = results[i];
          const drawn2 = weightedRandom(SCOPES);
          p.scopes = [drawn1, drawn2];

          const { name: nameEl, info: infoEl } = WeaponDraw.getSlotElements(i);
          if (nameEl) {
            nameEl.textContent = p.scopes.map(s => typeof getScopeDisplayName === 'function' ? getScopeDisplayName(s) : s.name).join(' / ');
          }
          if (infoEl) {
            infoEl.textContent = '';
          }
        });

        btn.style.display = 'inline-flex';
        this.saveState();
      });
    }, 450);
  },

  afterScopesDone() {
    this.renderRoundScreen();
    this.showView('view-round', false);
    this.saveState();
  },

  getPreviousRoundRanking(round = this.state.currentRound - 1) {
    const entry = this.state.roundHistory.find(item => item.round === round);
    if (!entry?.results?.length) {
      return [];
    }

    return [...entry.results].sort((left, right) => {
      if (left.finalScore !== right.finalScore) {
        return right.finalScore - left.finalScore;
      }
      return left.playerIndex - right.playerIndex;
    });
  },

  getCardPhaseRuleText() {
    if (this.state.currentRound === 1) {
      return '首局按座位顺序进行道具卡阶段：1 → 2 → 3 → 4。';
    }

    const orderNames = this.getCardUseOrder()
      .map(index => this.state.players[index]?.name || `玩家${index + 1}`)
      .join(' → ');

    return orderNames
      ? `按上一局排名倒序进行道具卡阶段：${orderNames}。`
      : '按上一局排名倒序进行道具卡阶段。';
  },

  getCardUseOrder() {
    const seatOrder = this.state.players.map((_, index) => index);

    if (this.state.currentRound === 1) {
      return seatOrder;
    }

    const previousRanking = this.getPreviousRoundRanking();
    if (!previousRanking.length) {
      return [...seatOrder].reverse();
    }

    return [...previousRanking]
      .reverse()
      .map(entry => entry.playerIndex);
  },

  openCardUse() {
    if (this.state.cardPhaseCompleted || !this.areAllScopesDrawn()) return;

    this.cardPhaseSession = {
      order: this.getCardUseOrder(),
      step: 0,
    };
    this.renderCardPhaseTurn();
  },

  getCurrentCardPhasePlayerIndex() {
    if (!this.cardPhaseSession) return -1;
    return this.cardPhaseSession.order[this.cardPhaseSession.step];
  },

  canUseCardNow(card, playerIdx) {
    if (!card) return false;

    if (card.effect === 'swap_all') {
      return this.state.players.every(player => player.weapons.every(Boolean));
    }

    if (card.effect === 'reroll') {
      return this.state.players.some(player => player.weapons.every(Boolean));
    }

    if (card.effect === 'steal_weapon') {
      const player = this.state.players[playerIdx];
      return this.state.players.some((target, targetIdx) =>
        targetIdx !== playerIdx &&
        player.weapons.some(Boolean) &&
        target.weapons.some(Boolean)
      );
    }

    return true;
  },

  renderCardPhaseTurn() {
    const playerIdx = this.getCurrentCardPhasePlayerIndex();
    const player = this.state.players[playerIdx];

    if (!player) {
      this.finishCardPhase();
      return;
    }

    const cardsHtml = player.cards.length
      ? player.cards.map((card, cardIndex) => {
          const disabled = !this.canUseCardNow(card, playerIdx);
          return `
            <button
              class="modal-card-item ${disabled ? 'disabled' : ''}"
              type="button"
              onclick="${disabled ? '' : `App.handleCardUse(${cardIndex})`}"
              ${disabled ? 'disabled' : ''}
            >
              <div class="card-icon">${card.icon}</div>
              <div class="card-info">
                <div class="card-name">${card.name}</div>
                <div class="card-desc">${card.description}</div>
              </div>
            </button>
          `;
        }).join('')
      : '<p class="modal-copy">这位玩家当前没有可用的道具卡。</p>';

    this.showModal(`
      <h3>道具卡阶段</h3>
      <p class="modal-copy">${this.getCardPhaseRuleText()}</p>
      <p class="modal-copy">当前顺序：${this.cardPhaseSession.order.map(index => this.state.players[index].name).join(' → ')}</p>
      <p class="modal-copy">轮到 <strong>${player.name}</strong>（${this.cardPhaseSession.step + 1}/${this.cardPhaseSession.order.length}）</p>
      <div class="modal-card-list">${cardsHtml}</div>
      <button class="btn btn-secondary" onclick="App.advanceCardPhase()">结束 ${player.name} 的回合</button>
    `);
  },

  handleCardUse(cardIndex) {
    const playerIdx = this.getCurrentCardPhasePlayerIndex();
    const player = this.state.players[playerIdx];
    const card = player?.cards?.[cardIndex];
    if (!card) return;

    if (!this.canUseCardNow(card, playerIdx)) {
      return;
    }

    if (!this.cardNeedsTarget(card)) {
      this.executeCard(playerIdx, cardIndex, null);
      return;
    }

    this.showModal(`
      <h3>使用 ${card.icon} ${card.name}</h3>
      <p class="modal-copy">${card.description}</p>
      <h4 class="modal-subtitle">选择目标玩家</h4>
      <div class="target-selector">
        ${this.state.players.map((target, targetIdx) => {
          const enabled = this.canTargetCard(card, playerIdx, targetIdx);
          return `
            <button
              class="target-btn ${enabled ? '' : 'is-disabled'}"
              onclick="${enabled ? `App.executeCard(${playerIdx}, ${cardIndex}, ${targetIdx})` : ''}"
              ${enabled ? '' : 'disabled'}
              type="button"
            >
              ${target.name}
            </button>
          `;
        }).join('')}
      </div>
      <button class="btn btn-secondary" onclick="App.renderCardPhaseTurn()">返回当前回合</button>
    `);
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

    if (card.effect === 'reroll') {
      return target.weapons.every(Boolean);
    }

    if (card.effect === 'steal_weapon') {
      return player.weapons.some(Boolean) && target.weapons.some(Boolean);
    }

    return true;
  },

  showCardPhaseResult(title, bodyHtml) {
    const playerIdx = this.getCurrentCardPhasePlayerIndex();
    const playerName = playerIdx >= 0 ? this.state.players[playerIdx].name : '当前玩家';

    this.showModal(`
      <h3>${title}</h3>
      <div class="result-summary">${bodyHtml}</div>
      <button class="btn btn-primary" onclick="App.renderCardPhaseTurn()">返回 ${playerName} 的回合</button>
    `);
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
        player.cards.splice(cardIndex, 1);
        this.renderPlayerStatusCards();
        this.syncRoundButtons();
        this.saveState();
        this.showCardPhaseResult('道具卡已生效', `<p><strong>${player.name}</strong> 使用了 <strong>${card.name}</strong></p>`);
        return;

      case 'thief':
        player.activeCards.push('thief');
        player.thiefTarget = targetIdx;
        player.cards.splice(cardIndex, 1);
        this.renderPlayerStatusCards();
        this.syncRoundButtons();
        this.saveState();
        this.showCardPhaseResult('道具卡已生效', `<p><strong>${player.name}</strong> 将偷取 <strong>${this.state.players[targetIdx].name}</strong> 的分数</p>`);
        return;

      case 'swap_score':
        player.activeCards.push('swap_score');
        player.swapTarget = targetIdx;
        player.cards.splice(cardIndex, 1);
        this.renderPlayerStatusCards();
        this.syncRoundButtons();
        this.saveState();
        this.showCardPhaseResult('道具卡已生效', `<p><strong>${player.name}</strong> 将与 <strong>${this.state.players[targetIdx].name}</strong> 互换本局分数</p>`);
        return;

      case 'melee_only':
      case 'no_scope':
      case 'no_meds':
        this.state.players[targetIdx].roundEffects.push(card.effect);
        player.cards.splice(cardIndex, 1);
        this.renderPlayerStatusCards();
        this.syncRoundButtons();
        this.saveState();
        this.showCardPhaseResult('道具卡已生效', `<p><strong>${this.state.players[targetIdx].name}</strong> 受到 <strong>${card.name}</strong> 影响</p>`);
        return;

      case 'reroll': {
        const target = this.state.players[targetIdx];
        target.weapons = this.drawWeaponPairForPlayer(targetIdx);
        target.scopes = this.drawPlayerScopes();
        player.cards.splice(cardIndex, 1);
        this.renderPlayerStatusCards();
        this.syncRoundButtons();
        this.saveState();
        this.showCardPhaseResult(
          `${target.name} 已重新随机`,
          `
            <p>武器: <strong>${target.weapons[0].name}</strong> / <strong>${target.weapons[1].name}</strong></p>
            <p>瞄准镜: <strong>${target.scopes.map(scope => getScopeDisplayName(scope)).join(' / ')}</strong></p>
          `
        );
        return;
      }

      case 'swap_all':
        this.resolveSwapAll(playerIdx, cardIndex);
        return;

      case 'steal_weapon':
        this.showWeaponSwapSelector(playerIdx, cardIndex, targetIdx);
        return;

      default:
        return;
    }
  },

  resolveSwapAll(playerIdx, cardIndex) {
    const weaponPool = shuffleArray(this.state.players.flatMap(player => player.weapons.map(weapon => ({ ...weapon }))));
    if (weaponPool.length < this.state.players.length * 2) {
      this.showCardPhaseResult('暂时不能使用', '<p>需要四名玩家都已经持有两把武器，才能执行全队武器替换。</p>');
      return;
    }

    this.state.players.forEach((player, index) => {
      player.weapons = [
        weaponPool[index * 2],
        weaponPool[index * 2 + 1],
      ];
    });

    this.state.players[playerIdx].cards.splice(cardIndex, 1);
    this.renderPlayerStatusCards();
    this.syncRoundButtons();
    this.saveState();

    this.showCardPhaseResult(
      '全队武器替换完成',
      this.state.players.map(player => `<p><strong>${player.name}</strong>: ${player.weapons[0].name} / ${player.weapons[1].name}</p>`).join('')
    );
  },

  showWeaponSwapSelector(playerIdx, cardIndex, targetIdx) {
    const player = this.state.players[playerIdx];
    const target = this.state.players[targetIdx];

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

    if (!combinations.length) {
      this.showCardPhaseResult('暂时不能使用', '<p>双方都需要至少有一把武器，才能进行交换。</p>');
      return;
    }

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
      <button class="btn btn-secondary" onclick="App.renderCardPhaseTurn()">返回当前回合</button>
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
    this.showCardPhaseResult(
      '交换完成',
      `
        <p>${player.name} 获得 <strong>${targetWeapon.name}</strong></p>
        <p>${target.name} 获得 <strong>${myWeapon.name}</strong></p>
      `
    );
  },

  advanceCardPhase() {
    if (!this.cardPhaseSession) return;

    this.cardPhaseSession.step++;
    if (this.cardPhaseSession.step >= this.cardPhaseSession.order.length) {
      this.finishCardPhase();
      return;
    }

    this.renderCardPhaseTurn();
  },

  finishCardPhase() {
    this.cardPhaseSession = null;
    this.state.cardPhaseCompleted = true;
    this.renderRoundScreen();
    this.saveState();
    this.closeModal();
  },

  getPlayerRestrictionSummary(player) {
    const details = [];

    if (player.roundEffects.includes('melee_only')) details.push('本局只能近战，计分补偿 ×4');
    if (player.roundEffects.includes('no_scope')) details.push('4倍以上倍镜禁用');
    if (player.roundEffects.includes('no_meds')) details.push('饮料和止痛药禁用');
    if (player.activePunishment) details.push(`惩罚: ${player.activePunishment.name} · ${player.activePunishment.description}`);
    details.push(...this.getPlayerActiveCardLabels(player));

    return details;
  },

  showLoadout() {
    const map = getMapById(this.state.map);
    document.getElementById('loadout-map-chip').textContent = map.shortName;
    document.getElementById('loadout-round-chip').textContent = `第 ${this.state.currentRound} 局`;

    const container = document.getElementById('loadout-display');
    container.innerHTML = this.state.players.map(player => {
      const restrictions = this.getPlayerRestrictionSummary(player);
      const scopeInfo = this.getPlayerScopeInfo(player);
      return `
        <div class="loadout-player">
          <div class="player-name">${player.name}</div>
          ${player.weapons[0] ? `<div class="loadout-weapon"><span>${player.weapons[0].name}</span><span class="type-badge">${WEAPON_TYPES[player.weapons[0].type].name}</span></div>` : ''}
          ${player.weapons[1] ? `<div class="loadout-weapon"><span>${player.weapons[1].name}</span><span class="type-badge">${WEAPON_TYPES[player.weapons[1].type].name}</span></div>` : ''}
          ${scopeInfo.length ? `
            <div class="scope-list">
              ${scopeInfo.map(scope => `<span class="scope-badge ${scope.className}">${scope.label}</span>`).join('')}
            </div>
          ` : ''}
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

    const globalNotes = this.state.players.some(player => player.scopes.length)
      ? [`瞄准镜规则：${SCOPE_FALLBACK_RULE}`]
      : [];

    document.getElementById('active-effects').innerHTML = [
      ...activeEffects.map(item => `<span class="effect-tag">${item}</span>`),
      ...globalNotes.map(item => `<span class="effect-tag effect-tag-wide">${item}</span>`),
    ].join('');
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
      animation.style.display = 'none';
      animation.innerHTML = '';
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
        rawAfterOp: result.rawAfterOp,
        afterOp: result.afterShield,
        weaponType: result.weaponType,
        weaponName: result.weaponName,
        doubleCount: result.doubleCount || 0,
        meleeMultiplier: result.meleeMultiplier || 1,
        shieldSaved: result.shieldSaved || false,
        computed: result.computed,
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
      animationHtml: '',
      rankingHtml: document.getElementById('round-ranking').innerHTML,
    };
  },

  setPendingRewards(sortedResults) {
    if (this.state.currentRound >= this.state.totalRounds) {
      this.state.pendingRewardPlayers = [];
      return;
    }

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
      nextButton.textContent = this.state.currentRound >= this.state.totalRounds ? '查看最终排名' : '下一局';
      return;
    }

    area.style.display = 'block';
    container.innerHTML = '';

    const desc = document.createElement('p');
    desc.className = 'reward-desc';
    desc.innerHTML = entries
      .map(entry => `<strong>${this.state.players[entry.playerIndex].name}</strong>`)
      .join(' 和 ') + ' 抽取道具卡';
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
    nextButton.textContent = allDone ? '下一局' : '等待抽卡完成';
    this.saveState();
  },

  nextRound() {
    this.state.pendingRewardPlayers = [];
    this.state.lastRoundSnapshot = null;

    if (this.state.currentRound >= this.state.totalRounds) {
      this.renderFinal();
      return;
    }

    this.state.currentRound++;
    this.prepareRoundSetup();
  },

  getRoundMapTimeline() {
    return this.state.roundHistory
      .sort((left, right) => left.round - right.round)
      .map(entry => getMapById(entry.map)?.name.split(' ')[0] || entry.map);
  },

  buildFinalSummary(sortedPlayers) {
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
    const mapTimeline = this.getRoundMapTimeline();
    const overviewLabel = `${this.state.totalRounds} 局 · ${this.getModeLabel()}`;
    const routeLabel = mapTimeline.join(' → ') || '未开始';

    return `
      <div class="summary-card summary-card-hero">
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
        <span>对局概览</span>
        <strong>${overviewLabel}</strong>
        <em>${routeLabel}</em>
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

    const sortedPlayers = [...this.state.players].sort((left, right) => right.totalScore - left.totalScore);
    const mapTimeline = this.getRoundMapTimeline();

    document.getElementById('final-map-chip').textContent = mapTimeline.length > 1 ? '多地图轮换' : (mapTimeline[0] || '未记录地图');
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

    const totalRounds = Math.max(...this.state.players.map(player => player.scores.length), 0);
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

    document.getElementById('score-details').innerHTML = `
      <section class="score-details-panel">
        <div class="score-details-title">对局详情</div>
        <div class="score-details-table">${tableHtml}</div>
      </section>
    `;
    this.showView('view-final', false);
    this.saveState();
  },

  restart() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.createInitialState();
    this.currentSpinPlayer = 0;
    this.currentSpinSlot = 0;
    this.cardPhaseSession = null;
    this.populateSetupForm();
    this.renderPlayerLibrary();
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

      case 'view-map-select':
        this.renderRoundMapSelection();
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
        this.state.players.forEach(p => { p.weapons = [null, null]; });
        this.currentDrawSlot = 0;
        this.renderWeaponDrawPage();
        setTimeout(() => this.drawAllWeapons(), 450);
        break;

      case 'view-scope-draw':
        this.state.players.forEach(p => { p.scopes = []; });
        this.spinScopes();
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
    if (!savedState) return false;

    try {
      const parsed = JSON.parse(savedState);
      const hydrated = this.hydrateState(parsed);

      if (!hydrated.players.length || hydrated.currentRound <= 0) {
        return false;
      }

      const resume = confirm('检测到未完成的游戏，是否继续？');
      if (!resume) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      this.state = hydrated;
      this.currentSpinPlayer = this.state.spinState?.playerIndex || 0;
      this.currentSpinSlot = this.state.spinState?.slotIndex || 0;
      this.populateSetupForm();
      this.renderPlayerLibrary();
      this.syncTheme();
      this.restoreFromCurrentView();
      return true;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();

  document.getElementById('modal-overlay').addEventListener('click', event => {
    if (event.target === event.currentTarget) {
      if (App.cardPhaseSession) {
        return;
      }
      App.closeModal();
    }
  });
});
