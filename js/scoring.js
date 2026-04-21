const Scoring = {
  calculate() {
    const state = App.state;
    const damages = [];
    let valid = true;

    state.players.forEach((player, index) => {
      const input = document.getElementById(`damage-${index}`);
      const value = parseInt(input.value, 10);

      if (Number.isNaN(value) || value < 0) {
        input.style.borderColor = 'var(--danger)';
        valid = false;
      } else {
        input.style.borderColor = '';
        damages.push(value);
      }
    });

    if (!valid) return;

    document.getElementById('btn-calculate').style.display = 'none';
    const animationArea = document.getElementById('scoring-animation');
    animationArea.style.display = 'block';
    animationArea.innerHTML = '';

    const results = state.players.map((player, index) => this.computePlayerScore(player, damages[index]));

    this.animateResults(results, () => {
      this.applyCardEffects(results);
      App.recordRoundResults(results);
      this.showRanking(results);
      App.captureScoringSnapshot();
      App.saveState();
    });
  },

  computePlayerScore(player, damage) {
    const tail = damage % 10;
    const shieldActive = player.activeCards?.includes('shield');
    const doubleCount = player.activeCards?.filter(c => c === 'double').length || 0;
    const isMelee = player.roundEffects?.includes('melee_only');

    const weapon = player.weapons[0] || player.weapons[1];
    const weaponType = weapon ? weapon.type : 'AR';
    const ops = OPERATIONS[weaponType];
    const op = weightedRandom(ops);

    let afterOp = op.fn(tail);
    if (shieldActive && afterOp < tail) afterOp = tail;

    let meleeMultiplier = isMelee ? 4 : 1;
    let computed = afterOp * meleeMultiplier;

    if (doubleCount > 0) computed *= Math.pow(2, doubleCount);

    const finalScore = Math.round(computed) % 10;

    return {
      player,
      damage,
      tail,
      weaponType,
      weaponName: weapon ? weapon.name : '近战',
      op,
      afterOp,
      meleeMultiplier,
      doubleCount,
      finalScore,
    };
  },

  animateResults(results, onDone) {
    const animationArea = document.getElementById('scoring-animation');
    let index = 0;

    const showNext = () => {
      if (index >= results.length) {
        setTimeout(onDone, 500);
        return;
      }

      const r = results[index];
      const card = document.createElement('div');
      card.className = 'score-step';

      let html = `<div class="step-player">${r.player.name}<span class="step-damage">伤害 ${r.damage}</span></div>`;

      html += `
        <div class="step-detail">
          <span>尾数 <span class="score-number">${r.tail}</span></span>
          <span class="score-op ${this.getOpClass(r.op)}">${r.op.op}</span>
          <span class="score-arrow">→</span>
          <span class="score-number">${r.afterOp}</span>
          ${r.meleeMultiplier > 1 ? `<span class="score-arrow">×${r.meleeMultiplier}(近战)</span>` : ''}
          ${r.doubleCount > 0 ? `<span class="score-op extreme">×${Math.pow(2, r.doubleCount)}</span>` : ''}
          <span class="score-arrow">→ 取尾数 →</span>
          <span class="score-number">${r.finalScore}</span>
        </div>
      `;

      html += `<div class="step-final">得分: ${r.finalScore}</div>`;
      card.innerHTML = html;
      animationArea.appendChild(card);

      index++;
      setTimeout(showNext, 800);
    };

    showNext();
  },

  getOpClass(op) {
    if (!op) return 'neutral';
    if (op.op === '×0') return 'negative';
    if (op.op.startsWith('-')) return 'negative';
    if (op.op === '÷2' || op.op === '10-x' || op.op === '9-x') return 'neutral';
    if (['x²', '×3', '×4', '×5', '+10', '+7', '+8', '+9'].includes(op.op)) return 'extreme';
    if (op.op.startsWith('+') || op.op === '×2') return 'positive';
    return 'neutral';
  },

  applyCardEffects(results) {
    const state = App.state;

    results.forEach((result, playerIndex) => {
      const player = result.player;
      if (!player.activeCards) return;

      if (player.activeCards.includes('thief')) {
        const targetIndex = player.thiefTarget;
        if (targetIndex !== undefined && targetIndex !== playerIndex) {
          const stolen = Math.floor(results[targetIndex].finalScore * 0.5);
          results[targetIndex].finalScore -= stolen;
          result.finalScore += stolen;
          result.thiefStolen = stolen;
          result.thiefFrom = results[targetIndex].player.name;
        }
      }

      if (player.activeCards.includes('swap_score')) {
        const targetIndex = player.swapTarget;
        if (targetIndex !== undefined && targetIndex !== playerIndex) {
          const temp = results[targetIndex].finalScore;
          results[targetIndex].finalScore = result.finalScore;
          result.finalScore = temp;
          result.swapped = results[targetIndex].player.name;
        }
      }
    });

    results.forEach((result, playerIndex) => {
      result.finalScore = Math.round(result.finalScore) % 10;
    });

    const scoreCounts = {};
    results.forEach(r => {
      scoreCounts[r.finalScore] = (scoreCounts[r.finalScore] || 0) + 1;
    });
    results.forEach(r => {
      if (scoreCounts[r.finalScore] >= 2) {
        r.duplicatePenalty = 3;
        r.finalScore = r.finalScore - 3;
      }
    });

    results.forEach((result, playerIndex) => {
      state.players[playerIndex].scores.push(result.finalScore);
    });

    App.recalculateTotals();
  },

  showRanking(results) {
    const sorted = [...results].sort((left, right) => right.finalScore - left.finalScore);
    const rankingDiv = document.getElementById('round-ranking');
    rankingDiv.style.display = 'block';

    rankingDiv.innerHTML = '<h3>本局排名</h3>' + sorted.map((result, index) => {
      const rank = index + 1;
      let extra = '';

      if (result.duplicatePenalty) {
        extra += ` <span class="rank-extra warning">撞分 -${result.duplicatePenalty}</span>`;
      }

      if (result.thiefStolen) {
        extra += ` <span class="rank-extra warning">偷了 ${result.thiefFrom} ${result.thiefStolen} 分</span>`;
      }

      if (result.swapped) {
        extra += ` <span class="rank-extra special">和 ${result.swapped} 互换</span>`;
      }

      return `
        <div class="rank-row">
          <div class="rank-position rank-${rank}">${rank}</div>
          <div class="rank-name">${result.player.name}${extra}</div>
          <div>
            <div class="rank-score">${result.finalScore}</div>
            <div class="rank-detail">总分 ${result.player.totalScore}</div>
          </div>
        </div>
      `;
    }).join('');

    App.setPendingRewards(sorted);
    App.renderPendingRewardCards();
  },
};
