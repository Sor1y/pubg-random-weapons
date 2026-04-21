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
    const doubleCount = player.activeCards?.filter(card => card === 'double').length || 0;

    const weaponResults = player.weapons.map(weapon => {
      if (!weapon) {
        return { score: 0, tail, op: null, afterOp: 0, multiplier: 1, weapon: null, fistMelee: 1 };
      }

      const operation = weightedRandom(OPERATIONS[weapon.type]);
      let afterOperation = operation.fn(tail);

      if (shieldActive && afterOperation < tail) {
        afterOperation = tail;
      }

      let fistMeleeMultiplier = 1;
      if (player.roundEffects?.includes('fist')) fistMeleeMultiplier = 5;
      if (player.roundEffects?.includes('melee')) fistMeleeMultiplier = 3;

      const multiplier = TIER_INFO[weapon.tier].multiplier;
      const score = Math.round(afterOperation * multiplier * fistMeleeMultiplier);

      return {
        score,
        tail,
        op: operation,
        afterOp: afterOperation,
        multiplier,
        weapon,
        fistMelee: fistMeleeMultiplier,
      };
    });

    const bestWeapon = weaponResults.reduce((left, right) => (left.score >= right.score ? left : right));
    let finalScore = bestWeapon.score;

    if (doubleCount > 0) {
      finalScore *= Math.pow(2, doubleCount);
    }

    return {
      player,
      damage,
      tail,
      weaponResults,
      bestIndex: weaponResults.indexOf(bestWeapon),
      finalScore: Math.round(finalScore),
      doubleCount,
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

      const result = results[index];
      const card = document.createElement('div');
      card.className = 'score-step';

      let html = `<div class="step-player">${result.player.name}<span class="step-damage">伤害 ${result.damage}</span></div>`;

      result.weaponResults.forEach((weaponResult, weaponIndex) => {
        if (!weaponResult.weapon) return;
        const isBest = weaponIndex === result.bestIndex;
        const slotLabel = weaponIndex === 0 ? '主' : '副';

        html += `
          <div class="step-detail" style="${isBest ? '' : 'opacity:0.55'}">
            <span class="slot-label">[${slotLabel}]</span>
            <span>${weaponResult.weapon.name}</span>
            <span class="tier-badge tier-${weaponResult.weapon.tier}">${weaponResult.weapon.tier}</span>
            <span class="score-arrow">→</span>
            <span>尾数 <span class="score-number">${weaponResult.tail}</span></span>
            <span class="score-op ${this.getOpClass(weaponResult.op)}">${weaponResult.op.op}</span>
            <span class="score-arrow">→</span>
            <span class="score-number">${weaponResult.afterOp}</span>
            <span class="score-arrow">×${weaponResult.multiplier}</span>
            ${weaponResult.fistMelee > 1 ? `<span class="score-arrow">×${weaponResult.fistMelee}</span>` : ''}
            <span class="score-arrow">→</span>
            <span class="score-number">${weaponResult.score}</span>
            ${isBest ? '<span class="score-picked">取高</span>' : ''}
          </div>
        `;
      });

      if (result.doubleCount > 0) {
        html += `<div class="step-detail"><span class="score-op extreme">双倍快乐 ×${Math.pow(2, result.doubleCount)}</span></div>`;
      }

      html += `<div class="step-final">得分: ${result.finalScore}</div>`;
      card.innerHTML = html;
      animationArea.appendChild(card);

      index++;
      setTimeout(showNext, 800);
    };

    showNext();
  },

  getOpClass(operation) {
    if (!operation) return 'neutral';
    if (operation.op === '×0') return 'negative';
    if (operation.op.startsWith('-')) return 'negative';
    if (['x²', '×3', '×4', '+10', '+7'].includes(operation.op)) return 'extreme';
    if (operation.op.startsWith('+') || operation.op === '×2') return 'positive';
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
