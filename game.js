// ── Constants ─────────────────────────────────────────────────────────────────
const GRID_SIZE = 25;

const MULTIPLIER_TABLE = {
  1:  [1.01,1.08,1.12,1.18,1.24,1.3,1.37,1.46,1.55,1.65,1.77,1.9,2.06,2.25,2.47,2.75,3.09,3.54,4.12,4.95,6.19,8.25,12.37,24.75],
  2:  [1.08,1.17,1.29,1.41,1.56,1.74,1.94,2.18,2.47,2.83,3.26,3.81,4.5,5.4,6.6,8.25,10.61,14.14,19.8,29.7,49.5,99,297],
  3:  [1.12,1.27,1.48,1.71,2,2.35,2.79,3.35,4.07,5,6.26,7.96,10.35,13.8,18.97,27.11,40.66,65.06,113.85,222.7,569.3,2277],
  4:  [1.18,1.41,1.71,2.09,2.58,3.23,4.09,5.26,6.88,9.17,12.51,17.52,25.3,37.95,59.64,99.39,178.91,357.81,834.9,2504,12523],
  5:  [1.24,1.56,2,2.58,3.41,4.6,6.37,9.03,13.11,19.54,29.97,47.42,77.77,133,240.32,462.51,957.87,2189,5765,18752],
  6:  [1.3,1.74,2.42,3.45,5.07,7.7,12.1,19.73,33.47,59.47,111.51,222.22,472.96,1089.6,2757,7854,25047,95270],
  7:  [1.37,1.94,2.89,4.47,7.17,12.06,21.37,39.95,79.38,169.26,391.08,989.81,2828,9466,38932,196835],
  8:  [1.46,2.18,3.44,5.73,10.08,18.88,37.83,82,194.55,510.3,1510,5182,21317,107575],
  9:  [1.55,2.47,4.14,7.34,14.0,28.71,64.24,160.4,450.4,1453,5484,25346,166461],
  10: [1.65,2.83,5.17,10.13,21.5,50,130,387,1352,5696,31199,243572],
  11: [1.77,3.26,6.37,13.56,32.02,84.95,258.8,924.5,4019,23109,209213],
  12: [1.9,3.81,7.96,18.52,49.31,149.3,531.8,2337,14028,125248],
  13: [2.06,4.5,10.35,27.11,82.29,298.8,1399,9193,91260],
  14: [2.25,5.4,13.8,40.66,141.5,616,3879,36677,554297],
  15: [2.47,6.6,18.97,65.06,267.7,1452,12913,192062],
  16: [2.75,8.25,27.11,113.85,589.8,5148,75778],
  17: [3.09,10.61,40.66,222.7,1783,27706,1338477],
  18: [3.54,14.14,65.06,469.8,6649,215890],
  19: [4.12,19.8,113.85,1333,36218,4069770],
  20: [4.95,29.7,222.7,5765,437186],
  21: [6.19,49.5,569.3,27753],
  22: [8.25,99,2277],
  23: [12.37,297],
  24: [24.75],
};

function getMultipliers(mines) {
  return MULTIPLIER_TABLE[Math.min(24, Math.max(1, mines))] || MULTIPLIER_TABLE[1];
}

// ── State ─────────────────────────────────────────────────────────────────────
let balance       = 100;
let betAmount     = 10;
let mineCount     = 1;
let gameState     = 'idle'; // idle | playing | won | lost
let mines         = [];
let revealed      = Array(GRID_SIZE).fill(false);
let diamonds      = 0;
let currentMult   = 1;
let profit        = 0;

// Auto play
let autoConfig    = null;  // { rounds, pattern: [indices] }
let autoRoundsLeft = 0;
let autoRunning   = false;
let autoStopping  = false;
let autoStep      = 0;
let autoTimer     = null;

// Win popup
let winPopupTimer = null;

// Auto modal
let autoModalRounds  = 25;
let autoModalPattern = Array(GRID_SIZE).fill(false);

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const topbarBalance  = $('topbar-balance');
const betInput       = $('bet-input');
const btnHalf        = $('btn-half');
const btnDouble      = $('btn-double');
const btnMax         = $('btn-max');
const mineCountEl    = $('mine-count');
const btnMineDec     = $('btn-mine-dec');
const btnMineInc     = $('btn-mine-inc');
const safeTilesEl    = $('safe-tiles');
const currentMultEl  = $('current-mult');
const nextMultLabel  = $('next-mult-label');
const btnAuto        = $('btn-auto');
const statDiamonds   = $('stat-diamonds');
const statProfit     = $('stat-profit');
const statMult       = $('stat-mult');
const statPayout     = $('stat-payout');
const statResult     = $('stat-result');
const autoBanner     = $('auto-banner');
const autoBannerIcon = $('auto-banner-icon');
const autoBannerText = $('auto-banner-text');
const gridEl         = $('grid');
const gridWrapper    = $('grid-wrapper');
const winModal       = $('win-modal');
const winMultLabel   = $('win-mult-label');
const winAmountLabel = $('win-amount-label');
const winBalanceLabel= $('win-balance-label');
const btnPlaceBet    = $('btn-place-bet');
const btnCashout     = $('btn-cashout');
const multStrip      = $('mult-strip');
// Auto modal
const autoOverlay    = $('auto-overlay');
const btnCloseAuto   = $('btn-close-auto');
const btnCancelAuto  = $('btn-cancel-auto');
const btnStartAuto   = $('btn-start-auto');
const patternGrid    = $('pattern-grid');
const patternCount   = $('pattern-count');
const hintMax        = $('hint-max');
const hintMines      = $('hint-mines');
const btnClearPat    = $('btn-clear-pattern');

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) { return n.toFixed(2); }

function generateMines() {
  const pos = [];
  while (pos.length < mineCount) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    if (!pos.includes(r)) pos.push(r);
  }
  return pos;
}

function getTile(i) { return gridEl.children[i]; }

// ── Render Helpers ────────────────────────────────────────────────────────────
function renderBalance() {
  topbarBalance.textContent = fmt(balance);
}

function renderLeftPanel() {
  mineCountEl.textContent = mineCount;
  safeTilesEl.textContent = `💎 ${GRID_SIZE - mineCount}`;
  currentMultEl.textContent = `${fmt(currentMult)}×`;
  btnMineDec.disabled = mineCount <= 1 || gameState === 'playing';
  btnMineInc.disabled = mineCount >= 24 || gameState === 'playing';

  const mults = getMultipliers(mineCount);
  const nextMult = mults[diamonds] || mults[mults.length - 1];
  if (gameState === 'playing' && diamonds < GRID_SIZE - mineCount) {
    nextMultLabel.textContent = `Next: ${fmt(nextMult)}×`;
  } else {
    nextMultLabel.textContent = '';
  }
}

function renderStatusBar() {
  statDiamonds.textContent = `💎 ${diamonds}`;
  const profitStr = profit >= 0 ? `+$${fmt(profit)}` : `-$${fmt(Math.abs(profit))}`;
  statProfit.textContent = profitStr;
  statProfit.className = `stat-value ${profit >= 0 ? 'teal' : 'red'}`;
  statMult.textContent = `${fmt(currentMult)}×`;
  statPayout.textContent = diamonds > 0 ? `$${fmt(betAmount * currentMult)}` : '—';
}

function renderMultStrip() {
  const mults = getMultipliers(mineCount);
  multStrip.innerHTML = '';
  mults.slice(0, 10).forEach((m, i) => {
    const chip = document.createElement('div');
    chip.className = 'mult-chip' + (i < diamonds ? ' done' : i === diamonds && gameState === 'playing' ? ' next' : '');
    chip.textContent = `${i+1}💎 ${fmt(m)}×`;
    multStrip.appendChild(chip);
  });
  if (mults.length > 10) {
    const more = document.createElement('div');
    more.className = 'mult-chip';
    more.textContent = `+${mults.length - 10} more`;
    multStrip.appendChild(more);
  }
}

function renderActionButtons() {
  const playing = gameState === 'playing';
  btnPlaceBet.classList.toggle('hidden', playing);
  btnCashout.classList.toggle('hidden', !playing);
  btnPlaceBet.textContent = `🎮 Place Bet $${betAmount}`;
  btnPlaceBet.disabled = betAmount > balance || autoRunning;
  const canCashout = playing && diamonds > 0 && !autoRunning;
  btnCashout.disabled = !canCashout;
}

function renderAutoButton() {
  btnAuto.disabled = gameState === 'playing' && !autoRunning;
  btnAuto.className = 'btn-auto';
  if (autoRunning) {
    if (autoStopping) {
      btnAuto.classList.add('stopping');
      btnAuto.innerHTML = `⏳ Finishing... <span style="font-size:11px;opacity:0.75">(${autoRoundsLeft} left)</span>`;
    } else {
      btnAuto.classList.add('running');
      btnAuto.innerHTML = `⏹ Stop <span style="font-size:11px;opacity:0.75">(${autoRoundsLeft} left)</span>`;
    }
  } else {
    btnAuto.textContent = '⚡ Auto Play';
  }
}

function renderAutoBanner() {
  if (!autoRunning) {
    autoBanner.classList.add('hidden');
    return;
  }
  autoBanner.classList.remove('hidden');
  autoBanner.className = 'auto-banner' + (autoStopping ? ' stopping' : '');
  autoBannerIcon.textContent = autoStopping ? '⏳' : '⚡';
  autoBannerText.textContent = autoStopping
    ? 'Finishing current round, then stopping...'
    : `Auto Play active — ${autoRoundsLeft} round${autoRoundsLeft !== 1 ? 's' : ''} remaining`;
}

function renderAll() {
  renderBalance();
  renderLeftPanel();
  renderStatusBar();
  renderMultStrip();
  renderActionButtons();
  renderAutoButton();
  renderAutoBanner();
}

// ── Grid Rendering ─────────────────────────────────────────────────────────────
function buildGrid() {
  gridEl.innerHTML = '';
  for (let i = 0; i < GRID_SIZE; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = i;
    tile.addEventListener('click', () => handleTileClick(i));
    gridEl.appendChild(tile);
  }
}

function updateTileDisplay() {
  for (let i = 0; i < GRID_SIZE; i++) {
    const tile = getTile(i);
    const isRevealed = revealed[i];
    const isMine = mines.includes(i);
    const isActive = gameState === 'playing' && !isRevealed && !autoRunning;
    const isAutoTarget = autoRunning && autoConfig && autoConfig.pattern.includes(i) && !isRevealed;

    tile.className = 'tile';
    tile.innerHTML = '';

    if (isRevealed) {
      if (isMine) {
        tile.classList.add('mine');
        tile.innerHTML = '💣';
      } else {
        tile.classList.add('diamond');
        const icon = document.createElement('span');
        icon.className = 'tile-icon';
        icon.textContent = '💎';
        tile.appendChild(icon);
      }
    } else if (isAutoTarget) {
      tile.classList.add('auto-target');
      tile.textContent = '⚡';
    } else if (isActive) {
      tile.classList.add('active');
      tile.textContent = '?';
    } else {
      tile.textContent = '•';
    }
  }
}

function animateTilePop(index) {
  const tile = getTile(index);
  tile.classList.remove('pop');
  void tile.offsetWidth; // reflow
  tile.classList.add('pop');
  tile.addEventListener('animationend', () => tile.classList.remove('pop'), { once: true });
}

function triggerCashoutWave(unrevealedBefore) {
  // Animate only tiles that were unrevealed before cashout (unrevealedBefore[i] === true means it was hidden)
  for (let i = 0; i < GRID_SIZE; i++) {
    if (!unrevealedBefore[i]) continue;
    const tile = getTile(i);
    const col = i % 5;
    const row = Math.floor(i / 5);
    const delay = col * 60 + row * 30;
    tile.style.animationDelay = `${delay}ms`;
    tile.classList.remove('wave');
    void tile.offsetWidth;
    tile.classList.add('wave');
    tile.addEventListener('animationend', () => {
      tile.classList.remove('wave');
      tile.style.animationDelay = '';
    }, { once: true });
  }
}

// ── Win Modal ─────────────────────────────────────────────────────────────────
function showWinModal(amount, mult, newBalance, fast) {
  winMultLabel.textContent = `${fmt(mult)}×`;
  winAmountLabel.textContent = `$${fmt(amount)}`;
  winBalanceLabel.textContent = `$${fmt(newBalance)}`;
  winModal.classList.remove('hidden');
  // Re-trigger animation
  winModal.style.animation = 'none';
  void winModal.offsetWidth;
  winModal.style.animation = '';

  if (winPopupTimer) clearTimeout(winPopupTimer);
  winPopupTimer = setTimeout(() => {
    winModal.classList.add('hidden');
  }, fast ? 900 : 2200);
}

// ── Game Logic ────────────────────────────────────────────────────────────────
function startGame(minePositions) {
  mines = minePositions;
  revealed = Array(GRID_SIZE).fill(false);
  diamonds = 0;
  currentMult = 1;
  profit = 0;
  gameState = 'playing';
  balance = parseFloat((balance - betAmount).toFixed(2));
  statResult.textContent = '';
  statResult.className = 'stat-result';
  winModal.classList.add('hidden');
  buildGrid();
  updateTileDisplay();
  renderAll();
}

function handleBet() {
  if (betAmount > balance || autoRunning) return;
  startGame(generateMines());
}

function handleTileClick(index) {
  if (gameState !== 'playing' || autoRunning) return;
  processReveal(index);
}

function processReveal(index) {
  if (revealed[index]) return 'skip';
  const isMine = mines.includes(index);

  if (isMine) {
    revealed = Array(GRID_SIZE).fill(true);
    gameState = 'lost';
    statResult.textContent = '💥 BUST!';
    statResult.className = 'stat-result lose';
    updateTileDisplay();
    renderAll();
    return 'lost';
  }

  // Diamond
  revealed[index] = true;
  diamonds++;
  const mults = getMultipliers(mineCount);
  currentMult = mults[diamonds - 1] || mults[mults.length - 1];
  profit = parseFloat((betAmount * currentMult - betAmount).toFixed(2));

  // Animate tile
  updateTileDisplay();
  animateTilePop(index);
  renderAll();

  // Check if all safe tiles found
  if (diamonds === GRID_SIZE - mineCount) {
    const winAmount = parseFloat((betAmount * currentMult).toFixed(2));
    balance = parseFloat((balance + winAmount).toFixed(2));
    revealed = Array(GRID_SIZE).fill(true);
    gameState = 'won';
    statResult.textContent = '🏆 WIN!';
    statResult.className = 'stat-result win';
    updateTileDisplay();
    renderAll();
    setTimeout(() => showWinModal(winAmount, currentMult, balance, false), 100);
    return 'won';
  }

  return 'continue';
}

function doCashOut() {
  if (gameState !== 'playing' || diamonds === 0 || autoRunning) return;
  const winAmount = parseFloat((betAmount * currentMult).toFixed(2));
  const mult = currentMult;
  const unrevealedBefore = revealed.map(v => !v); // true = was unrevealed
  balance = parseFloat((balance + winAmount).toFixed(2));
  revealed = Array(GRID_SIZE).fill(true);
  gameState = 'won';
  statResult.textContent = '🏆 WIN!';
  statResult.className = 'stat-result win';
  updateTileDisplay();
  renderAll();
  triggerCashoutWave(unrevealedBefore);
  setTimeout(() => showWinModal(winAmount, mult, balance, false), 300);
}

// ── Auto Play ─────────────────────────────────────────────────────────────────
function stopAutoPlay() {
  if (autoTimer) clearTimeout(autoTimer);
  autoRunning = false;
  autoStopping = false;
  autoConfig = null;
  autoRoundsLeft = 0;
  renderAll();
}

function requestStopAutoPlay() {
  autoStopping = true;
  renderAutoButton();
  renderAutoBanner();
}

function startAutoPlay(config) {
  autoConfig = config;
  autoRoundsLeft = config.rounds;
  autoStep = 0;
  autoStopping = false;
  autoRunning = true;
  renderAutoButton();
  renderAutoBanner();
  tickAutoPlay();
}

function tickAutoPlay() {
  if (!autoRunning) return;

  // Between rounds
  if (gameState === 'idle' || gameState === 'won' || gameState === 'lost') {
    if (autoStopping || autoRoundsLeft <= 0) {
      stopAutoPlay();
      return;
    }
    autoTimer = setTimeout(() => {
      if (betAmount > balance) { stopAutoPlay(); return; }
      startGame(generateMines());
      autoStep = 0;
      tickAutoPlay();
    }, 700);
    return;
  }

  if (gameState === 'playing') {
    const pattern = autoConfig.pattern;

    if (autoStep >= pattern.length) {
      // All pattern tiles revealed — cash out
      autoTimer = setTimeout(() => {
        const winAmount = parseFloat((betAmount * currentMult).toFixed(2));
        const mult = currentMult;
        const unrevealedBefore = revealed.map(v => !v);
        balance = parseFloat((balance + winAmount).toFixed(2));
        revealed = Array(GRID_SIZE).fill(true);
        gameState = 'won';
        statResult.textContent = '🏆 WIN!';
        statResult.className = 'stat-result win';
        updateTileDisplay();
        renderAll();
        triggerCashoutWave(unrevealedBefore);
        setTimeout(() => showWinModal(winAmount, mult, balance, true), 300);
        autoRoundsLeft--;
        autoTimer = setTimeout(() => {
          gameState = 'idle';
          tickAutoPlay();
        }, 1000);
      }, 400);
      return;
    }

    autoTimer = setTimeout(() => {
      const tileIdx = pattern[autoStep];
      const result = processReveal(tileIdx);
      if (result === 'lost' || result === 'won') {
        autoRoundsLeft--;
        autoTimer = setTimeout(() => {
          gameState = 'idle';
          tickAutoPlay();
        }, 900);
      } else if (result === 'continue') {
        autoStep++;
        tickAutoPlay();
      }
    }, 500);
  }
}

// ── Auto Modal ────────────────────────────────────────────────────────────────
function buildPatternGrid() {
  patternGrid.innerHTML = '';
  const maxPicks = GRID_SIZE - mineCount;
  const selectedCount = autoModalPattern.filter(Boolean).length;

  for (let i = 0; i < GRID_SIZE; i++) {
    const tile = document.createElement('div');
    const sel = autoModalPattern[i];
    const disabled = !sel && selectedCount >= maxPicks;
    tile.className = 'pattern-tile' + (sel ? ' selected' : disabled ? ' disabled-tile' : '');
    tile.textContent = sel ? '💎' : '•';
    if (!sel) {
      tile.querySelector ? null : null;
      const dot = tile;
      dot.style.fontSize = sel ? '22px' : '10px';
      dot.style.color = disabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.2)';
    }
    if (!disabled || sel) {
      tile.addEventListener('click', () => {
        if (sel) {
          autoModalPattern[i] = false;
        } else {
          const count = autoModalPattern.filter(Boolean).length;
          if (count < maxPicks) autoModalPattern[i] = true;
        }
        buildPatternGrid();
        updateAutoModalUI();
      });
    }
    patternGrid.appendChild(tile);
  }
}

function updateAutoModalUI() {
  const maxPicks = GRID_SIZE - mineCount;
  const selectedCount = autoModalPattern.filter(Boolean).length;

  patternCount.textContent = `${selectedCount} / ${maxPicks} selected`;
  patternCount.className = 'pattern-count' + (selectedCount >= maxPicks ? ' maxed' : '');
  hintMax.textContent = maxPicks;
  hintMines.textContent = `${mineCount} mine${mineCount > 1 ? 's' : ''}`;

  btnStartAuto.disabled = selectedCount === 0;
  btnStartAuto.textContent = `▶ Start ${autoModalRounds} Rounds`;

  document.querySelectorAll('.round-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.rounds) === autoModalRounds);
  });
}

function openAutoModal() {
  autoModalPattern = Array(GRID_SIZE).fill(false);
  autoModalRounds = 25;
  buildPatternGrid();
  updateAutoModalUI();
  autoOverlay.classList.remove('hidden');
}

function closeAutoModal() {
  autoOverlay.classList.add('hidden');
}

// ── Event Listeners ───────────────────────────────────────────────────────────
betInput.addEventListener('input', () => {
  betAmount = Math.max(1, parseInt(betInput.value) || 1);
  renderActionButtons();
});

btnHalf.addEventListener('click', () => {
  if (gameState === 'playing') return;
  betAmount = Math.max(1, Math.floor(betAmount / 2));
  betInput.value = betAmount;
  renderActionButtons();
});

btnDouble.addEventListener('click', () => {
  if (gameState === 'playing') return;
  betAmount = betAmount * 2;
  betInput.value = betAmount;
  renderActionButtons();
});

btnMax.addEventListener('click', () => {
  if (gameState === 'playing') return;
  betAmount = Math.floor(balance);
  betInput.value = betAmount;
  renderActionButtons();
});

btnMineDec.addEventListener('click', () => {
  if (mineCount <= 1 || gameState === 'playing') return;
  mineCount = Math.max(1, mineCount - 1);
  renderAll();
});

btnMineInc.addEventListener('click', () => {
  if (mineCount >= 24 || gameState === 'playing') return;
  mineCount = Math.min(24, mineCount + 1);
  renderAll();
});

btnAuto.addEventListener('click', () => {
  if (autoRunning) { requestStopAutoPlay(); return; }
  if (gameState === 'playing') return;
  openAutoModal();
});

btnPlaceBet.addEventListener('click', handleBet);
btnCashout.addEventListener('click', doCashOut);

// Auto modal events
btnCloseAuto.addEventListener('click', closeAutoModal);
btnCancelAuto.addEventListener('click', closeAutoModal);
autoOverlay.addEventListener('click', e => { if (e.target === autoOverlay) closeAutoModal(); });

document.querySelectorAll('.round-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    autoModalRounds = parseInt(btn.dataset.rounds);
    updateAutoModalUI();
  });
});

btnClearPat.addEventListener('click', () => {
  autoModalPattern = Array(GRID_SIZE).fill(false);
  buildPatternGrid();
  updateAutoModalUI();
});

btnStartAuto.addEventListener('click', () => {
  const selectedCount = autoModalPattern.filter(Boolean).length;
  if (selectedCount === 0) return;
  closeAutoModal();
  startAutoPlay({
    rounds: autoModalRounds,
    pattern: autoModalPattern.map((v, i) => v ? i : -1).filter(i => i >= 0),
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
buildGrid();
updateTileDisplay();
renderAll();