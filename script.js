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
const MAP = 16;

const districtStyles = {
  'North Side': { block: '#1f1f2e', street: '#2b2b3f', accent: '#6f86ff' },
  'River Ward': { block: '#1f2a24', street: '#2d3a33', accent: '#63b38a' },
  'Gold Quarter': { block: '#2c2417', street: '#3a3120', accent: '#d4af37' },
  'South End': { block: '#2a1f1f', street: '#3a2b2b', accent: '#c96b6b' }
};

let tick = 0;
let state = 'explore';
let turnCounter = 0;
let city = [];
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
let jessLocation = null;
let finalBossUnlocked = false;
let finalBossTile = null;
let gangName = 'The Family';

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
}

function districtFor(x, y) {
  if (x < 8 && y < 8) return 'North Side';
  if (x >= 8 && y < 8) return 'River Ward';
  if (x < 8 && y >= 8) return 'Gold Quarter';
  return 'South End';
}

function roadTile(x, y) {
  return x % 4 === 0 || y % 4 === 0;
}

function grecoBusinessName(index) {
  return `Greco ${grecoIndustries[index % grecoIndustries.length]}`;
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

function generateCity() {
  city = [];
  totalBusinesses = 0;
  districtTotals = {
    'North Side': 0,
    'River Ward': 0,
    'Gold Quarter': 0,
    'South End': 0
  };
  finalBossUnlocked = false;
  finalBossTile = {
    x: 15,
    y: 15,
    name: 'City Hall',
    unlocked: false,
    claimed: false
  };

  for (let y = 0; y < MAP; y++) {
    city[y] = [];
    for (let x = 0; x < MAP; x++) {
      city[y][x] = {
        kind: roadTile(x, y) ? 'street' : 'block',
        owner: null,
        name: '',
        guards: [],
        district: districtFor(x, y)
      };
    }
  }

  const spots = [
    [2, 2], [6, 2], [10, 2], [14, 2],
    [2, 6], [6, 6], [10, 6], [14, 6],
    [2, 10], [6, 10], [10, 10], [14, 10]
  ];

  spots.forEach((spot, i) => {
    const [x, y] = spot;
    const district = districtFor(x, y);
    const difficulty =
      district === 'North Side' ? 1 :
      district === 'River Ward' ? 2 :
      district === 'Gold Quarter' ? 2 : 3;

    const guardCount = difficulty === 1 ? rand(1, 2) : difficulty === 2 ? rand(2, 3) : rand(3, 4);
    const guards = [];

    for (let g = 0; g < guardCount; g++) {
      let rank = 'associate';
      if (g === guardCount - 1 && difficulty >= 2 && Math.random() < 0.5) rank = 'capo';
      if (g === guardCount - 1 && difficulty === 3 && Math.random() < 0.35) rank = 'boss';
      guards.push(makeGuard(rank, difficulty, district, false));
    }

    city[y][x] = {
      kind: 'business',
      owner: null,
      name: grecoBusinessName(i),
      district,
      businessType: grecoIndustries[i % grecoIndustries.length],
      difficulty,
      guards,
      donSite: false,
      income: difficulty === 1 ? rand(12, 18) : difficulty === 2 ? rand(18, 28) : rand(26, 40)
    };

    totalBusinesses++;
    districtTotals[district]++;
  });

  const donSites = [
    [6, 6, 'North Side', 12],
    [14, 6, 'River Ward', 13],
    [6, 14, 'Gold Quarter', 14],
    [14, 14, 'South End', 15]
  ];

  donSites.forEach(([x, y, district, nameIndex]) => {
    city[y][x] = {
      kind: 'business',
      owner: null,
      name: grecoBusinessName(nameIndex),
      district,
      businessType: grecoIndustries[nameIndex % grecoIndustries.length],
      difficulty: district === 'South End' ? 4 : 3,
      guards: [makeGuard('boss', district === 'South End' ? 4 : 3, district, true)],
      donSite: true,
      income: rand(36, 52)
    };

    totalBusinesses++;
    districtTotals[district]++;
  });

  jessLocation = {
    x: 1,
    y: 14,
    fee: 55,
    name: "Jess's Underground Clinic"
  };

  city[jessLocation.y][jessLocation.x] = {
    kind: 'clinic',
    owner: 'Jess',
    name: jessLocation.name,
    guards: [],
    district: 'Gold Quarter'
  };

  totalLabel.textContent = totalBusinesses;
}

function resetNewGame() {
  chooseGangName();

  city = [];
  totalBusinesses = 0;
  districtTotals = {
    'North Side': 0,
    'River Ward': 0,
    'Gold Quarter': 0,
    'South End': 0
  };
  currentBusiness = null;
  currentEnemy = null;
  currentDefeatedEnemy = null;
  state = 'explore';
  turnCounter = 0;
  logs.length = 0;

  Object.assign(player, {
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
  });

  generateCity();
  log(`New game started. Matt is back on the street with ${gangName}.`);
  log('Every business can be fought over, bribed, or intimidated.');
  log('Defeated Matts can be recruited into the family for passive bonuses.');
  log('District control boosts income, and each district has its own Don.');
  log('Leveling up makes Matt stronger — but it never heals him.');
  log('Jess runs her own clinic building. Use it when the city starts pushing back.');
  updateUI();
}

function getTile(x, y) {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return null;
  if (finalBossUnlocked && x === finalBossTile.x && y === finalBossTile.y && !finalBossTile.claimed) {
    return {
      kind: 'finalBoss',
      owner: null,
      name: finalBossTile.name,
      guards: [makeGuard('boss', 5, 'City Center', true)],
      district: 'City Center',
      difficulty: 5
    };
  }
  return city[y][x];
}

function countOwned() {
  let n = 0;
  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      const t = city[y][x];
      if (t.kind === 'business' && t.owner === 'Matt') n++;
    }
  }
  if (finalBossTile.claimed) n++;
  return n;
}

function districtOwnedCount(d) {
  let n = 0;
  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      const t = city[y][x];
      if (t.kind === 'business' && t.district === d && t.owner === 'Matt') n++;
    }
  }
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
    crewInfo.textContent = `${gangName} runs lean for now.`;
    return;
  }

  crewInfo.innerHTML = player.crew.map(c =>
    `<div>${c.name} — ${c.role} (+${c.bonus.attack} attack, +${c.bonus.income} income, +${c.bonus.intimidation} intimidation, +${c.bonus.cunning} cunning)</div>`
  ).join('');
}

function passiveIncome() {
  let businesses = 0;
  let income = 0;

  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      const t = city[y][x];
      if (t.kind === 'business' && t.owner === 'Matt') {
        businesses++;
        income += t.income;
      }
    }
  }

  if (finalBossTile.claimed) income += 80;
  if (!businesses && !finalBossTile.claimed) return;

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
      <div><span class="gold">${jessLocation.name}</span></div>
      <div>Jess: "You need patching up, Matt?"</div>
      <div>Full heal price: $${jessLocation.fee}.</div>
    `;
  } else if (state === 'recruit' && currentDefeatedEnemy) {
    info.innerHTML = `
      <div><span class="gold">${currentDefeatedEnemy.name}</span> is beaten.</div>
      <div>Recruit gives passive bonuses. Spare lets them walk. Eliminate removes them permanently.</div>
      <div>Trait was ${currentDefeatedEnemy.trait}. Rank: ${currentDefeatedEnemy.rank}. ${currentDefeatedEnemy.don ? 'Dons cannot be recruited.' : ''}</div>
    `;
  } else {
    const t = getTile(player.x, player.y);
    const currentDistrict = districtFor(player.x, player.y);

    if (t && t.kind === 'business') {
      if (t.owner === 'Matt') {
        info.innerHTML = `
          <div><span class="gold">Current District:</span> ${currentDistrict}</div>
          <div><span class="win">${t.name}</span> — Owned by Matt. Income: $${t.income}. District: ${t.district}.</div>
        `;
      } else {
        info.innerHTML = `
          <div><span class="gold">Current District:</span> ${currentDistrict}</div>
          <div><span class="gold">${t.name}</span> — ${t.businessType}. District: ${t.district}. Guards: ${t.guards.length}. Income if claimed: $${t.income}.</div>
        `;
      }
    } else if (t && t.kind === 'clinic') {
      info.innerHTML = `
        <div><span class="gold">Current District:</span> ${currentDistrict}</div>
        <div><span class="gold">${t.name}</span> — Jess heals Matt for a price.</div>
      `;
    } else if (finalBossUnlocked && player.x === finalBossTile.x && player.y === finalBossTile.y && !finalBossTile.claimed) {
      info.innerHTML = `
        <div><span class="gold">Current District:</span> City Center</div>
        <div><span class="danger">City Hall</span> — Don Mattissimo waits inside.</div>
      `;
    } else {
      info.innerHTML = `
        <div><span class="gold">Current District:</span> ${currentDistrict}</div>
        <div>Walk the city. Claim businesses, control districts, recruit a family, and build ${gangName}.</div>
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

  const owned = [];
  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      const t = city[y][x];
      if (t.kind === 'business' && t.owner === 'Matt') owned.push(t);
    }
  }

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
  player.x = jessLocation.x;
  player.y = jessLocation.y;
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

function visitJess() {
  state = 'clinic';
  log(`Matt steps into ${jessLocation.name}. Jess looks up from her table.`, 'blue');
  updateUI();
}

function confirmJessHeal() {
  if (state !== 'clinic') return;
  if (player.money < jessLocation.fee) {
    log(`Jess won't patch Matt up for free. She wants $${jessLocation.fee}.`, 'danger');
    updateUI();
    return;
  }
  player.money -= jessLocation.fee;
  player.hp = player.maxHp;
  player.stamina = player.maxStamina;
  log(`Jess patches Matt up completely for $${jessLocation.fee}.`, 'win');
  state = 'explore';
  updateUI();
}

function leaveJess() {
  if (state !== 'clinic') return;
  log(`Matt leaves Jess's clinic and heads back outside.`);
  state = 'explore';
  updateUI();
}

function checkWin() {
  if (finalBossTile.claimed) {
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

function stepOnTile(tile) {
  if (!tile) return;

  if (tile.kind === 'clinic') {
    visitJess();
    return;
  }

  if (tile.kind === 'finalBoss') {
    currentBusiness = {
      name: 'City Hall',
      district: 'City Center',
      difficulty: 5,
      guards: [{
        name: 'Don Mattissimo',
        rank: 'boss',
        district: 'City Center',
        trait: 'Snake',
        level: 12,
        maxHp: 150,
        hp: 150,
        attack: 18,
        dodge: 0.14,
        don: true
      }]
    };
    startCombat(currentBusiness);
    return;
  }

  if (tile.kind === 'business') {
    if (tile.owner === 'Matt') {
      log(`This place already answers to Matt: ${tile.name}.`);
    } else if (tile.guards.length > 0) {
      startCombat(tile);
    } else {
      claimBusiness(tile);
    }
  }
  updateUI();
}

function move(dx, dy) {
  if (state !== 'explore') return;

  const nx = Math.max(0, Math.min(MAP - 1, player.x + dx));
  const ny = Math.max(0, Math.min(MAP - 1, player.y + dy));
  player.x = nx;
  player.y = ny;
  stepOnTile(getTile(player.x, player.y));
  endStepEffects();
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

function drawDistrictLabels() {
  ctx.save();
  ctx.font = '16px Georgia';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillText('North Side', 128, 32);
  ctx.fillText('River Ward', 384, 32);
  ctx.fillText('Gold Quarter', 128, 288);
  ctx.fillText('South End', 384, 288);
  ctx.restore();
}

function drawCharacter(tx, ty, kind = 'player', boss = false) {
  const px = tx * TILE;
  const py = ty * TILE;
  const bob = Math.round(Math.sin(tick / 8 + tx * 0.4 + ty * 0.25) * 1);

  let suit = '#131313';
  let tie = '#c9a227';
  let hatBand = '#b6922f';

  if (kind === 'associate') { suit = '#1d1d1d'; tie = '#c9a227'; hatBand = '#8d6f1f'; }
  if (kind === 'capo') { suit = '#2a2a2a'; tie = '#cccccc'; hatBand = '#b0b0b0'; }
  if (kind === 'boss') { suit = '#0d0d0d'; tie = '#9f2222'; hatBand = '#9f2222'; }

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(px + 8, py + 25, 16, 4);

  ctx.fillStyle = suit;
  ctx.fillRect(px + 11, py + 20 + bob, 4, 8);
  ctx.fillRect(px + 17, py + 20 + bob, 4, 8);
  ctx.fillRect(px + 10, py + 12 + bob, 12, 10);

  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(px + 12, py + 13 + bob, 2, 5);
  ctx.fillRect(px + 18, py + 13 + bob, 2, 5);

  ctx.fillStyle = '#efefef';
  ctx.fillRect(px + 14, py + 13 + bob, 4, 7);

  ctx.fillStyle = tie;
  ctx.fillRect(px + 15, py + 14 + bob, 2, 6);

  ctx.fillStyle = suit;
  ctx.fillRect(px + 8, py + 13 + bob, 2, 8);
  ctx.fillRect(px + 22, py + 13 + bob, 2, 8);

  ctx.fillStyle = '#efc28e';
  ctx.fillRect(px + 11, py + 5 + bob, 10, 8);

  ctx.fillStyle = '#101010';
  ctx.fillRect(px + 13, py + 8 + bob, 1, 1);
  ctx.fillRect(px + 18, py + 8 + bob, 1, 1);

  ctx.fillStyle = '#090909';
  ctx.fillRect(px + 9, py + 4 + bob, 14, 2);
  ctx.fillRect(px + 11, py + 0 + bob, 10, 5);

  ctx.fillStyle = hatBand;
  ctx.fillRect(px + 11, py + 3 + bob, 10, 1);

  if (kind === 'player') {
    ctx.strokeStyle = '#f7e7b2';
    ctx.strokeRect(px + 7, py + 2 + bob, 18, 27);
  }

  if (boss) {
    ctx.strokeStyle = '#9f2222';
    ctx.strokeRect(px + 9, py + 11 + bob, 14, 12);
  }
}

function drawNurse(tx, ty) {
  const px = tx * TILE;
  const py = ty * TILE;
  const bob = Math.round(Math.sin(tick / 9 + tx * 0.4 + ty * 0.2) * 1);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(px + 8, py + 25, 16, 4);

  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(px + 10, py + 12 + bob, 12, 12);

  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(px + 12, py + 14 + bob, 8, 10);

  ctx.fillStyle = '#efc28e';
  ctx.fillRect(px + 8, py + 14 + bob, 2, 7);
  ctx.fillRect(px + 22, py + 14 + bob, 2, 7);

  ctx.fillStyle = '#efc28e';
  ctx.fillRect(px + 11, py + 5 + bob, 10, 8);

  ctx.fillStyle = '#5a3418';
  ctx.fillRect(px + 10, py + 4 + bob, 12, 4);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 11, py + 1 + bob, 10, 4);

  ctx.fillStyle = '#b22222';
  ctx.fillRect(px + 15, py + 1 + bob, 2, 4);
  ctx.fillRect(px + 14, py + 2 + bob, 4, 2);

  ctx.strokeStyle = '#dcdcdc';
  ctx.strokeRect(px + 10, py + 12 + bob, 12, 12);
}

function drawBusinessMarker(x, y, t) {
  const px = x * TILE;
  const py = y * TILE;

  ctx.fillStyle = '#f3efe6';
  ctx.fillRect(px + 3, py + 3, 26, 26);

  ctx.fillStyle = t.owner === 'Matt' ? '#1c5b38' : '#7a4a12';
  ctx.fillRect(px + 2, py + 6, 28, 20);

  ctx.fillStyle = t.owner === 'Matt' ? '#2f8a58' : '#b06a18';
  ctx.fillRect(px + 2, py + 6, 28, 4);

  ctx.fillStyle = '#2a1a0f';
  ctx.fillRect(px + 12, py + 16, 8, 10);

  ctx.fillStyle = '#d8c37f';
  ctx.fillRect(px + 5, py + 13, 4, 4);
  ctx.fillRect(px + 23, py + 13, 4, 4);

  if (!t.owner && t.guards.length > 0) {
    ctx.fillStyle = '#8f1d1d';
    ctx.beginPath();
    ctx.arc(px + 25, py + 9, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (t.donSite) {
    ctx.fillStyle = '#111';
    ctx.font = '9px Georgia';
    ctx.fillText('DON', px + 5, py + 29);
  }
}

function drawClinicTile(x, y) {
  const px = x * TILE;
  const py = y * TILE;
  ctx.fillStyle = '#181818';
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = '#f3efe6';
  ctx.fillRect(px + 3, py + 3, 26, 26);
  ctx.fillStyle = '#6d1b53';
  ctx.fillRect(px + 2, py + 8, 28, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 12, py + 5, 8, 5);
  ctx.fillRect(px + 14, py + 3, 4, 9);
  ctx.fillStyle = '#111';
  ctx.fillRect(px + 12, py + 17, 8, 9);
}

function drawFinalBossTile() {
  if (!finalBossUnlocked || finalBossTile.claimed) return;
  const px = finalBossTile.x * TILE;
  const py = finalBossTile.y * TILE;
  ctx.fillStyle = '#181818';
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = '#f3efe6';
  ctx.fillRect(px + 3, py + 3, 26, 26);
  ctx.fillStyle = '#4a0f0f';
  ctx.fillRect(px + 4, py + 8, 24, 16);
  ctx.fillStyle = '#d3c07c';
  ctx.fillRect(px + 6, py + 10, 20, 3);
  ctx.fillStyle = '#111';
  ctx.font = '9px Georgia';
  ctx.fillText('HALL', px + 4, py + 29);
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      const t = city[y][x];
      const px = x * TILE;
      const py = y * TILE;
      const district = districtFor(x, y);
      const style = districtStyles[district];

      if (t.kind === 'street') {
        ctx.fillStyle = style.street;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = style.accent;
        if (x % 4 === 0) ctx.fillRect(px + 14, py + 4, 4, 24);
        if (y % 4 === 0) ctx.fillRect(px + 4, py + 14, 24, 4);
      } else if (t.kind === 'block') {
        ctx.fillStyle = style.block;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#111';
        ctx.fillRect(px + 4, py + 4, 24, 24);
      } else if (t.kind === 'business') {
        ctx.fillStyle = '#181818';
        ctx.fillRect(px, py, TILE, TILE);
        drawBusinessMarker(x, y, t);
      } else if (t.kind === 'clinic') {
        drawClinicTile(x, y);
      }

      ctx.strokeStyle = '#111';
      ctx.strokeRect(px, py, TILE, TILE);
    }
  }

  drawFinalBossTile();

  if (state === 'explore') {
    for (let y = 0; y < MAP; y++) {
      for (let x = 0; x < MAP; x++) {
        const t = city[y][x];
        if (t.kind === 'business' && !t.owner && t.guards.length > 0) {
          const lead = t.guards[0];
          const kind = lead.rank === 'boss' ? 'boss' : lead.rank === 'capo' ? 'capo' : 'associate';
          drawCharacter(x, y, kind, lead.rank === 'boss' || lead.don);
        } else if (t.kind === 'clinic') {
          drawNurse(x, y);
        }
      }
    }

    if (finalBossUnlocked && !finalBossTile.claimed) {
      drawCharacter(finalBossTile.x, finalBossTile.y, 'boss', true);
    }
  }

  drawDistrictLabels();
  drawCharacter(player.x, player.y, 'player', false);

  if (state === 'combat' && currentEnemy) {
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#141414';
    ctx.fillRect(304, 168, 156, 132);
    ctx.strokeStyle = '#4a4a4a';
    ctx.strokeRect(304, 168, 156, 132);
    const kind = currentEnemy.rank === 'boss' ? 'boss' : currentEnemy.rank === 'capo' ? 'capo' : 'associate';
    drawCharacter(11, 6, kind, currentEnemy.rank === 'boss' || currentEnemy.don);
    ctx.fillStyle = '#f5f1e8';
    ctx.font = '14px Georgia';
    ctx.fillText(`${currentEnemy.name} Lv ${currentEnemy.level}`, 314, 280);
    ctx.fillText(`${currentEnemy.trait}`, 314, 296);
  }

  if (state === 'clinic') {
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
    ctx.fillStyle = '#78909c';
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
    drawCharacter(5, 6, 'player', false);
    drawNurse(9, 6);
    ctx.fillStyle = '#263238';
    ctx.fillRect(88, 298, 336, 58);
    ctx.strokeStyle = '#37474f';
    ctx.strokeRect(88, 298, 336, 58);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Georgia';
    ctx.fillText('Jess: "You need a full heal, Matt?"', 100, 320);
    ctx.fillText(`Cost: $${jessLocation.fee}`, 100, 340);
  }

  if (state === 'recruit' && currentDefeatedEnemy) {
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
    drawCharacter(5, 5, 'player', false);

    const kind = currentDefeatedEnemy.rank === 'boss'
      ? 'boss'
      : currentDefeatedEnemy.rank === 'capo'
        ? 'capo'
        : 'associate';

    drawCharacter(10, 5, kind, currentDefeatedEnemy.rank === 'boss' || currentDefeatedEnemy.don);

    ctx.fillStyle = '#111';
    ctx.font = '16px Georgia';
    ctx.fillText(`${currentDefeatedEnemy.name} is finished.`, 156, 286);
    ctx.font = '14px Georgia';
    ctx.fillText(`Trait: ${currentDefeatedEnemy.trait} (${traitBonusDescription(currentDefeatedEnemy.trait)})`, 114, 312);
    ctx.fillText(currentDefeatedEnemy.don ? 'A Don cannot be recruited.' : 'Recruit, spare, or eliminate.', 136, 334);
  }

  if (state === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.54)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7e7b2';
    ctx.font = '28px Georgia';
    ctx.fillText('Mattopoly Complete', 120, 236);
    ctx.font = '16px Georgia';
    ctx.fillText(`The whole city answers to ${gangName}.`, 138, 268);
  }
}

function loop() {
  tick++;
  drawMap();
  requestAnimationFrame(loop);
}

resetNewGame();
updateStatAllocationVisibility();
loop();