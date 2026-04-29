// ============================================================
// RENDERER — Pokemon Gen 1 Style Drawing
// ============================================================

// Tile colors
const TILE_COLORS = {
  [T.VOID]: '#000',
  [T.SIDEWALK]: '#3a3a3a',
  [T.ROAD]: '#2a2a2a',
  [T.BWALL]: '#4a3a2a',
  [T.DOOR]: '#5a4020',
  [T.GRASS]: '#1a3a1a',
  [T.TREE]: '#0d260d',
  [T.LAMP]: '#3a3a3a',
  [T.BENCH]: '#3a3a3a',
  [T.FENCE]: '#2a2015',
  [T.WATER]: '#0a1a3a',
  [T.BRIDGE]: '#4a3a20',
  [T.SIGN]: '#3a3a3a',
  [T.FLOOR]: '#4a4238',
  [T.IWALL]: '#2a2220',
  [T.DESK]: '#5a4a30',
  [T.SHELF]: '#3a3020',
  [T.CRATE]: '#5a4a28',
  [T.IDOOR]: '#5a4020',
  [T.RUG]: '#6a2020',
  [T.CHAIR]: '#4a3a28',
  [T.BAR_COUNTER]: '#3a2a18',
  [T.TABLE]: '#5a4a30'
};

// Screen transition state
let transition = { active: false, alpha: 0, dir: 1, callback: null, speed: 0.06 };

function startTransition(cb) {
  transition.active = true;
  transition.alpha = 0;
  transition.dir = 1;
  transition.callback = cb;
}

function updateTransition() {
  if (!transition.active) return;
  transition.alpha += transition.dir * transition.speed;
  if (transition.dir === 1 && transition.alpha >= 1) {
    transition.alpha = 1;
    if (transition.callback) { transition.callback(); transition.callback = null; }
    transition.dir = -1;
  }
  if (transition.dir === -1 && transition.alpha <= 0) {
    transition.alpha = 0;
    transition.active = false;
  }
}

// ===== OVERWORLD TILE DRAWING =====

function drawOverworldTile(x, y, px, py) {
  const tile = getTileType(x, y);
  const dist = districtAt(x, y);
  const ds = dist ? DISTRICTS[dist] : null;

  // Base color
  let color = TILE_COLORS[tile] || '#000';

  // District-tinted colors
  if (ds) {
    if (tile === T.SIDEWALK) color = ds.street;
    else if (tile === T.ROAD) {
      const r = parseInt(ds.street.slice(1,3),16) - 10;
      const g = parseInt(ds.street.slice(3,5),16) - 10;
      const b = parseInt(ds.street.slice(5,7),16) - 10;
      color = `rgb(${Math.max(0,r)},${Math.max(0,g)},${Math.max(0,b)})`;
    }
  }

  ctx.fillStyle = color;
  ctx.fillRect(px, py, TILE, TILE);

  // Tile details
  if (tile === T.ROAD) {
    // Road markings
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + 14, py + 2, 4, 4);
    ctx.fillRect(px + 14, py + 10, 4, 4);
    ctx.fillRect(px + 14, py + 18, 4, 4);
    ctx.fillRect(px + 14, py + 26, 4, 4);
  } else if (tile === T.TREE) {
    // Tree trunk
    ctx.fillStyle = '#3a2a10';
    ctx.fillRect(px + 13, py + 20, 6, 12);
    // Canopy
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(px + 6, py + 4, 20, 18);
    ctx.fillStyle = '#2a5a2a';
    ctx.fillRect(px + 8, py + 6, 16, 14);
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(px + 10, py + 2, 12, 8);
  } else if (tile === T.LAMP) {
    ctx.fillStyle = '#888';
    ctx.fillRect(px + 14, py + 8, 4, 24);
    ctx.fillStyle = '#ffdd66';
    ctx.fillRect(px + 10, py + 4, 12, 6);
    // Glow
    ctx.fillStyle = 'rgba(255,220,100,0.08)';
    ctx.fillRect(px - 4, py - 4, 40, 40);
  } else if (tile === T.BENCH) {
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(px + 4, py + 14, 24, 6);
    ctx.fillRect(px + 6, py + 20, 4, 8);
    ctx.fillRect(px + 22, py + 20, 4, 8);
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(px + 4, py + 10, 24, 4);
  } else if (tile === T.FENCE) {
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(px, py + 10, TILE, 4);
    ctx.fillRect(px, py + 20, TILE, 4);
    for (let fx = px + 4; fx < px + TILE; fx += 8) {
      ctx.fillRect(fx, py + 4, 3, 24);
    }
  } else if (tile === T.BWALL) {
    // Context-aware building rendering
    const above = getTileType(x, y - 1);
    const below = getTileType(x, y + 1);
    const isTop = (above !== T.BWALL);
    const isBottom = (below !== T.BWALL && below !== T.DOOR);
    const hasWindow = ((x + y) % 2 === 0) && !isBottom;

    // Base brick wall
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#3e3020';
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // Brick pattern
    ctx.fillStyle = '#352818';
    for (let by = py + 2; by < py + TILE - 2; by += 6) {
      const offset = (Math.floor((by - py) / 6) % 2) * 4;
      for (let bx = px + 2 + offset; bx < px + TILE - 2; bx += 8) {
        ctx.fillRect(bx, by, 6, 4);
      }
    }

    if (isTop) {
      // Roof cap / cornice
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(px, py, TILE, 6);
      ctx.fillStyle = '#5a4a38';
      ctx.fillRect(px, py + 5, TILE, 3);
      // Overhang shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(px, py + 8, TILE, 2);
    }

    if (isBottom) {
      // Storefront base — solid with trim line
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#4a3a28';
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      // Base trim
      ctx.fillStyle = '#5a4a38';
      ctx.fillRect(px, py, TILE, 3);
    } else if (hasWindow) {
      // Window (only on alternating tiles, not bottom)
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(px + 8, py + 10, 16, 12);
      ctx.fillStyle = '#253545';
      ctx.fillRect(px + 9, py + 11, 14, 10);
      // Window frame cross
      ctx.fillStyle = '#4a3a28';
      ctx.fillRect(px + 15, py + 10, 2, 12);
      ctx.fillRect(px + 8, py + 15, 16, 2);
      // Sill
      ctx.fillStyle = '#5a4a38';
      ctx.fillRect(px + 7, py + 22, 18, 2);
    }
  } else if (tile === T.DOOR) {
    // Door on building — blends into the building wall
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // Door frame
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(px + 6, py + 1, 20, 30);
    // Door
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(px + 8, py + 3, 16, 28);
    ctx.fillStyle = '#6a4a28';
    ctx.fillRect(px + 9, py + 4, 14, 26);
    // Panel detail
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(px + 11, py + 6, 10, 10);
    ctx.fillRect(px + 11, py + 18, 10, 8);
    // Handle
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(px + 20, py + 17, 2, 3);
    // Step / threshold
    ctx.fillStyle = '#5a4a38';
    ctx.fillRect(px + 4, py + 29, 24, 3);
  } else if (tile === T.SIGN) {
    // District sign post
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(px + 14, py + 14, 4, 18);
    ctx.fillStyle = '#eee';
    ctx.fillRect(px + 4, py + 4, 24, 12);
    ctx.fillStyle = '#333';
    ctx.font = '7px monospace';
    const d = districtAt(x, y);
    const label = d ? d.substring(0, 6) : '???';
    ctx.fillText(label, px + 5, py + 13);
  } else if (tile === T.SIDEWALK) {
    // Subtle sidewalk lines
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.strokeRect(px, py, TILE, TILE);
  }
}

// ===== INTERIOR TILE DRAWING =====

function drawInteriorTile(tile, px, py) {
  ctx.fillStyle = TILE_COLORS[tile] || '#000';
  ctx.fillRect(px, py, TILE, TILE);

  if (tile === T.IWALL) {
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = '#2a2220';
    ctx.fillRect(px, py + TILE - 4, TILE, 4);
  } else if (tile === T.DESK) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#6a5a40';
    ctx.fillRect(px + 2, py + 4, 28, 18);
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(px + 4, py + 6, 24, 14);
    // Drawer handle
    ctx.fillStyle = '#888';
    ctx.fillRect(px + 14, py + 22, 4, 2);
  } else if (tile === T.SHELF) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#4a3820';
    ctx.fillRect(px + 2, py + 2, 28, 28);
    for (let sy = py + 4; sy < py + 28; sy += 8) {
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(px + 3, sy, 26, 2);
      ctx.fillStyle = '#666';
      ctx.fillRect(px + 5, sy - 5, 6, 5);
      ctx.fillRect(px + 14, sy - 4, 5, 4);
    }
  } else if (tile === T.CRATE) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#6a5828';
    ctx.fillRect(px + 2, py + 4, 28, 24);
    ctx.fillStyle = '#5a4818';
    ctx.fillRect(px + 3, py + 5, 26, 22);
    ctx.strokeStyle = '#4a3808';
    ctx.strokeRect(px + 6, py + 8, 20, 16);
    ctx.beginPath(); ctx.moveTo(px + 6, py + 8); ctx.lineTo(px + 26, py + 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 26, py + 8); ctx.lineTo(px + 6, py + 24); ctx.stroke();
  } else if (tile === T.IDOOR) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(px + 6, py + 2, 20, 28);
    ctx.fillStyle = '#6a4a28';
    ctx.fillRect(px + 8, py + 4, 16, 24);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(px + 21, py + 16, 2, 3);
  } else if (tile === T.RUG) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#7a2a2a';
    ctx.fillRect(px + 2, py + 2, 28, 28);
    ctx.fillStyle = '#8a3a3a';
    ctx.fillRect(px + 4, py + 4, 24, 24);
    ctx.fillStyle = '#9a4a2a';
    ctx.fillRect(px + 8, py + 8, 16, 16);
  } else if (tile === T.BAR_COUNTER) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#3a2a14';
    ctx.fillRect(px, py + 6, TILE, 20);
    ctx.fillStyle = '#4a3a24';
    ctx.fillRect(px, py + 4, TILE, 4);
  } else if (tile === T.TABLE) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(px + 6, py + 6, 20, 16);
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(px + 8, py + 22, 4, 8);
    ctx.fillRect(px + 20, py + 22, 4, 8);
  } else if (tile === T.FLOOR) {
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.strokeRect(px, py, TILE, TILE);
  }
}

// ===== CHARACTER DRAWING (updated with facing) =====

function drawSprite(px, py, kind, facing, walkFrame, boss) {
  const bob = (kind === 'player') ? 0 : Math.round(Math.sin(tick / 8) * 1);
  const step = walkFrame % 2 === 1 ? 2 : 0;

  let suit = '#131313', tie = '#c9a227', hatBand = '#b6922f';
  if (kind === 'associate') { suit = '#1d1d1d'; tie = '#c9a227'; hatBand = '#8d6f1f'; }
  if (kind === 'capo') { suit = '#2a2a2a'; tie = '#cccccc'; hatBand = '#b0b0b0'; }
  if (kind === 'boss') { suit = '#0d0d0d'; tie = '#9f2222'; hatBand = '#9f2222'; }
  if (kind === 'npc') { suit = '#2a3a4a'; tie = '#5588aa'; hatBand = '#5588aa'; }

  const bx = Math.round(px), by = Math.round(py);
  const b = bob;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(bx + 8, by + 25, 16, 4);

  // Legs
  ctx.fillStyle = suit;
  ctx.fillRect(bx + 11 - step, by + 20 + b, 4, 8);
  ctx.fillRect(bx + 17 + step, by + 20 + b, 4, 8);

  // Body
  ctx.fillRect(bx + 10, by + 12 + b, 12, 10);
  // Lapels
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(bx + 12, by + 13 + b, 2, 5);
  ctx.fillRect(bx + 18, by + 13 + b, 2, 5);
  // Shirt
  ctx.fillStyle = '#efefef';
  ctx.fillRect(bx + 14, by + 13 + b, 4, 7);
  // Tie
  ctx.fillStyle = tie;
  ctx.fillRect(bx + 15, by + 14 + b, 2, 6);
  // Arms
  ctx.fillStyle = suit;
  ctx.fillRect(bx + 8, by + 13 + b, 2, 8);
  ctx.fillRect(bx + 22, by + 13 + b, 2, 8);

  // Head
  ctx.fillStyle = '#efc28e';
  ctx.fillRect(bx + 11, by + 5 + b, 10, 8);
  // Eyes
  ctx.fillStyle = '#101010';
  if (facing === 'up') {
    // Show back of head
  } else {
    ctx.fillRect(bx + 13, by + 8 + b, 1, 1);
    ctx.fillRect(bx + 18, by + 8 + b, 1, 1);
  }

  // Hat
  ctx.fillStyle = '#090909';
  ctx.fillRect(bx + 9, by + 4 + b, 14, 2);
  ctx.fillRect(bx + 11, by + 0 + b, 10, 5);
  ctx.fillStyle = hatBand;
  ctx.fillRect(bx + 11, by + 3 + b, 10, 1);

  // Player highlight
  if (kind === 'player') {
    ctx.strokeStyle = '#f7e7b2';
    ctx.strokeRect(bx + 7, by + 2 + b, 18, 27);
  }
  // Boss marker
  if (boss) {
    ctx.strokeStyle = '#9f2222';
    ctx.strokeRect(bx + 9, by + 11 + b, 14, 12);
  }
}

function drawNurseSprite(px, py) {
  const bob = Math.round(Math.sin(tick / 9) * 1);
  const bx = Math.round(px), by = Math.round(py);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(bx + 8, by + 25, 16, 4);
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(bx + 10, by + 12 + bob, 12, 12);
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(bx + 12, by + 14 + bob, 8, 10);
  ctx.fillStyle = '#efc28e';
  ctx.fillRect(bx + 8, by + 14 + bob, 2, 7);
  ctx.fillRect(bx + 22, by + 14 + bob, 2, 7);
  ctx.fillStyle = '#efc28e';
  ctx.fillRect(bx + 11, by + 5 + bob, 10, 8);
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(bx + 10, by + 4 + bob, 12, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 11, by + 1 + bob, 10, 4);
  ctx.fillStyle = '#b22222';
  ctx.fillRect(bx + 15, by + 1 + bob, 2, 4);
  ctx.fillRect(bx + 14, by + 2 + bob, 4, 2);
}

// ===== BUILDING MARKER ON OVERWORLD =====

function drawBuildingOwnerMarker(px, py, building) {
  if (building.owner === 'Matt') {
    // Green owned flag
    ctx.fillStyle = '#2f8a58';
    ctx.fillRect(px + 24, py + 2, 6, 8);
    ctx.fillStyle = '#1c5b38';
    ctx.fillRect(px + 24, py + 2, 2, 12);
  } else if (!building.cleared) {
    // Red hostile dot
    ctx.fillStyle = '#8f1d1d';
    ctx.beginPath();
    ctx.arc(px + 27, py + 7, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (building.donSite) {
    ctx.fillStyle = '#f7e7b2';
    ctx.font = '7px monospace';
    ctx.fillText('DON', px + 2, py + 30);
  }
}
