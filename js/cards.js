const Cards = {
  drawEventCard(state = typeof App !== 'undefined' ? App.state : null) {
    const bucket = state?.drawHistory?.event;
    const card = drawBalancedWeightedItem(EVENT_CARDS, bucket, {
      recentWindow: DRAW_BALANCE.event.recentWindow,
      recentPenalties: DRAW_BALANCE.event.recentPenalties,
      repeatPenalty: DRAW_BALANCE.event.repeatPenalty,
      minWeightFactor: DRAW_BALANCE.event.minWeightFactor,
    });

    if (bucket && card) {
      rememberBalancedDraw(bucket, card, { recentWindow: DRAW_BALANCE.event.recentWindow });
    }

    return card;
  },

  drawPunishmentCard(state = typeof App !== 'undefined' ? App.state : null, options = {}) {
    const bucket = state?.drawHistory?.punishment;
    const card = drawBalancedWeightedItem(PUNISHMENT_CARDS, bucket, {
      recentWindow: DRAW_BALANCE.punishment.recentWindow,
      recentPenalties: DRAW_BALANCE.punishment.recentPenalties,
      repeatPenalty: DRAW_BALANCE.punishment.repeatPenalty,
      minWeightFactor: DRAW_BALANCE.punishment.minWeightFactor,
      excludeIds: options.excludeIds || [],
    });

    if (bucket && card) {
      rememberBalancedDraw(bucket, card, { recentWindow: DRAW_BALANCE.punishment.recentWindow });
    }

    return card;
  },

  renderCardBack(container, onClick) {
    const div = document.createElement('div');
    div.className = 'card card-back';
    div.addEventListener('click', () => {
      if (div.classList.contains('card-back')) {
        const card = this.drawEventCard();
        div.classList.remove('card-back');
        div.classList.add('card-front', `${card.category}-card`);
        div.innerHTML = `
          <span class="card-category">${this.getCategoryLabel(card.category)}</span>
          <div class="card-icon">${card.icon}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-desc">${card.description}</div>
        `;
        if (onClick) onClick(card);
      }
    }, { once: true });
    container.appendChild(div);
    return div;
  },

  renderCardFront(card) {
    return `
      <div class="card card-front ${card.category}-card">
        <span class="card-category">${this.getCategoryLabel(card.category)}</span>
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${card.description}</div>
      </div>
    `;
  },

  renderPunishmentCard(card) {
    return `
      <div class="punishment-card">
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${card.description}</div>
      </div>
    `;
  },

  renderMiniCard(card) {
    return `<span class="mini-card" title="${card.name}: ${card.description}">${card.icon}</span>`;
  },

  getCategoryLabel(cat) {
    const labels = { weapon: '武器', score: '计分', debuff: '干扰' };
    return labels[cat] || cat;
  },

  renderCardUseModal(player, allPlayers, onUse, onClose) {
    if (!player.cards || player.cards.length === 0) {
      return `
        <h3>${player.name} 的道具卡</h3>
        <p style="text-align:center;color:var(--text-muted)">没有可用的卡牌</p>
        <button class="btn btn-secondary" onclick="(${onClose})()">关闭</button>
      `;
    }

    const cardsHtml = player.cards.map((card, i) => `
      <div class="modal-card-item" data-card-index="${i}">
        <div class="card-icon">${card.icon}</div>
        <div class="card-info">
          <div class="card-name">${card.name}</div>
          <div class="card-desc">${card.description}</div>
        </div>
      </div>
    `).join('');

    return `
      <h3>${player.name} 的道具卡</h3>
      <div class="modal-card-list">${cardsHtml}</div>
      <button class="btn btn-secondary" onclick="(${onClose})()">不使用，关闭</button>
    `;
  },

  renderTargetSelector(players, currentPlayerIndex, onSelect) {
    return `
      <h3>选择目标玩家</h3>
      <div class="target-selector">
        ${players.map((p, i) => `
          <button class="target-btn" onclick="(${onSelect})(${i})">${p.name}</button>
        `).join('')}
      </div>
    `;
  },
};
