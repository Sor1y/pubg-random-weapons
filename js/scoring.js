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

    document.getElementById('damage-inputs').style.display = 'none';
    document.getElementById('btn-calculate').style.display = 'none';
    const animationArea = document.getElementById('scoring-animation');
    animationArea.style.display = 'none';
    animationArea.innerHTML = '';

    const results = state.players.map((player, index) => this.computePlayerScore(player, damages[index]));
    this.applyCardEffects(results);
    App.recordRoundResults(results);
    this.showRanking(results);
    App.captureScoringSnapshot();
    App.saveState();
  },

  computePlayerScore(player, damage) {
    const tail = damage % 10;
    const shieldActive = player.activeCards?.includes('shield');
    const doubleCount = player.activeCards?.filter(c => c === 'double').length || 0;
    const doubleMultiplier = doubleCount > 0 ? Math.pow(2, doubleCount) : 1;
    const isMelee = player.roundEffects?.includes('melee_only');

    const weapon = isMelee ? null : (player.weapons[0] || player.weapons[1]);
    const weaponType = weapon ? weapon.type : 'AR';
    const ops = OPERATIONS[weaponType];
    const op = weightedRandom(ops);

    const rawAfterOp = op.fn(tail);
    const shieldSaved = shieldActive && rawAfterOp < tail;
    const afterShield = shieldSaved ? tail : rawAfterOp;
    const meleeMultiplier = isMelee ? 4 : 1;
    const afterMelee = afterShield * meleeMultiplier;
    const computed = afterMelee * doubleMultiplier;

    const finalScore = Math.round(computed) % 10;

    return {
      player,
      damage,
      tail,
      weaponType,
      weaponName: weapon ? weapon.name : '近战',
      op,
      rawAfterOp,
      afterShield,
      shieldSaved,
      meleeMultiplier,
      doubleCount,
      doubleMultiplier,
      computed,
      finalScore,
    };
  },

  getBaseTailScore(result) {
    return Math.round(result.computed) % 10;
  },

  buildProcessLine(result) {
    const steps = [
      `<span>尾数 <span class="score-number score-number-inline">${result.tail}</span></span>`,
      `<span class="score-op ${this.getOpClass(result.op)}">${result.op.op}</span>`,
      '<span class="score-arrow">→</span>',
      `<span class="score-number score-number-inline">${result.rawAfterOp}</span>`,
    ];

    if (result.shieldSaved) {
      steps.push(
        '<span class="score-arrow">→</span>',
        '<span class="score-op positive">护盾</span>',
        '<span class="score-arrow">→</span>',
        `<span class="score-number score-number-inline">${result.afterShield}</span>`,
      );
    }

    if (result.meleeMultiplier > 1) {
      steps.push(
        '<span class="score-arrow">→</span>',
        `<span class="score-op extreme">近战 ×${result.meleeMultiplier}</span>`,
        '<span class="score-arrow">→</span>',
        `<span class="score-number score-number-inline">${result.afterShield * result.meleeMultiplier}</span>`,
      );
    }

    if (result.doubleCount > 0) {
      steps.push(
        '<span class="score-arrow">→</span>',
        `<span class="score-op extreme">道具 ×${result.doubleMultiplier}</span>`,
        '<span class="score-arrow">→</span>',
        `<span class="score-number score-number-inline">${result.computed}</span>`,
      );
    }

    steps.push(
      '<span class="score-arrow">→</span>',
      '<span>取尾数</span>',
      '<span class="score-arrow">→</span>',
      `<span class="score-number score-number-inline">${this.getBaseTailScore(result)}</span>`,
    );

    return steps.join('');
  },

  buildResultNotes(result) {
    const notes = [];

    if (result.thiefStolen) {
      notes.push(`<span class="rank-note positive">偷分 +${result.thiefStolen}${result.thiefFrom ? ` · ${result.thiefFrom}` : ''}</span>`);
    }

    if (result.swapped) {
      notes.push(`<span class="rank-note special">互换 · ${result.swapped}</span>`);
    }

    if (result.duplicatePenalty) {
      notes.push(`<span class="rank-note warning">撞分 -${result.duplicatePenalty}</span>`);
    }

    return notes.join('');
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

    rankingDiv.innerHTML = '<h3>本局排名</h3><div class="round-ranking-list">' + sorted.map((result, index) => {
      const rank = index + 1;
      const notes = this.buildResultNotes(result);

      return `
        <div class="rank-row">
          <div class="rank-position rank-${rank}">${rank}</div>
          <div class="rank-content">
            <div class="rank-name-line">
              <div class="rank-name">${result.player.name}</div>
              <div class="rank-damage">伤害 ${result.damage}</div>
            </div>
            <div class="rank-process">${this.buildProcessLine(result)}</div>
            ${notes ? `<div class="rank-notes">${notes}</div>` : ''}
          </div>
          <div class="rank-score-block">
            <div class="rank-score">${result.finalScore}</div>
            <div class="rank-detail">总分 ${result.player.totalScore}</div>
          </div>
        </div>
      `;
    }).join('') + '</div>';

    App.setPendingRewards(sorted);
    App.renderPendingRewardCards();
  },
};
