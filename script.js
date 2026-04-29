const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hpFill = document.getElementById('hpFill');
const staminaFill = document.getElementById('staminaFill');
const xpFill = document.getElementById('xpFill');
const hpLabel = document.getElementById('hpLabel');
const staminaLabel = document.getElementById('staminaLabel');
const xpLabel = document.getElementById('xpLabel');
const moneyLabel = document.getElementById('moneyLabel');
const levelLabel = document.getElementById('levelLabel');
const whiskeyLabel = document.getElementById('whiskeyLabel');
const intimidationLabel = document.getElementById('intimidationLabel');
const cunningLabel = document.getElementById('cunningLabel');
const statPointsLabel = document.getElementById('statPointsLabel');
const crewLabel = document.getElementById('crewLabel');
const crewCapLabel = document.getElementById('crewCapLabel');
const ownedLabel = document.getElementById('ownedLabel');
const totalLabel = document.getElementById('totalLabel');
const districtNorth = document.getElementById('districtNorth');
const districtRiver = document.getElementById('districtRiver');
const districtGold = document.getElementById('districtGold');
const districtSouth = document.getElementById('districtSouth');
const gangNameLabel = document.getElementById('gangNameLabel');

const info = document.getElementById('info');
const logEl = document.getElementById('log');
const crewInfo = document.getElementById('crewInfo');

const attackBtn = document.getElementById('attackBtn');
const heavyBtn = document.getElementById('heavyBtn');
const whiskeyBtn = document.getElementById('whiskeyBtn');
const retreatBtn = document.getElementById('retreatBtn');
const bribeBtn = document.getElementById('bribeBtn');
const intimidateBtn = document.getElementById('intimidateBtn');
const healYesBtn = document.getElementById('healYesBtn');
const healNoBtn = document.getElementById('healNoBtn');
const recruitBtn = document.getElementById('recruitBtn');
const spareBtn = document.getElementById('spareBtn');
const eliminateBtn = document.getElementById('eliminateBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const newGameBtn = document.getElementById('newGameBtn');
const addHpBtn = document.getElementById('addHpBtn');
const addStaminaBtn = document.getElementById('addStaminaBtn');
const addIntimidationBtn = document.getElementById('addIntimidationBtn');
const addCunningBtn = document.getElementById('addCunningBtn');
const statPointRow = document.getElementById('statPointRow');

const mainButtons = document.getElementById('mainButtons');
const clinicButtons = document.getElementById('clinicButtons');
const decisionButtons = document.getElementById('decisionButtons');

const TILE = 32;

let tick = 0;
let state = 'explore';
let turnCounter = 0;
let totalBusinesses = 0;
let districtTotals = {
  'North Side': 0,
  'River Ward': 0,
  'Gold Quarter': 0,
  'South End': 0
};

let currentBusiness = null;
let currentEnemy = null;
let currentDefeatedEnemy = null;
let finalBossUnlocked = false;
let gangName = 'The Family';

// New Pokemon-style state
let currentInterior = null;  // { building, interior, enemies }
let talkingNPC = null;
let playerFacing = 'down';
let walkFrame = 0;
let smoothX = 0, smoothY = 0;  // pixel-level smooth position
let isMoving = false;
let moveTimer = 0;
const MOVE_SPEED = 4; // pixels per frame during smooth move

const associateNames = [
  'Mattolomew',
  'Mattel',
  'Mattoberto',
  'Mattvito',
  'Mattcini',
  'Mattiano',
  'Mattenzo',
  'Mattavelli',
  'Matticchio',
  'Mattalino',
  'Mattfredo',
  'Mattissimo Jr.'
];

const eliteNames = [
  'Mattomeo',
  'MattMaathew',
  'Mattanon',
  'Mattgelica',
  'Mattynthia',
  'Mattlay',
  'Mattohn',
  'Mattarl',
  'Mattalie'
];

const grecoIndustries = [
  'Insurance',
  'Trading',
  'Logistics',
  'Textiles',
  'Imports',
  'Exports',
  'Construction',
  'Shipping',
  'Real Estate',
  'Finance',
  'Hospitality',
  'Security',
  'Wholesale',
  'Motors',
  'Warehousing',
  'Freight'
];

const traits = ['Quick', 'Tank', 'Snake', 'Bruiser', 'Bookkeeper'];

const player = {
  name: 'Matt',
  x: 1,
  y: 1,
  maxHp: 100,
  hp: 100,
  maxStamina: 40,
  stamina: 40,
  level: 1,
  xp: 0,
  xpToNext: 40,
  money: 90,
  whiskey: 3,
  intimidation: 4,
  cunning: 3,
  statPoints: 0,
  crew: [],
  crewCap: 4,
  heat: 0
};

const logs = [];

const DB_NAME = 'mattopoly_db';
const DB_VERSION = 1;
const SAVE_STORE = 'saves';
const SAVE_KEY = 'slot1';

function openSaveDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SAVE_STORE)) {
        db.createObjectStore(SAVE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveGame() {
  try {
    const db = await openSaveDB();
    const tx = db.transaction(SAVE_STORE, 'readwrite');
    const store = tx.objectStore(SAVE_STORE);

    const payload = {
      player: structuredClone(player),
      city: structuredClone(city),
      totalBusinesses,
      districtTotals: structuredClone(districtTotals),
      jessLocation: structuredClone(jessLocation),
      finalBossUnlocked,
      finalBossTile: structuredClone(finalBossTile),
      gangName,
      state: 'explore',
      turnCounter,
      savedAt: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const req = store.put(payload, SAVE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    db.close();
    log('Game saved to the books.', 'blue');
  } catch (err) {
    console.error(err);
    log('Save failed.', 'danger');
  }
}

async function loadGame() {
  try {
    const db = await openSaveDB();
    const tx = db.transaction(SAVE_STORE, 'readonly');
    const store = tx.objectStore(SAVE_STORE);

    const payload = await new Promise((resolve, reject) => {
      const req = store.get(SAVE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    db.close();

    if (!payload) {
      log('No saved game found.', 'danger');
      return;
    }

    Object.assign(player, payload.player);
    city = payload.city;
    totalBusinesses = payload.totalBusinesses;
    districtTotals = payload.districtTotals;
    jessLocation = payload.jessLocation;
    finalBossUnlocked = payload.finalBossUnlocked;
    finalBossTile = payload.finalBossTile;
    gangName = payload.gangName || 'The Family';
    state = 'explore';
    turnCounter = payload.turnCounter || 0;
    currentBusiness = null;
    currentEnemy = null;
    currentDefeatedEnemy = null;

    log(`Save loaded. Matt is back in business with ${gangName}.`, 'win');
    updateUI();
  } catch (err) {
    console.error(err);
    log('Load failed.', 'danger');
  }
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function chooseGangName() {
  const input = window.prompt("Name Matt's gang:", gangName);
  const cleaned = (input || '').trim();
  gangName = cleaned || 'The Family';
}

function log(message, cls = '') {
  logs.unshift({ message, cls });
  if (logs.length > 70) logs.pop();
  logEl.innerHTML = logs
    .map(x => `<div class="log-entry ${x.cls}">${x.message}</div>`)
    .join('');
  logEl.scrollTop = 0;
}

function traitBonusDescription(trait) {
  if (trait === 'Quick') return 'harder to hit';
  if (trait === 'Tank') return 'extra health';
  if (trait === 'Snake') return 'more dangerous when hurt';
  if (trait === 'Bruiser') return 'heavy damage';
  if (trait === 'Bookkeeper') return 'bribe resistant';
  return '';
}

function getEnemyName(rank, don) {
  if (don) return `Don ${pick(eliteNames)}`;
  if (rank === 'capo' || rank === 'boss') return pick(eliteNames);
  return pick(associateNames);
}

function makeGuard(rank = 'associate', difficulty = 1, district = 'North Side', don = false) {
  const baseLevel = difficulty === 1 ? rand(1, 3) : difficulty === 2 ? rand(3, 5) : rand(5, 8);
  const rankBonus = rank === 'boss' ? 2 : rank === 'capo' ? 1 : 0;
  const donBonus = don ? 3 : 0;
  const level = baseLevel + rankBonus + donBonus;

  let maxHp = (rank === 'boss' ? 58 : rank === 'capo' ? 46 : 36) + level * 6 + rand(0, 7);
  let attack = (rank === 'boss' ? 12 : rank === 'capo' ? 10 : 8) + Math.floor(level / 2) + rand(0, 2);
  const trait = pick(traits);

  if (trait === 'Tank') maxHp += 18;
  if (trait === 'Bruiser') attack += 3;
  if (trait === 'Quick') attack += 1;

  return {
    name: getEnemyName(rank, don),
    rank,
    district,
    trait,
    level,
    maxHp,
    hp: maxHp,
    attack,
    dodge: trait === 'Quick' ? 0.18 : 0.06,
    don
  };
}

function initGame() {
  buildWorld();
  totalBusinesses = buildingDefs.length;
  districtTotals = { 'North Side': 0, 'River Ward': 0, 'Gold Quarter': 0, 'South End': 0 };
  buildingDefs.forEach(b => {
    if (districtTotals[b.district] !== undefined) districtTotals[b.district]++;
    // Generate guards for each building
    const diff = b.difficulty;
    const gruntCount = diff <= 1 ? rand(1, 2) : diff <= 2 ? rand(2, 3) : rand(3, 4);
    b.guards = [];
    for (let g = 0; g < gruntCount; g++) {
      let rank = 'associate';
      if (g === gruntCount - 1 && diff >= 2 && Math.random() < 0.5) rank = 'capo';
      if (g === gruntCount - 1 && diff === 3 && Math.random() < 0.35) rank = 'boss';
      b.guards.push(makeGuard(rank, diff, b.district, false));
    }
    if (b.donSite) {
      b.guards = [makeGuard('boss', Math.min(diff + 1, 5), b.district, true)];
    }
  });
  finalBossUnlocked = false;
  totalLabel.textContent = totalBusinesses;
}

function resetNewGame() {
  chooseGangName();
  totalBusinesses = 0;
  currentBusiness = null;
  currentEnemy = null;
  currentDefeatedEnemy = null;
  currentInterior = null;
  talkingNPC = null;
  state = 'explore';
  turnCounter = 0;
  logs.length = 0;

  Object.assign(player, {
    name: 'Matt',
    x: 13, y: 13,
    maxHp: 100, hp: 100,
    maxStamina: 40, stamina: 40,
    level: 1, xp: 0, xpToNext: 40,
    money: 90, whiskey: 3,
    intimidation: 4, cunning: 3,
    statPoints: 0, crew: [], crewCap: 4, heat: 0
  });
  smoothX = player.x * TILE;
  smoothY = player.y * TILE;

  initGame();
  updateCamera(player.x, player.y, WORLD_W, WORLD_H);
  log(`New game started. Matt is back on the street with ${gangName}.`);
  log('Walk to buildings and enter through the door to fight.');
  log('Defeated enemies can be recruited into the family.');
  log('District control boosts income, and each district has its own Don.');
  log('Jess runs a clinic in Gold Quarter. Find her when things get rough.');
  updateUI();
}

// Helper to check if a building is "owned" by checking buildingDefs
function countOwned() {
  let n = 0;
  buildingDefs.forEach(b => { if (b.owner === 'Matt') n++; });
  return n;
}

function districtOwnedCount(d) {
  let n = 0;
  buildingDefs.forEach(b => { if (b.district === d && b.owner === 'Matt') n++; });
  return n;
}

function updateDistrictUI() {
  districtNorth.textContent = `${districtOwnedCount('North Side')}/${districtTotals['North Side']}`;
  districtRiver.textContent = `${districtOwnedCount('River Ward')}/${districtTotals['River Ward']}`;
  districtGold.textContent = `${districtOwnedCount('Gold Quarter')}/${districtTotals['Gold Quarter']}`;
  districtSouth.textContent = `${districtOwnedCount('South End')}/${districtTotals['South End']}`;
}

function crewAttackBonus() {
  return player.crew.reduce((sum, c) => sum + c.bonus.attack, 0);
}

function crewIncomeBonus() {
  return player.crew.reduce((sum, c) => sum + c.bonus.income, 0);
}

function crewIntimidationBonus() {
  return player.crew.reduce((sum, c) => sum + c.bonus.intimidation, 0);
}

function crewCunningBonus() {
  return player.crew.reduce((sum, c) => sum + c.bonus.cunning, 0);
}

function writeCrewInfo() {
  if (!player.crew.length) {
    crewInfo.innerHTML = `<div class="crew-empty">${gangName} runs lean for now.</div>`;
    return;
  }

  crewInfo.innerHTML = player.crew.map((c, i) =>
    `<div class="crew-member">
      <div class="name">${c.name}</div>
      <div class="stats">${c.role}<br>+${c.bonus.attack} atk, +${c.bonus.income} inc<br>+${c.bonus.intimidation} intim, +${c.bonus.cunning} cunn</div>
      <button class="kick-btn" onclick="kickCrewMember(${i})">Dismiss</button>
    </div>`
  ).join('');
}

function kickCrewMember(index) {
  if (index < 0 || index >= player.crew.length) return;
  const member = player.crew[index];
  player.crew.splice(index, 1);
  log(`${member.name} has been dismissed from ${gangName}.`, 'danger');
  updateUI();
}

function passiveIncome() {
  let businesses = 0;
  let income = 0;

  buildingDefs.forEach(b => {
    if (b.owner === 'Matt') {
      businesses++;
      income += b.income;
    }
  });

  if (!businesses) return;

  let districtBonus = 1;
  ['North Side', 'River Ward', 'Gold Quarter', 'South End'].forEach(d => {
    if (districtOwnedCount(d) === districtTotals[d]) districtBonus += 0.10;
  });

  const bonusIncome = crewIncomeBonus();
  const total = Math.floor((income * districtBonus) / 8) + bonusIncome;

  if (total > 0) {
    player.money += total;
    log(`${gangName} collections roll in: +$${total}.`, 'blue');
  }
}

function maybeUnlockFinalBoss() {
  const allDistrictsLocked = ['North Side', 'River Ward', 'Gold Quarter', 'South End']
    .every(d => districtOwnedCount(d) === districtTotals[d]);

  if (allDistrictsLocked && !finalBossUnlocked) {
    finalBossUnlocked = true;
    log(`Every district answers to ${gangName}. City Hall opens and Don Mattissimo makes his move.`, 'danger');
  }
}

function updateStatAllocationVisibility() {
  statPointRow.classList.toggle('hidden', player.statPoints <= 0);
}

function updateUI() {
  hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  staminaFill.style.width = `${Math.max(0, (player.stamina / player.maxStamina) * 100)}%`;
  xpFill.style.width = `${Math.max(0, (player.xp / player.xpToNext) * 100)}%`;

  hpLabel.textContent = `${player.hp} / ${player.maxHp}`;
  staminaLabel.textContent = `${player.stamina} / ${player.maxStamina}`;
  xpLabel.textContent = `${player.xp} / ${player.xpToNext}`;
  moneyLabel.textContent = `$${player.money}`;
  levelLabel.textContent = player.level;
  whiskeyLabel.textContent = player.whiskey;
  intimidationLabel.textContent = player.intimidation + crewIntimidationBonus();
  cunningLabel.textContent = player.cunning + crewCunningBonus();
  statPointsLabel.textContent = player.statPoints;
  crewLabel.textContent = player.crew.length;
  crewCapLabel.textContent = player.crewCap;
  ownedLabel.textContent = countOwned();
  gangNameLabel.textContent = gangName;

  updateDistrictUI();
  writeCrewInfo();

  const inCombat = state === 'combat';
  const inClinic = state === 'clinic';
  const inRecruit = state === 'recruit';

  mainButtons.classList.toggle('hidden', inClinic || inRecruit);
  clinicButtons.classList.toggle('hidden', !inClinic);
  decisionButtons.classList.toggle('hidden', !inRecruit);

  attackBtn.disabled = !inCombat;
  heavyBtn.disabled = !inCombat || player.stamina < 10;
  whiskeyBtn.disabled = state === 'win' || state === 'lose' || inClinic;
  retreatBtn.disabled = !inCombat;
  bribeBtn.disabled = !inCombat || !currentBusiness || !currentEnemy;
  intimidateBtn.disabled = !inCombat || !currentBusiness || !currentEnemy;
  healYesBtn.disabled = !inClinic;
  healNoBtn.disabled = !inClinic;
  recruitBtn.disabled = !inRecruit || player.crew.length >= player.crewCap || (currentDefeatedEnemy && currentDefeatedEnemy.don);
  spareBtn.disabled = !inRecruit;
  eliminateBtn.disabled = !inRecruit;

  addHpBtn.disabled = player.statPoints <= 0;
  addStaminaBtn.disabled = player.statPoints <= 0;
  addIntimidationBtn.disabled = player.statPoints <= 0;
  addCunningBtn.disabled = player.statPoints <= 0;
  updateStatAllocationVisibility();

  if (state === 'combat' && currentBusiness && currentEnemy) {
    const bribeCost = getBribeCost();
    info.innerHTML = `
      <div><span class="gold">${currentBusiness.name}</span> — ${currentBusiness.district}, Difficulty ${currentBusiness.difficulty}</div>
      <div>Facing <span class="danger">${currentEnemy.name}</span> — ${currentEnemy.rank}, Level ${currentEnemy.level}, Trait: ${currentEnemy.trait}</div>
      <div>Enemy HP: ${currentEnemy.hp}/${currentEnemy.maxHp} | Power: ${currentEnemy.attack}</div>
      <div>Bribe cost: $${bribeCost} | Intimidation difficulty: ${8 + currentEnemy.level + (currentEnemy.trait === 'Snake' ? 2 : 0)}</div>
    `;
  } else if (state === 'clinic') {
    info.innerHTML = `
      <div><span class="gold">Jess's Underground Clinic</span></div>
      <div>Jess: "You need patching up, Matt?"</div>
      <div>Full heal price: $${jessFee}.</div>
    `;
  } else if (state === 'recruit' && currentDefeatedEnemy) {
    info.innerHTML = `
      <div><span class="gold">${currentDefeatedEnemy.name}</span> is beaten.</div>
      <div>Recruit gives passive bonuses. Spare lets them walk. Eliminate removes them permanently.</div>
      <div>Trait was ${currentDefeatedEnemy.trait}. Rank: ${currentDefeatedEnemy.rank}. ${currentDefeatedEnemy.don ? 'Dons cannot be recruited.' : ''}</div>
    `;
  } else {
    const currentDistrict = districtAt(player.x, player.y) || 'Unknown';
    if (currentInterior) {
      const b = currentInterior.building;
      info.innerHTML = `
        <div><span class="gold">Inside:</span> ${b.name}</div>
        <div>District: ${b.district}. Difficulty: ${b.difficulty}.</div>
        <div>Walk around and confront enemies. Exit through the door.</div>
      `;
    } else if (finalBossUnlocked && isCityHallDoor(player.x, player.y)) {
      info.innerHTML = `
        <div><span class="gold">Current District:</span> City Center</div>
        <div><span class="danger">City Hall</span> — Don Mattissimo waits inside.</div>
      `;
    } else {
      info.innerHTML = `
        <div><span class="gold">Current District:</span> ${currentDistrict}</div>
        <div>Explore the city. Enter buildings through doors to fight. Build ${gangName}.</div>
      `;
    }
  }
}

function spendStat(stat) {
  if (player.statPoints <= 0) {
    log('No stat points available.', 'danger');
    return;
  }

  if (stat === 'hp') {
    player.maxHp += 10;
    player.hp = Math.min(player.maxHp, player.hp + 10);
    log('Matt invests in toughness. +10 Max HP.', 'win');
  } else if (stat === 'stamina') {
    player.maxStamina += 5;
    player.stamina = Math.min(player.maxStamina, player.stamina + 5);
    log('Matt sharpens his conditioning. +5 Max Stamina.', 'win');
  } else if (stat === 'intimidation') {
    player.intimidation += 1;
    log('Matt grows more feared. +1 Intimidation.', 'win');
  } else if (stat === 'cunning') {
    player.cunning += 1;
    log('Matt gets more calculating. +1 Cunning.', 'win');
  }

  player.statPoints -= 1;
  updateUI();
}

function levelUpIfNeeded() {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext += 22;
    player.statPoints += 3;
    if (player.level % 3 === 0) player.crewCap += 1;
    log(`Matt rises to level ${player.level}. +3 stat points. No free heal.`, 'win');
  }
}

function getBribeCost() {
  if (!currentEnemy || !currentBusiness) return 0;

  let cost = 24 + currentEnemy.level * 8 + currentBusiness.difficulty * 10;
  if (currentEnemy.rank === 'capo') cost += 18;
  if (currentEnemy.rank === 'boss') cost += 30;
  if (currentEnemy.trait === 'Bookkeeper') cost += 16;
  cost -= (player.cunning + crewCunningBonus()) * 3;

  return Math.max(18, cost);
}

function gainXP(n) {
  player.xp += n;
  levelUpIfNeeded();
}

function claimBusiness(tile) {
  if (tile.owner === 'Matt') return;
  if (tile.guards.length > 0) {
    log(`You cannot claim ${tile.name} until every Matt tied to it is gone.`, 'danger');
    return;
  }

  tile.owner = 'Matt';
  const payout = 55 + tile.difficulty * 25 + (tile.donSite ? 40 : 0);
  player.money += payout;
  gainXP(18 + tile.difficulty * 7 + (tile.donSite ? 14 : 0));
  log(`${gangName} takes over ${tile.name} and pulls in $${payout}.`, 'win');
  maybeUnlockFinalBoss();
  updateUI();
  checkWin();
}

function startCombat(tile) {
  if (!tile.guards.length) return;
  currentBusiness = tile;
  currentEnemy = tile.guards[0];
  state = 'combat';
  log(`Matt walks into ${tile.name}. ${currentEnemy.name} steps up.`, 'danger');
  updateUI();
}

function enemyTurn() {
  if (state !== 'combat' || !currentEnemy) return;

  let damage = currentEnemy.attack + rand(0, 3);
  if (currentEnemy.trait === 'Snake' && currentEnemy.hp <= Math.floor(currentEnemy.maxHp / 2)) {
    damage += 3;
  }

  damage = Math.max(1, damage - Math.floor(player.crew.length / 2));
  player.hp = Math.max(0, player.hp - damage);
  player.stamina = Math.min(player.maxStamina, player.stamina + 2);

  log(`${currentEnemy.name} (Lv ${currentEnemy.level}) lands a hit for ${damage}.`);
  if (player.hp <= 0) {
    onPlayerDefeat();
  }
  updateUI();
}

function onPlayerDefeat() {
  const loseMoney = Math.floor(player.money * 0.25);
  player.money = Math.max(0, player.money - loseMoney);
  player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
  player.stamina = Math.floor(player.maxStamina * 0.5);

  const owned = buildingDefs.filter(b => b.owner === 'Matt');
  if (owned.length) {
    const lost = pick(owned);
    lost.owner = null;
    if (!lost.guards.length) {
      lost.guards.push(makeGuard('associate', Math.max(1, lost.difficulty), lost.district, false));
    }
    log(`Game over — you got whacked. Matt loses $${loseMoney} and control of ${lost.name}.`, 'danger');
  } else {
    log(`Game over — you got whacked. Matt loses $${loseMoney}.`, 'danger');
  }

  state = 'explore';
  currentEnemy = null;
  currentBusiness = null;
  currentInterior = null;
  // Respawn at Jess's clinic door (19, 43)
  player.x = 19; player.y = 43;
  smoothX = player.x * TILE; smoothY = player.y * TILE;
  updateCamera(player.x, player.y, WORLD_W, WORLD_H);
  log(`Jess drags Matt back from the edge in her neighborhood clinic.`, 'danger');
}

function advanceGuardAfterResolution() {
  if (!currentBusiness) return;

  if (currentBusiness.guards.length > 0) {
    currentEnemy = currentBusiness.guards[0];
    state = 'combat';
    log(`${currentEnemy.name} steps up for ${currentBusiness.name}.`, 'danger');
  } else {
    const finished = currentBusiness;
    currentEnemy = null;
    state = 'explore';
    log(`Every Matt tied to ${finished.name} is out of the way.`, 'win');
    claimBusiness(finished);
  }
  updateUI();
}

function finishEnemyDefeat() {
  if (!currentEnemy || !currentBusiness) return;

  currentDefeatedEnemy = currentBusiness.guards.shift();
  player.money += 10 + currentDefeatedEnemy.level * 2 + rand(0, 4);
  gainXP(6 + currentDefeatedEnemy.level + (currentDefeatedEnemy.don ? 10 : 0));
  log(`${currentDefeatedEnemy.name} goes down.`, 'win');
  state = 'recruit';
  updateUI();
}

function attack() {
  if (state !== 'combat' || !currentEnemy) return;

  const missRoll = Math.random();
  if (missRoll < currentEnemy.dodge) {
    log(`Matt swings, but ${currentEnemy.name} slips it.`, 'danger');
    enemyTurn();
    return;
  }

  let damage = 9 + rand(0, 4) + Math.floor(player.level / 2) + crewAttackBonus();
  if (currentEnemy.level - player.level >= 2 && missRoll < currentEnemy.dodge + 0.12) {
    damage = Math.max(4, Math.floor(damage * 0.65));
    log(`Matt only lands a glancing hit for ${damage}.`);
  } else {
    log(`Matt throws a clean shot for ${damage}.`);
  }

  currentEnemy.hp = Math.max(0, currentEnemy.hp - damage);
  if (currentEnemy.hp <= 0) finishEnemyDefeat();
  else enemyTurn();
}

function heavyHit() {
  if (state !== 'combat' || !currentEnemy || player.stamina < 10) return;

  player.stamina -= 10;
  const whiffChance = currentEnemy.trait === 'Quick' ? 0.25 : 0.14;
  if (Math.random() < whiffChance) {
    log(`Matt overcommits and misses the heavy hit.`, 'danger');
    enemyTurn();
    updateUI();
    return;
  }

  const damage = 16 + rand(0, 5) + player.level + crewAttackBonus();
  log(`Matt unloads a heavy hit for ${damage}.`);
  currentEnemy.hp = Math.max(0, currentEnemy.hp - damage);
  if (currentEnemy.hp <= 0) finishEnemyDefeat();
  else enemyTurn();
  updateUI();
}

function drinkWhiskey() {
  if (player.whiskey <= 0 || state === 'win' || state === 'lose') return;

  player.whiskey--;
  const heal = 18 + rand(0, 6);
  player.hp = Math.min(player.maxHp, player.hp + heal);
  player.stamina = Math.min(player.maxStamina, player.stamina + 6);
  log(`Matt takes a pull of whiskey and recovers ${heal} health.`, 'blue');

  if (state === 'combat') enemyTurn();
  else updateUI();
}

function retreat() {
  if (state !== 'combat') return;
  log(`Matt backs out of ${currentBusiness.name}.`, 'danger');
  state = 'explore';
  currentEnemy = null;
  currentBusiness = null;
  updateUI();
}

function attemptBribe() {
  if (state !== 'combat' || !currentEnemy || !currentBusiness) return;

  const cost = getBribeCost();
  if (player.money < cost) {
    log(`Matt tries to buy peace, but he's short on cash. Needs $${cost}.`, 'danger');
    updateUI();
    return;
  }

  player.money -= cost;
  let chance = 0.38 + ((player.cunning + crewCunningBonus()) * 0.05) - (currentEnemy.level * 0.03);
  if (currentEnemy.trait === 'Bookkeeper') chance -= 0.18;
  if (currentEnemy.rank === 'boss') chance -= 0.10;

  if (Math.random() < chance) {
    log(`The envelope lands. ${currentEnemy.name} walks away from the job.`, 'win');
    currentBusiness.guards.shift();
    advanceGuardAfterResolution();
  } else {
    log(`${currentEnemy.name} takes the money and still throws hands.`, 'danger');
    enemyTurn();
  }
}

function attemptIntimidate() {
  if (state !== 'combat' || !currentEnemy || !currentBusiness) return;

  const power = player.intimidation + crewIntimidationBonus() + rand(1, 10);
  const target = 8 + currentEnemy.level + (currentEnemy.rank === 'boss' ? 4 : 0) + (currentEnemy.trait === 'Snake' ? 2 : 0);

  if (power >= target + 5) {
    log(`Matt stares ${currentEnemy.name} down. The whole front line scatters.`, 'win');
    currentBusiness.guards = [];
    currentEnemy = null;
    state = 'explore';
    claimBusiness(currentBusiness);
  } else if (power >= target) {
    log(`${currentEnemy.name} breaks under the pressure and folds.`, 'win');
    currentBusiness.guards.shift();
    advanceGuardAfterResolution();
  } else {
    log(`The intimidation play fails. ${currentEnemy.name} isn't blinking.`, 'danger');
    enemyTurn();
  }
  updateUI();
}

function makeCrewRole(enemy) {
  if (enemy.trait === 'Bruiser') return { role: 'Enforcer', bonus: { attack: 2, income: 0, intimidation: 1, cunning: 0 } };
  if (enemy.trait === 'Bookkeeper') return { role: 'Bookkeeper', bonus: { attack: 0, income: 5, intimidation: 0, cunning: 1 } };
  if (enemy.trait === 'Quick') return { role: 'Runner', bonus: { attack: 1, income: 1, intimidation: 0, cunning: 1 } };
  if (enemy.trait === 'Tank') return { role: 'Guard', bonus: { attack: 1, income: 0, intimidation: 1, cunning: 0 } };
  return { role: 'Consigliere', bonus: { attack: 0, income: 2, intimidation: 1, cunning: 1 } };
}

function recruitEnemy() {
  if (state !== 'recruit' || !currentDefeatedEnemy) return;
  if (currentDefeatedEnemy.don) {
    log(`Dons don't join anybody.`, 'danger');
    return;
  }
  if (player.crew.length >= player.crewCap) {
    log(`${gangName} is full.`, 'danger');
    return;
  }

  const role = makeCrewRole(currentDefeatedEnemy);
  player.crew.push({ name: currentDefeatedEnemy.name, role: role.role, bonus: role.bonus });
  log(`${currentDefeatedEnemy.name} joins ${gangName} as ${role.role}.`, 'win');
  currentDefeatedEnemy = null;
  advanceGuardAfterResolution();
}

function spareEnemy() {
  if (state !== 'recruit' || !currentDefeatedEnemy) return;
  log(`Matt lets ${currentDefeatedEnemy.name} limp away.`, 'blue');
  currentDefeatedEnemy = null;
  advanceGuardAfterResolution();
}

function eliminateEnemy() {
  if (state !== 'recruit' || !currentDefeatedEnemy) return;
  if (currentDefeatedEnemy.don) {
    log(`${currentDefeatedEnemy.name} is finished. That district just got quieter.`, 'win');
  } else {
    log(`${currentDefeatedEnemy.name} is removed from the board.`, 'danger');
  }
  currentDefeatedEnemy = null;
  advanceGuardAfterResolution();
}

let jessFee = 55;

function visitJess() {
  state = 'clinic';
  log(`Matt steps into Jess's Underground Clinic. Jess looks up from her table.`, 'blue');
  updateUI();
}

function confirmJessHeal() {
  if (state !== 'clinic') return;
  if (player.money < jessFee) {
    log(`Jess won't patch Matt up for free. She wants $${jessFee}.`, 'danger');
    updateUI();
    return;
  }
  player.money -= jessFee;
  player.hp = player.maxHp;
  player.stamina = player.maxStamina;
  log(`Jess patches Matt up completely for $${jessFee}.`, 'win');
  jessFee += 10;
  state = 'explore';
  updateUI();
}

function leaveJess() {
  if (state !== 'clinic') return;
  log(`Matt leaves Jess's clinic and heads back outside.`);
  state = 'explore';
  updateUI();
}

let cityHallCleared = false;
function checkWin() {
  if (cityHallCleared) {
    state = 'win';
    log(`Matt owns the businesses, controls the crews, and runs the city. ${gangName} completes Mattopoly.`, 'win');
    updateUI();
  }
}

function randomEvent() {
  const roll = Math.random();
  if (roll < 0.06) {
    player.whiskey++;
    log('A friendly bartender slides Matt a free bottle. +1 Whiskey.', 'blue');
  } else if (roll < 0.10) {
    const cash = rand(15, 35);
    player.money += cash;
    log(`A scared shopkeeper pays protection early. +$${cash}.`, 'blue');
  } else if (roll < 0.14) {
    const hit = rand(6, 12);
    player.hp = Math.max(1, player.hp - hit);
    log(`A back-alley ambush clips Matt for ${hit} health.`, 'danger');
  } else if (roll < 0.17) {
    player.intimidation += 1;
    log(`Word spreads. Matt's reputation hardens. +1 Intimidation.`, 'win');
  } else if (roll < 0.20) {
    player.cunning += 1;
    log('A quiet tip from a bookie makes Matt sharper. +1 Cunning.', 'win');
  }
}

function endStepEffects() {
  turnCounter++;
  if (turnCounter % 5 === 0) passiveIncome();
  if (Math.random() < 0.12) randomEvent();
  maybeUnlockFinalBoss();
  updateUI();
}

// ===== INTERIOR EXPLORATION =====
function enterBuilding(building) {
  const interior = generateInterior(building);
  const enemies = placeEnemiesInInterior(building, interior);
  currentInterior = { building, interior, enemies };
  // Place player at interior door
  player.x = interior.doorX;
  player.y = interior.doorY - 1;
  smoothX = player.x * TILE;
  smoothY = player.y * TILE;
  state = 'explore';
  log(`Matt enters ${building.name}.`, 'blue');
  updateUI();
}

function exitBuilding() {
  if (!currentInterior) return;
  const b = currentInterior.building;
  player.x = b.doorX;
  player.y = b.doorY;
  smoothX = player.x * TILE;
  smoothY = player.y * TILE;
  currentInterior = null;
  updateCamera(player.x, player.y, WORLD_W, WORLD_H);
  log(`Matt steps back outside.`);
  updateUI();
}

function checkInteriorTile(x, y) {
  if (!currentInterior) return;
  const ci = currentInterior;
  // Check if stepping on exit door
  if (ci.interior.map[y] && ci.interior.map[y][x] === T.IDOOR) {
    exitBuilding();
    return;
  }
  // Check for grunt encounter
  const enemy = ci.enemies.enemies.find(e => e.x === x && e.y === y && !e.defeated);
  if (enemy) {
    currentBusiness = ci.building;
    currentEnemy = enemy.guard;
    currentBusiness.guards = [enemy.guard];
    enemy.defeated = true;
    state = 'combat';
    log(`${enemy.guard.name} spots Matt and steps up!`, 'danger');
    updateUI();
    return;
  }
  // Check if walking into capo (only if spawned)
  if (ci.enemies.capoSpawned && !ci.enemies.capoDefeated) {
    const cs = ci.enemies.capoSpot;
    if (x === cs.x && y === cs.y) {
      currentBusiness = ci.building;
      currentEnemy = ci.enemies.capoGuard;
      currentBusiness.guards = [ci.enemies.capoGuard];
      state = 'combat';
      log(`${ci.enemies.capoGuard.name} stands to fight!`, 'danger');
      updateUI();
      return;
    }
  }
  // Check if walking into don boss (only if spawned)
  if (ci.enemies.bossSpawned && !ci.enemies.bossDefeated && ci.enemies.bossGuard) {
    const bs = ci.enemies.bossSpot;
    if (x === bs.x && y === bs.y) {
      currentBusiness = ci.building;
      currentEnemy = ci.enemies.bossGuard;
      currentBusiness.guards = [ci.enemies.bossGuard];
      state = 'combat';
      log(`${ci.enemies.bossGuard.name} stands to fight!`, 'danger');
      updateUI();
    }
  }
}

// Override advanceGuardAfterResolution for interior system
const _origAdvance = advanceGuardAfterResolution;
advanceGuardAfterResolution = function() {
  if (currentInterior) {
    const ci = currentInterior;
    const allGruntsDown = ci.enemies.enemies.every(e => e.defeated);

    // Check if don boss was just defeated
    if (ci.enemies.bossSpawned && ci.enemies.bossGuard && ci.enemies.bossGuard.hp <= 0) {
      ci.enemies.bossDefeated = true;
      ci.building.cleared = true;
      claimBusiness(ci.building);
      log(`${ci.building.name} is under Matt's control.`, 'win');
    }
    // Check if capo was just defeated
    else if (ci.enemies.capoSpawned && !ci.enemies.capoDefeated && ci.enemies.capoGuard.hp <= 0) {
      ci.enemies.capoDefeated = true;
      if (ci.enemies.bossGuard) {
        // Don site: boss appears after capo
        ci.enemies.bossSpawned = true;
        log(`The capo falls... ${ci.enemies.bossGuard.name} emerges from the back!`, 'danger');
      } else {
        // No don: building is cleared
        ci.building.cleared = true;
        claimBusiness(ci.building);
        log(`${ci.building.name} is under Matt's control.`, 'win');
      }
    }
    // Check if all grunts just went down -> spawn capo
    else if (allGruntsDown && !ci.enemies.capoSpawned) {
      ci.enemies.capoSpawned = true;
      log(`All guards are down... ${ci.enemies.capoGuard.name} steps out!`, 'danger');
    }

    currentEnemy = null;
    state = 'explore';
    updateUI();
  } else {
    _origAdvance();
  }
};

// ===== OVERWORLD MOVEMENT =====
function moveOverworld(dx, dy) {
  if (dx < 0) playerFacing = 'left';
  else if (dx > 0) playerFacing = 'right';
  else if (dy < 0) playerFacing = 'up';
  else playerFacing = 'down';

  const nx = player.x + dx;
  const ny = player.y + dy;
  const tile = getTileType(nx, ny);

  if (!WALKABLE.has(tile)) return;

  // Check for NPC
  const npc = isNPCAt(nx, ny);
  if (npc) {
    const line = npc.dialogue[npc.dialogueIndex % npc.dialogue.length];
    log(`Stranger: "${line}"`, 'blue');
    npc.dialogueIndex++;
    endStepEffects();
    return;
  }

  player.x = nx;
  player.y = ny;
  smoothX = player.x * TILE;
  smoothY = player.y * TILE;
  walkFrame++;
  updateCamera(player.x, player.y, WORLD_W, WORLD_H);

  // Check door interactions
  if (tile === T.DOOR) {
    if (isJessClinicDoor(nx, ny)) {
      visitJess();
      return;
    }
    if (isCityHallDoor(nx, ny) && finalBossUnlocked && !cityHallCleared) {
      currentBusiness = {
        name: 'City Hall', district: 'City Center', difficulty: 5,
        guards: [{ name:'Don Mattissimo', rank:'boss', district:'City Center',
          trait:'Snake', level:12, maxHp:150, hp:150, attack:18, dodge:0.14, don:true }]
      };
      startCombat(currentBusiness);
      return;
    }
    const building = getBuildingAtDoor(nx, ny);
    if (building) {
      if (building.owner === 'Matt') {
        log(`${building.name} already answers to Matt.`);
      } else {
        startTransition(() => enterBuilding(building));
      }
      return;
    }
  }
  endStepEffects();
}

// ===== INTERIOR MOVEMENT =====
function moveInterior(dx, dy) {
  if (dx < 0) playerFacing = 'left';
  else if (dx > 0) playerFacing = 'right';
  else if (dy < 0) playerFacing = 'up';
  else playerFacing = 'down';

  const ci = currentInterior;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || ny < 0 || nx >= ci.interior.w || ny >= ci.interior.h) return;
  const tile = ci.interior.map[ny][nx];
  if (!WALKABLE.has(tile) && tile !== T.IDOOR) return;

  player.x = nx;
  player.y = ny;
  smoothX = player.x * TILE;
  smoothY = player.y * TILE;
  walkFrame++;
  checkInteriorTile(nx, ny);
}

function move(dx, dy) {
  if (state !== 'explore' || isMoving || transition.active) return;
  if (currentInterior) moveInterior(dx, dy);
  else moveOverworld(dx, dy);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const movementKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
  if (movementKeys.includes(key)) e.preventDefault();
  if (key === 'arrowup' || key === 'w') move(0, -1);
  if (key === 'arrowdown' || key === 's') move(0, 1);
  if (key === 'arrowleft' || key === 'a') move(-1, 0);
  if (key === 'arrowright' || key === 'd') move(1, 0);
}, { passive: false });

attackBtn.addEventListener('click', attack);
heavyBtn.addEventListener('click', heavyHit);
whiskeyBtn.addEventListener('click', drinkWhiskey);
retreatBtn.addEventListener('click', retreat);
bribeBtn.addEventListener('click', attemptBribe);
intimidateBtn.addEventListener('click', attemptIntimidate);
healYesBtn.addEventListener('click', confirmJessHeal);
healNoBtn.addEventListener('click', leaveJess);
recruitBtn.addEventListener('click', recruitEnemy);
spareBtn.addEventListener('click', spareEnemy);
eliminateBtn.addEventListener('click', eliminateEnemy);
saveBtn.addEventListener('click', saveGame);
loadBtn.addEventListener('click', loadGame);
newGameBtn.addEventListener('click', resetNewGame);
addHpBtn.addEventListener('click', () => spendStat('hp'));
addStaminaBtn.addEventListener('click', () => spendStat('stamina'));
addIntimidationBtn.addEventListener('click', () => spendStat('intimidation'));
addCunningBtn.addEventListener('click', () => spendStat('cunning'));

// ===== NEW CAMERA-BASED RENDERING =====

function drawOverworld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const startX = Math.floor(camera.x / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endX = Math.min(WORLD_W - 1, startX + VIEW_W + 1);
  const endY = Math.min(WORLD_H - 1, startY + VIEW_H + 1);

  // Draw tiles
  for (let y = Math.max(0, startY); y <= endY; y++) {
    for (let x = Math.max(0, startX); x <= endX; x++) {
      const px = x * TILE - camera.x;
      const py = y * TILE - camera.y;
      drawOverworldTile(x, y, px, py);
    }
  }

  // Draw building owner markers
  buildingDefs.forEach(b => {
    const px = b.worldX * TILE - camera.x;
    const py = b.worldY * TILE - camera.y;
    if (px > -TILE * 5 && px < canvas.width + TILE && py > -TILE * 4 && py < canvas.height + TILE) {
      drawBuildingOwnerMarker(px, py, b);
    }
  });

  // Draw NPCs
  npcDefs.forEach(n => {
    const px = n.x * TILE - camera.x;
    const py = n.y * TILE - camera.y;
    if (px > -TILE && px < canvas.width + TILE && py > -TILE && py < canvas.height + TILE) {
      drawSprite(px, py, 'npc', 'down', 0, false);
    }
  });

  // Jess is inside her clinic — no overworld sprite

  // Draw player
  const ppx = player.x * TILE - camera.x;
  const ppy = player.y * TILE - camera.y;
  drawSprite(ppx, ppy, 'player', playerFacing, walkFrame, false);
}

function drawInterior() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ci = currentInterior;
  if (!ci) return;

  // Center the interior on screen
  const offsetX = Math.floor((canvas.width - ci.interior.w * TILE) / 2);
  const offsetY = Math.floor((canvas.height - ci.interior.h * TILE) / 2);

  // Draw interior tiles
  for (let y = 0; y < ci.interior.h; y++) {
    for (let x = 0; x < ci.interior.w; x++) {
      drawInteriorTile(ci.interior.map[y][x], offsetX + x * TILE, offsetY + y * TILE);
    }
  }

  // Draw enemies
  ci.enemies.enemies.forEach(e => {
    if (!e.defeated) {
      const kind = e.guard.rank === 'boss' ? 'boss' : e.guard.rank === 'capo' ? 'capo' : 'associate';
      drawSprite(offsetX + e.x * TILE, offsetY + e.y * TILE, kind, 'down', 0, e.guard.don);
    }
  });

  // Draw capo if spawned
  if (ci.enemies.capoSpawned && !ci.enemies.capoDefeated) {
    const cs = ci.enemies.capoSpot;
    drawSprite(offsetX + cs.x * TILE, offsetY + cs.y * TILE, 'capo', 'down', 0, false);
  }

  // Draw boss if spawned
  if (ci.enemies.bossSpawned && !ci.enemies.bossDefeated && ci.enemies.bossGuard) {
    const bs = ci.enemies.bossSpot;
    drawSprite(offsetX + bs.x * TILE, offsetY + bs.y * TILE, 'boss', 'down', 0, true);
  }

  // Draw player
  const ppx = offsetX + player.x * TILE;
  const ppy = offsetY + player.y * TILE;
  drawSprite(ppx, ppy, 'player', playerFacing, walkFrame, false);
}

function drawCombatOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#141414';
  ctx.fillRect(304, 168, 156, 132);
  ctx.strokeStyle = '#4a4a4a';
  ctx.strokeRect(304, 168, 156, 132);
  const kind = currentEnemy.rank === 'boss' ? 'boss' : currentEnemy.rank === 'capo' ? 'capo' : 'associate';
  drawSprite(352, 192, kind, 'down', 0, currentEnemy.rank === 'boss' || currentEnemy.don);
  ctx.fillStyle = '#f5f1e8';
  ctx.font = '14px Georgia';
  ctx.fillText(`${currentEnemy.name} Lv ${currentEnemy.level}`, 314, 280);
  ctx.fillText(`${currentEnemy.trait}`, 314, 296);
}

function drawClinicOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#dfe7ea';
  ctx.fillRect(64, 54, 384, 322);
  ctx.strokeStyle = '#9aa6ac';
  ctx.strokeRect(64, 54, 384, 322);
  ctx.fillStyle = '#e7eef1';
  ctx.fillRect(64, 54, 384, 186);
  ctx.fillStyle = '#cfd8dc';
  ctx.fillRect(64, 240, 384, 136);
  ctx.fillStyle = '#b0bec5';
  ctx.fillRect(64, 228, 384, 6);
  ctx.strokeStyle = '#b0bec5';
  for (let x = 64; x < 448; x += 32) {
    for (let y = 240; y < 376; y += 32) {
      ctx.strokeRect(x, y, 32, 32);
    }
  }
  ctx.fillStyle = '#90a4ae';
  ctx.fillRect(248, 204, 108, 16);
  ctx.fillStyle = '#eceff1';
  ctx.fillRect(252, 184, 100, 22);
  ctx.fillStyle = '#78909c';
  ctx.fillRect(244, 180, 6, 42);
  ctx.fillRect(352, 180, 6, 42);
  ctx.fillRect(376, 138, 4, 94);
  ctx.beginPath();
  ctx.arc(378, 130, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78909c';
  ctx.beginPath();
  ctx.moveTo(378, 136);
  ctx.lineTo(392, 146);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(150, 250, 50, 8);
  ctx.fillRect(278, 250, 50, 8);
  drawSprite(160, 192, 'player', 'right', 0, false);
  drawNurseSprite(288, 192);
  ctx.fillStyle = '#263238';
  ctx.fillRect(88, 298, 336, 58);
  ctx.strokeStyle = '#37474f';
  ctx.strokeRect(88, 298, 336, 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Georgia';
  ctx.fillText('Jess: "You need a full heal, Matt?"', 100, 320);
  ctx.fillText(`Cost: $${jessFee}`, 100, 340);
}

function drawRecruitOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#151515';
  ctx.fillRect(70, 70, 372, 290);
  ctx.strokeStyle = '#4a4a4a';
  ctx.strokeRect(70, 70, 372, 290);
  ctx.fillStyle = '#f3efe6';
  ctx.fillRect(94, 94, 324, 170);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(138, 238, 60, 8);
  ctx.fillRect(286, 238, 60, 8);
  drawSprite(160, 160, 'player', 'right', 0, false);

  const kind = currentDefeatedEnemy.rank === 'boss' ? 'boss'
    : currentDefeatedEnemy.rank === 'capo' ? 'capo' : 'associate';
  drawSprite(320, 160, kind, 'left', 0, currentDefeatedEnemy.rank === 'boss' || currentDefeatedEnemy.don);

  ctx.fillStyle = '#111';
  ctx.font = '16px Georgia';
  ctx.fillText(`${currentDefeatedEnemy.name} is finished.`, 156, 286);
  ctx.font = '14px Georgia';
  ctx.fillText(`Trait: ${currentDefeatedEnemy.trait} (${traitBonusDescription(currentDefeatedEnemy.trait)})`, 114, 312);
  ctx.fillText(currentDefeatedEnemy.don ? 'A Don cannot be recruited.' : 'Recruit, spare, or eliminate.', 136, 334);
}

function drawWinOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.54)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f7e7b2';
  ctx.font = '28px Georgia';
  ctx.fillText('Mattopoly Complete', 120, 236);
  ctx.font = '16px Georgia';
  ctx.fillText(`The whole city answers to ${gangName}.`, 138, 268);
}

function drawGame() {
  // Draw base scene
  if (currentInterior) {
    drawInterior();
  } else {
    drawOverworld();
  }

  // Draw overlays based on state
  if (state === 'combat' && currentEnemy) drawCombatOverlay();
  if (state === 'clinic') drawClinicOverlay();
  if (state === 'recruit' && currentDefeatedEnemy) drawRecruitOverlay();
  if (state === 'win') drawWinOverlay();

  // Transition overlay
  if (transition.active) {
    updateTransition();
    ctx.fillStyle = `rgba(0,0,0,${transition.alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop() {
  tick++;
  drawGame();
  requestAnimationFrame(loop);
}

// ===== SAVE/LOAD UPDATES =====
const _origSave = saveGame;
saveGame = async function() {
  try {
    const db = await openSaveDB();
    const tx = db.transaction(SAVE_STORE, 'readwrite');
    const store = tx.objectStore(SAVE_STORE);

    const payload = {
      player: structuredClone(player),
      buildingDefs: structuredClone(buildingDefs),
      totalBusinesses,
      districtTotals: structuredClone(districtTotals),
      finalBossUnlocked,
      cityHallCleared,
      gangName,
      jessFee,
      state: 'explore',
      turnCounter,
      savedAt: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const req = store.put(payload, SAVE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    db.close();
    log('Game saved to the books.', 'blue');
  } catch (err) {
    console.error(err);
    log('Save failed.', 'danger');
  }
};

const _origLoad = loadGame;
loadGame = async function() {
  try {
    const db = await openSaveDB();
    const tx = db.transaction(SAVE_STORE, 'readonly');
    const store = tx.objectStore(SAVE_STORE);

    const payload = await new Promise((resolve, reject) => {
      const req = store.get(SAVE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    db.close();

    if (!payload) {
      log('No saved game found.', 'danger');
      return;
    }

    Object.assign(player, payload.player);
    if (payload.buildingDefs) {
      // Rebuild world then restore building state
      buildWorld();
      payload.buildingDefs.forEach((saved, i) => {
        if (buildingDefs[i]) {
          buildingDefs[i].owner = saved.owner;
          buildingDefs[i].guards = saved.guards;
          buildingDefs[i].cleared = saved.cleared;
          buildingDefs[i].income = saved.income;
        }
      });
    }
    totalBusinesses = payload.totalBusinesses || buildingDefs.length;
    districtTotals = payload.districtTotals || districtTotals;
    finalBossUnlocked = payload.finalBossUnlocked || false;
    cityHallCleared = payload.cityHallCleared || false;
    gangName = payload.gangName || 'The Family';
    jessFee = payload.jessFee || 55;
    state = 'explore';
    turnCounter = payload.turnCounter || 0;
    currentBusiness = null;
    currentEnemy = null;
    currentDefeatedEnemy = null;
    currentInterior = null;

    smoothX = player.x * TILE;
    smoothY = player.y * TILE;
    updateCamera(player.x, player.y, WORLD_W, WORLD_H);

    log(`Save loaded. Matt is back in business with ${gangName}.`, 'win');
    updateUI();
  } catch (err) {
    console.error(err);
    log('Load failed.', 'danger');
  }
};

// ===== START =====
resetNewGame();
updateStatAllocationVisibility();
loop();

























