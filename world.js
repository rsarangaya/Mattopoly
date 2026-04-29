// ============================================================
// WORLD MAP, INTERIORS, NPCs, CAMERA
// ============================================================

const WORLD_W = 60;
const WORLD_H = 60;
const VIEW_W = 16;
const VIEW_H = 16;

// Tile types
const T = {
  VOID:0, SIDEWALK:1, ROAD:2, BWALL:3, DOOR:4, GRASS:5,
  TREE:6, LAMP:7, BENCH:8, FENCE:9, WATER:10, BRIDGE:11, SIGN:12,
  FLOOR:20, IWALL:21, DESK:22, SHELF:23, CRATE:24, IDOOR:25,
  RUG:26, CHAIR:27, BAR_COUNTER:28, TABLE:29
};

const WALKABLE = new Set([
  T.SIDEWALK, T.ROAD, T.DOOR, T.GRASS, T.BRIDGE, T.SIGN,
  T.FLOOR, T.IDOOR, T.RUG
]);

// Camera
const camera = { x:0, y:0 };

function updateCamera(px, py, mapW, mapH) {
  const targetX = px * TILE - (canvas.width / 2) + TILE / 2;
  const targetY = py * TILE - (canvas.height / 2) + TILE / 2;
  const maxX = mapW * TILE - canvas.width;
  const maxY = mapH * TILE - canvas.height;
  camera.x = Math.max(0, Math.min(maxX, targetX));
  camera.y = Math.max(0, Math.min(maxY, targetY));
}

// World map array
let worldMap = [];

// District definitions
const DISTRICTS = {
  'North Side':   { ox:2,  oy:2,  w:22, h:22, diff:1, accent:'#6f86ff', block:'#1f1f2e', street:'#2b2b3f' },
  'River Ward':   { ox:36, oy:2,  w:22, h:22, diff:2, accent:'#63b38a', block:'#1f2a24', street:'#2d3a33' },
  'Gold Quarter': { ox:2,  oy:36, w:22, h:22, diff:2, accent:'#d4af37', block:'#2c2417', street:'#3a3120' },
  'South End':    { ox:36, oy:36, w:22, h:22, diff:3, accent:'#c96b6b', block:'#2a1f1f', street:'#3a2b2b' }
};

// Building registry
const buildingDefs = [];

// NPC registry
const npcDefs = [];

// ===== WORLD BUILDER =====

function initWorldMap() {
  worldMap = [];
  for (let y = 0; y < WORLD_H; y++) {
    worldMap[y] = [];
    for (let x = 0; x < WORLD_W; x++) {
      worldMap[y][x] = T.VOID;
    }
  }
}

function fillRect(tx, ty, w, h, tile) {
  for (let y = ty; y < ty + h && y < WORLD_H; y++)
    for (let x = tx; x < tx + w && x < WORLD_W; x++)
      worldMap[y][x] = tile;
}

function setTile(x, y, tile) {
  if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) worldMap[y][x] = tile;
}

function getTileType(x, y) {
  if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return T.VOID;
  return worldMap[y][x];
}

function districtAt(x, y) {
  for (const [name, d] of Object.entries(DISTRICTS)) {
    if (x >= d.ox && x < d.ox + d.w && y >= d.oy && y < d.oy + d.h) return name;
  }
  if (x >= 24 && x <= 35 && y >= 24 && y <= 35) return 'City Center';
  return null;
}

function buildDistrict(name) {
  const d = DISTRICTS[name];
  const { ox, oy, w, h } = d;

  // Fill with sidewalk
  fillRect(ox, oy, w, h, T.SIDEWALK);

  // Border fences
  for (let x = ox; x < ox + w; x++) { setTile(x, oy, T.FENCE); setTile(x, oy + h - 1, T.FENCE); }
  for (let y = oy; y < oy + h; y++) { setTile(ox, y, T.FENCE); setTile(ox + w - 1, y, T.FENCE); }

  // Internal roads — grid every 5 tiles
  const roadRows = [oy + 4, oy + 10, oy + 16];
  const roadCols = [ox + 4, ox + 10, ox + 16];

  roadRows.forEach(ry => { for (let x = ox + 1; x < ox + w - 1; x++) setTile(x, ry, T.ROAD); });
  roadCols.forEach(cx => { for (let y = oy + 1; y < oy + h - 1; y++) setTile(cx, y, T.ROAD); });

  // Trees along edges
  for (let x = ox + 2; x < ox + w - 2; x += 3) {
    if (worldMap[oy + 1][x] === T.SIDEWALK) setTile(x, oy + 1, T.TREE);
    if (worldMap[oy + h - 2][x] === T.SIDEWALK) setTile(x, oy + h - 2, T.TREE);
  }
  for (let y = oy + 2; y < oy + h - 2; y += 3) {
    if (worldMap[y][ox + 1] === T.SIDEWALK) setTile(ox + 1, y, T.TREE);
    if (worldMap[y][ox + w - 2] === T.SIDEWALK) setTile(ox + w - 2, y, T.TREE);
  }

  // Lampposts at road intersections
  roadRows.forEach(ry => {
    roadCols.forEach(cx => {
      if (cx + 1 < ox + w - 1 && ry + 1 < oy + h - 1) setTile(cx + 1, ry + 1, T.LAMP);
    });
  });

  // Open gate in fences for paths
  const midX = ox + Math.floor(w / 2);
  const midY = oy + Math.floor(h / 2);
  // Bottom gate
  setTile(midX, oy + h - 1, T.SIDEWALK); setTile(midX - 1, oy + h - 1, T.SIDEWALK); setTile(midX + 1, oy + h - 1, T.SIDEWALK);
  // Top gate
  setTile(midX, oy, T.SIDEWALK); setTile(midX - 1, oy, T.SIDEWALK); setTile(midX + 1, oy, T.SIDEWALK);
  // Left gate
  setTile(ox, midY, T.SIDEWALK); setTile(ox, midY - 1, T.SIDEWALK); setTile(ox, midY + 1, T.SIDEWALK);
  // Right gate
  setTile(ox + w - 1, midY, T.SIDEWALK); setTile(ox + w - 1, midY - 1, T.SIDEWALK); setTile(ox + w - 1, midY + 1, T.SIDEWALK);

  // District sign near top gate
  setTile(midX + 2, oy + 2, T.SIGN);
}

function buildConnectingPaths() {
  // Horizontal path top (North Side → River Ward): y=11-14, x=23-36 (overlap district edges)
  for (let y = 11; y <= 14; y++)
    for (let x = 23; x <= 36; x++) setTile(x, y, y === 12 || y === 13 ? T.ROAD : T.SIDEWALK);

  // Horizontal path bottom (Gold Quarter → South End): y=46-49, x=23-36
  for (let y = 46; y <= 49; y++)
    for (let x = 23; x <= 36; x++) setTile(x, y, y === 47 || y === 48 ? T.ROAD : T.SIDEWALK);

  // Vertical path left (North Side → Gold Quarter): x=11-14, y=23-36
  for (let x = 11; x <= 14; x++)
    for (let y = 23; y <= 36; y++) setTile(x, y, x === 12 || x === 13 ? T.ROAD : T.SIDEWALK);

  // Vertical path right (River Ward → South End): x=46-49, y=23-36
  for (let x = 46; x <= 49; x++)
    for (let y = 23; y <= 36; y++) setTile(x, y, x === 47 || x === 48 ? T.ROAD : T.SIDEWALK);

  // Trees along paths (offset from edges to avoid blocking)
  [11, 14].forEach(y => { for (let x = 26; x <= 33; x += 3) setTile(x, y, T.TREE); });
  [46, 49].forEach(y => { for (let x = 26; x <= 33; x += 3) setTile(x, y, T.TREE); });
  [11, 14].forEach(x => { for (let y = 26; y <= 33; y += 3) setTile(x, y, T.TREE); });
  [46, 49].forEach(x => { for (let y = 26; y <= 33; y += 3) setTile(x, y, T.TREE); });
}

function buildCenterPlaza() {
  // Plaza area 24-35, 24-35
  fillRect(24, 24, 12, 12, T.SIDEWALK);
  // Central roads through plaza
  for (let i = 24; i <= 35; i++) { setTile(i, 29, T.ROAD); setTile(i, 30, T.ROAD); setTile(29, i, T.ROAD); setTile(30, i, T.ROAD); }
  // Benches
  setTile(26, 26, T.BENCH); setTile(33, 26, T.BENCH);
  setTile(26, 33, T.BENCH); setTile(33, 33, T.BENCH);
  // Lampposts
  setTile(25, 25, T.LAMP); setTile(34, 25, T.LAMP);
  setTile(25, 34, T.LAMP); setTile(34, 34, T.LAMP);
}

function placeBuildingOnMap(bx, by, bw, bh, doorOffsetX) {
  for (let y = by; y < by + bh; y++)
    for (let x = bx; x < bx + bw; x++) setTile(x, y, T.BWALL);
  // Door row: walls flanking the door so building sits on the ground
  for (let x = bx; x < bx + bw; x++) {
    if (x === bx + doorOffsetX) setTile(x, by + bh, T.DOOR);
    else setTile(x, by + bh, T.BWALL);
  }
}

function placeAllBuildings() {
  buildingDefs.length = 0;
  let id = 0;

  // North Side businesses (diff 1)
  const nsBiz = [
    { bx:6,  by:6,  name:'Greco Insurance' },
    { bx:14, by:6,  name:'Greco Trading' },
    { bx:6,  by:12, name:'Greco Logistics' }
  ];
  nsBiz.forEach(b => {
    placeBuildingOnMap(b.bx, b.by, 4, 3, 1);
    buildingDefs.push({
      id: id++, name: b.name, district:'North Side', difficulty:1, donSite:false,
      worldX: b.bx, worldY: b.by, doorX: b.bx + 1, doorY: b.by + 3,
      bw:4, bh:3, income: 12 + Math.floor(Math.random()*7), owner:null, guards:[], cleared:false
    });
  });
  // North Side Don
  placeBuildingOnMap(14, 14, 5, 4, 2);
  buildingDefs.push({
    id: id++, name:'Greco Textiles HQ', district:'North Side', difficulty:3, donSite:true,
    worldX:14, worldY:14, doorX:16, doorY:18,
    bw:5, bh:4, income: 36 + Math.floor(Math.random()*17), owner:null, guards:[], cleared:false
  });

  // River Ward businesses (diff 2)
  const rwBiz = [
    { bx:40, by:6,  name:'Greco Imports' },
    { bx:48, by:6,  name:'Greco Exports' },
    { bx:40, by:12, name:'Greco Construction' }
  ];
  rwBiz.forEach(b => {
    placeBuildingOnMap(b.bx, b.by, 4, 3, 1);
    buildingDefs.push({
      id: id++, name: b.name, district:'River Ward', difficulty:2, donSite:false,
      worldX: b.bx, worldY: b.by, doorX: b.bx + 1, doorY: b.by + 3,
      bw:4, bh:3, income: 18 + Math.floor(Math.random()*11), owner:null, guards:[], cleared:false
    });
  });
  // River Ward Don
  placeBuildingOnMap(48, 14, 5, 4, 2);
  buildingDefs.push({
    id: id++, name:'Greco Shipping HQ', district:'River Ward', difficulty:3, donSite:true,
    worldX:48, worldY:14, doorX:50, doorY:18,
    bw:5, bh:4, income: 36 + Math.floor(Math.random()*17), owner:null, guards:[], cleared:false
  });

  // Gold Quarter businesses (diff 2)
  const gqBiz = [
    { bx:6,  by:40, name:'Greco Real Estate' },
    { bx:14, by:40, name:'Greco Finance' },
    { bx:6,  by:48, name:'Greco Hospitality' }
  ];
  gqBiz.forEach(b => {
    placeBuildingOnMap(b.bx, b.by, 4, 3, 1);
    buildingDefs.push({
      id: id++, name: b.name, district:'Gold Quarter', difficulty:2, donSite:false,
      worldX: b.bx, worldY: b.by, doorX: b.bx + 1, doorY: b.by + 3,
      bw:4, bh:3, income: 18 + Math.floor(Math.random()*11), owner:null, guards:[], cleared:false
    });
  });
  // Gold Quarter Don
  placeBuildingOnMap(14, 48, 5, 4, 2);
  buildingDefs.push({
    id: id++, name:'Greco Security HQ', district:'Gold Quarter', difficulty:3, donSite:true,
    worldX:14, worldY:48, doorX:16, doorY:52,
    bw:5, bh:4, income: 36 + Math.floor(Math.random()*17), owner:null, guards:[], cleared:false
  });

  // South End businesses (diff 3)
  const seBiz = [
    { bx:40, by:40, name:'Greco Wholesale' },
    { bx:48, by:40, name:'Greco Motors' },
    { bx:40, by:48, name:'Greco Warehousing' }
  ];
  seBiz.forEach(b => {
    placeBuildingOnMap(b.bx, b.by, 4, 3, 1);
    buildingDefs.push({
      id: id++, name: b.name, district:'South End', difficulty:3, donSite:false,
      worldX: b.bx, worldY: b.by, doorX: b.bx + 1, doorY: b.by + 3,
      bw:4, bh:3, income: 26 + Math.floor(Math.random()*15), owner:null, guards:[], cleared:false
    });
  });
  // South End Don
  placeBuildingOnMap(48, 48, 5, 4, 2);
  buildingDefs.push({
    id: id++, name:'Greco Freight HQ', district:'South End', difficulty:4, donSite:true,
    worldX:48, worldY:48, doorX:50, doorY:52,
    bw:5, bh:4, income: 36 + Math.floor(Math.random()*17), owner:null, guards:[], cleared:false
  });

  // Jess's Clinic in Gold Quarter
  placeBuildingOnMap(18, 40, 4, 3, 1);
  // Clinic door
  setTile(19, 43, T.DOOR);

  // City Hall in center (only appears when unlocked)
  placeBuildingOnMap(28, 26, 4, 3, 1);
}

// ===== BUILDING INTERIORS =====

function generateInterior(building) {
  const diff = building.difficulty;
  let iw, ih;
  if (diff <= 1) { iw = 8; ih = 7; }
  else if (diff <= 2) { iw = 10; ih = 8; }
  else if (diff <= 3) { iw = 12; ih = 10; }
  else { iw = 14; ih = 12; }

  const map = [];
  for (let y = 0; y < ih; y++) {
    map[y] = [];
    for (let x = 0; x < iw; x++) {
      if (y === 0 || y === ih - 1 || x === 0 || x === iw - 1) map[y][x] = T.IWALL;
      else map[y][x] = T.FLOOR;
    }
  }

  // Door at bottom center
  const doorX = Math.floor(iw / 2);
  map[ih - 1][doorX] = T.IDOOR;

  // Furniture based on business type
  const name = building.name.toLowerCase();
  if (name.includes('insurance') || name.includes('finance') || name.includes('real estate')) {
    // Office: desks in rows
    for (let r = 2; r < ih - 3; r += 2) {
      for (let c = 2; c < iw - 2; c += 3) {
        if (map[r][c] === T.FLOOR) map[r][c] = T.DESK;
      }
    }
    if (iw > 4) map[1][1] = T.SHELF;
    if (iw > 4) map[1][iw - 2] = T.SHELF;
  } else if (name.includes('warehouse') || name.includes('wholesale') || name.includes('freight') || name.includes('shipping')) {
    // Warehouse: crates
    for (let r = 1; r < ih - 2; r += 2) {
      for (let c = 1; c < iw - 1; c += 3) {
        if (map[r][c] === T.FLOOR && r > 1) map[r][c] = T.CRATE;
      }
    }
  } else if (name.includes('hospitality')) {
    // Bar: counter and tables
    for (let c = 2; c < iw - 2; c++) map[2][c] = T.BAR_COUNTER;
    for (let r = 4; r < ih - 2; r += 2) {
      for (let c = 2; c < iw - 2; c += 3) {
        if (map[r][c] === T.FLOOR) map[r][c] = T.TABLE;
      }
    }
  } else {
    // Generic: mixed furniture
    for (let r = 2; r < ih - 3; r += 3) {
      map[r][1] = T.SHELF;
      map[r][iw - 2] = T.SHELF;
    }
    if (ih > 5) map[Math.floor(ih / 2)][Math.floor(iw / 2)] = T.DESK;
  }

  // Rug near entrance
  if (map[ih - 2][doorX] === T.FLOOR) map[ih - 2][doorX] = T.RUG;

  return { map, w: iw, h: ih, doorX, doorY: ih - 1 };
}

function placeEnemiesInInterior(building, interior) {
  const enemies = [];
  const diff = building.difficulty;
  const gruntCount = diff <= 1 ? randInt(1, 2) : diff <= 2 ? randInt(2, 3) : randInt(3, 4);

  // Find walkable spots (not door, not near door)
  const spots = [];
  for (let y = 1; y < interior.h - 2; y++) {
    for (let x = 1; x < interior.w - 1; x++) {
      if (interior.map[y][x] === T.FLOOR && !(x === interior.doorX && y >= interior.h - 2)) {
        spots.push({ x, y });
      }
    }
  }

  // Shuffle and pick spots for grunts
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }

  // All pre-placed enemies are grunts (associates only)
  for (let g = 0; g < gruntCount && g < spots.length; g++) {
    enemies.push({
      x: spots[g].x, y: spots[g].y,
      guard: makeGuard('associate', diff, building.district, false),
      defeated: false
    });
  }

  // Capo: appears after all grunts are defeated (center of room)
  const capoSpot = { x: Math.floor(interior.w / 2), y: Math.max(1, Math.floor(interior.h / 2) - 1) };
  const capoGuard = makeGuard('capo', diff, building.district, false);

  // Don boss: appears after capo is defeated (back of room)
  const bossSpot = { x: Math.floor(interior.w / 2), y: 1 };
  let bossGuard = null;
  if (building.donSite) {
    bossGuard = makeGuard('boss', Math.min(diff + 1, 5), building.district, true);
  }

  return {
    enemies,
    capoSpot, capoGuard, capoSpawned: false, capoDefeated: false,
    bossSpot, bossGuard, bossSpawned: false, bossDefeated: false
  };
}

function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// ===== NPCs =====

const NPC_DIALOGUES = {
  'North Side': [
    ["I've been living here my whole life. Used to be quiet.", "Greco's guys run everything now. Someone ought to do something."],
    ["You look like trouble. Good.", "The insurance racket on 5th? Full of grunts. Be careful."],
    ["Word of advice — save your whiskey for the hard fights.", "You'll know when you need it."],
  ],
  'River Ward': [
    ["The docks used to be honest work. Now it's all Greco.", "Imports, exports... it's all a front."],
    ["I saw a guy try to bribe one of Greco's bookkeepers once.", "Didn't end well. They're loyal to the money."],
    ["If you're heading south, bring backup. Or at least some cash.", "Jess has a clinic in the Gold Quarter if things go bad."],
  ],
  'Gold Quarter': [
    ["Money talks in this part of town. Always has.", "Greco's finance boys are slippery. Cunning helps."],
    ["Jess? Yeah, she's the real deal. Expensive, but she'll fix you up.", "Her clinic's right down the road."],
    ["I heard if someone took all four districts...", "...the big boss himself would have to show his face. City Hall."],
  ],
  'South End': [
    ["You don't belong here, friend. Turn back.", "Unless you're here to fight. Then welcome to hell."],
    ["The South End breaks people. Greco's hardest crew is here.", "Heavy hitters, every one of them. Level up first."],
    ["Someone told me intimidation clears whole rooms sometimes.", "If you're scary enough, they just run."],
  ],
  'City Center': [
    ["This plaza used to be for everyone. Now it's no man's land.", "Four gangs, four corners. And City Hall watching it all."],
    ["You've been making waves, haven't you?", "Keep it up. This city needs new management."],
  ]
};

function placeNPCs() {
  npcDefs.length = 0;
  let id = 0;

  const npcSpots = {
    'North Side':   [{x:10, y:8}, {x:18, y:10}, {x:8, y:18}],
    'River Ward':   [{x:44, y:8}, {x:52, y:10}, {x:42, y:18}],
    'Gold Quarter': [{x:10, y:42}, {x:18, y:46}, {x:10, y:52}],
    'South End':    [{x:44, y:42}, {x:52, y:46}, {x:44, y:52}],
    'City Center':  [{x:27, y:27}, {x:32, y:32}]
  };

  for (const [district, spots] of Object.entries(npcSpots)) {
    const dialogues = NPC_DIALOGUES[district] || [];
    spots.forEach((spot, i) => {
      if (getTileType(spot.x, spot.y) !== T.VOID) {
        npcDefs.push({
          id: id++,
          x: spot.x, y: spot.y,
          district,
          dialogue: dialogues[i % dialogues.length] || ["..."],
          dialogueIndex: 0
        });
      }
    });
  }
}

// ===== FULL WORLD BUILD =====

function buildWorld() {
  initWorldMap();
  for (const name of Object.keys(DISTRICTS)) buildDistrict(name);
  buildConnectingPaths();
  buildCenterPlaza();
  placeAllBuildings();
  placeNPCs();
}

function getBuildingAtDoor(x, y) {
  return buildingDefs.find(b => b.doorX === x && b.doorY === y);
}

function isNPCAt(x, y) {
  return npcDefs.find(n => n.x === x && n.y === y);
}

function isJessClinicDoor(x, y) {
  return x === 19 && y === 43;
}

function isCityHallDoor(x, y) {
  return x === 29 && y === 29;
}
