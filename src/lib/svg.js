import { fmt } from './utils.js';
import { DOOR, effectiveLeaves } from './doors.js';

/** Skala dopasowująca zawartość do boxa (wymiary logiczne w cm → px SVG). */
function fitScale(logW, logH, maxW, maxH) {
  return Math.min(maxW / Math.max(logW, 1), maxH / Math.max(logH, 1));
}

function drawerFrontsSvg(x, y, w, h, count) {
  const n = Math.max(1, Math.min(5, count || 3));
  let s = '';
  for (let k = 0; k < n; k++) {
    const fh = (h - 4) / n;
    const fy = y + 2 + k * fh;
    s += `<rect x="${x + 2}" y="${fy}" width="${Math.max(w - 4, 1)}" height="${Math.max(fh - 1, 2)}" fill="none" stroke="#FF7A45" stroke-width="1" stroke-dasharray="4 3"/>`;
    if (w > 22) {
      s += `<line x1="${x + w - 10}" y1="${fy + fh / 2}" x2="${x + w - 4}" y2="${fy + fh / 2}" stroke="#FF7A45" stroke-width="1.2"/>`;
    }
  }
  return s;
}

export function renderLinearSVG(data, cfg) {
  const { W, H, D, N, shelvesPer, t, uprights, sectionOpening, panelMode, panelHeight } = data;
  const door = cfg.door;
  const type = cfg.type;

  const padL = 70, padR = 40, padT = 36, padB = 28;
  const depthSection = 92;
  const maxW = 520, maxH = 280;
  const totalH = panelMode ? panelHeight : H;
  const scale = fitScale(W, totalH, maxW - padL - padR, maxH - padT - padB - depthSection);
  const drawW = W * scale;
  const cabH = H * scale;
  const totalDrawH = totalH * scale;
  const originX = padL, originY = padT;
  const svgW = drawW + padL + padR;
  const svgH = totalDrawH + padT + padB + depthSection;

  let s = `<svg width="100%" height="100%" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>Rysunek poglądowy mebla</title>`;

  if (panelMode) {
    s += `<rect x="${originX}" y="${originY}" width="${drawW}" height="${totalDrawH}" fill="none" stroke="#5F86A3" stroke-width="1" stroke-dasharray="3 3"/>`;
    const freeY = originY + cabH;
    const freeH = totalDrawH - cabH;
    if (freeH > 10) {
      s += `<text x="${originX + drawW / 2}" y="${freeY + freeH / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="11" fill="#5F86A3">wolna płyta</text>`;
    }
  }

  s += `<rect x="${originX}" y="${originY}" width="${drawW}" height="${cabH}" fill="none" stroke="#3E6E8E" stroke-width="1.5"/>`;

  if (data.topConstruction === 'countertop') {
    const cargoPx = Math.min((data.cargoDepth || 8) * scale, cabH * 0.4);
    if (data.frontCargo !== false) {
      s += `<rect x="${originX + 3}" y="${originY + 3}" width="${drawW - 6}" height="${cargoPx}" fill="rgba(95,134,163,0.22)" stroke="#5F86A3" stroke-width="1" stroke-dasharray="4 3"/>`;
      if (drawW > 50) {
        s += `<text x="${originX + drawW / 2}" y="${originY + cargoPx / 2 + 3}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="9" fill="#5F86A3">carga pod blat</text>`;
      }
    }
    if (data.rearReinforcement) {
      s += `<line x1="${originX}" y1="${originY + 5}" x2="${originX + drawW}" y2="${originY + 5}" stroke="#5F86A3" stroke-width="2" stroke-dasharray="6 3"/>`;
      s += `<text x="${originX + 4}" y="${originY + 14}" font-family="Inter" font-size="9" fill="#5F86A3">wzmocnienie tylne</text>`;
    }
  }

  const tPx = Math.max(t * scale, 1.5);
  for (let i = 0; i < uprights; i++) {
    const x = originX + i * (sectionOpening + t) * scale;
    s += `<rect x="${x}" y="${originY}" width="${tPx}" height="${cabH}" fill="#3E6E8E" opacity="0.55"/>`;
  }

  if (shelvesPer > 0) {
    for (let sec = 0; sec < N; sec++) {
      const secX = originX + sec * (sectionOpening + t) * scale + tPx;
      const secW = sectionOpening * scale;
      for (let k = 1; k <= shelvesPer; k++) {
        const y = originY + (cabH * k) / (shelvesPer + 1);
        s += `<line x1="${secX}" y1="${y}" x2="${secX + secW}" y2="${y}" stroke="#3E6E8E" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>`;
      }
    }
  }

  if (door === 'szuflady' || data.doorType === 'szuflady') {
    const dCount = data.drawerCount || cfg.drawerCount || 3;
    for (let sec = 0; sec < N; sec++) {
      const secX = originX + sec * (sectionOpening + t) * scale;
      const secW = (sectionOpening + t) * scale;
      s += drawerFrontsSvg(secX, originY, secW, cabH, dCount);
    }
  } else if (door !== 'brak' && type !== 'regal') {
    const doorLeaves = effectiveLeaves(door, cfg.leaves);
    for (let sec = 0; sec < N; sec++) {
      const secX = originX + sec * (sectionOpening + t) * scale;
      const secW = (sectionOpening + t) * scale;
      if (doorLeaves === 2) {
        s += `<line x1="${secX + secW / 2}" y1="${originY}" x2="${secX + secW / 2}" y2="${originY + cabH}" stroke="#FF7A45" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      }
      s += `<rect x="${secX + 2}" y="${originY + 2}" width="${secW - 4}" height="${cabH - 4}" fill="none" stroke="#FF7A45" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    }
    if (door === 'gora') {
      s += `<text x="${originX + drawW / 2}" y="${originY + cabH + 16}" text-anchor="middle" font-family="Inter" font-size="11" fill="#9FB8CC">↑ front uchylny do góry</text>`;
    } else if (door === 'przesuwne') {
      s += `<text x="${originX + drawW / 2}" y="${originY + cabH + 16}" text-anchor="middle" font-family="Inter" font-size="11" fill="#9FB8CC">↔ drzwi przesuwne (nakładka ${fmt(DOOR.slideOverlap * 10)} mm)</text>`;
    }
  }

  const dimY = originY - 14;
  s += `<line x1="${originX}" y1="${dimY}" x2="${originX + drawW}" y2="${dimY}" stroke="#7FDBFF" stroke-width="1"/>`;
  s += `<text x="${originX + drawW / 2}" y="${dimY - 6}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF">${fmt(W)} cm</text>`;

  const dimX = originX - 16;
  s += `<line x1="${dimX}" y1="${originY}" x2="${dimX}" y2="${originY + cabH}" stroke="#7FDBFF" stroke-width="1"/>`;
  s += `<text x="${dimX - 8}" y="${originY + cabH / 2}" text-anchor="end" dominant-baseline="central" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF">${fmt(H)} cm</text>`;

  if (panelMode) {
    const dimX2 = originX - 40;
    s += `<line x1="${dimX2}" y1="${originY}" x2="${dimX2}" y2="${originY + totalDrawH}" stroke="#5F86A3" stroke-width="1"/>`;
    s += `<text x="${dimX2 - 8}" y="${originY + totalDrawH / 2}" text-anchor="end" dominant-baseline="central" font-family="JetBrains Mono" font-size="11" fill="#5F86A3">${fmt(panelHeight)} cm</text>`;
  }

  const sideY = originY + totalDrawH + 36;
  const sideScale = Math.min((drawW * 0.45) / Math.max(D, 1), scale * 1.2);
  const sideW = Math.min(D * sideScale, drawW);
  const sideH = 18;
  s += `<text x="${originX}" y="${sideY - 8}" font-family="Inter" font-size="11" fill="#9FB8CC">Widok z góry (głębokość)</text>`;
  s += `<rect x="${originX}" y="${sideY}" width="${sideW}" height="${sideH}" fill="none" stroke="#3E6E8E" stroke-width="1.5"/>`;
  s += `<text x="${originX + sideW / 2}" y="${sideY + sideH + 24}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF">${fmt(D)} cm</text>`;
  s += `</svg>`;
  return s;
}

/**
 * Rzut z góry — model ścienny:
 * ściany L, 2 plecy, kątownik-łącznik, 2 boki końcowe, drzwi w świetle między bokiem a kątownikiem.
 */
export function renderCornerSVG(data, cfg) {
  const { armA, armB, D, H, t, backT, tK = t, openingA, openingB } = data;
  const padL = 90, padR = 50, padT = 52, padB = 72;
  const maxW = 500, maxH = 300;
  const logW = Math.max(armA, D + 5);
  const logH = Math.max(armB, D + 5);
  const scale = fitScale(logW, logH, maxW - padL - padR, maxH - padT - padB);

  const a = armA * scale;
  const b = armB * scale;
  const d = D * scale;
  const tPx = Math.max(t * scale, 3);
  const tKpx = Math.max((tK || t) * scale, 3);
  const backPx = Math.max((backT || 0.3) * scale, 2.5);

  const ox = padL;
  const oy = padT;
  const svgW = a + padL + padR;
  const svgH = b + padT + padB;

  let s = `<svg width="100%" height="100%" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" role="img">
  <title>Rzut z góry — szafka narożna (plecy + boki + kątownik)</title>
  <desc>Plecy A ${fmt(armA)} cm, plecy B ${fmt(armB)} cm, głębokość ${fmt(D)} cm, wysokość ${fmt(H)} cm.</desc>`;

  // Ściany pomieszczenia (zewnętrzne)
  s += `<line x1="${ox}" y1="${oy}" x2="${ox + a}" y2="${oy}" stroke="#5F86A3" stroke-width="4" stroke-linecap="square"/>`;
  s += `<line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy + b}" stroke="#5F86A3" stroke-width="4" stroke-linecap="square"/>`;
  s += `<text x="${ox + a / 2}" y="${oy - 22}" text-anchor="middle" font-family="Inter" font-size="11" fill="#9FB8CC">ściana A</text>`;
  s += `<text x="${ox - 18}" y="${oy + b / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="11" fill="#9FB8CC" transform="rotate(-90 ${ox - 18} ${oy + b / 2})">ściana B</text>`;

  // Zarys głębokości (lekki)
  s += `<path d="M ${ox} ${oy} L ${ox + a} ${oy} L ${ox + a} ${oy + d} L ${ox + d} ${oy + d} L ${ox + d} ${oy + b} L ${ox} ${oy + b} Z" fill="#3E6E8E" fill-opacity="0.08" stroke="none"/>`;

  // Plecy A (wzdłuż ściany A)
  s += `<rect x="${ox}" y="${oy}" width="${a}" height="${backPx}" fill="#7FDBFF" fill-opacity="0.55" stroke="#7FDBFF" stroke-width="1"/>`;
  s += `<text x="${ox + a / 2}" y="${oy + backPx / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="10" fill="#0F2436">plecy A ${fmt(armA)}</text>`;

  // Plecy B (wzdłuż ściany B)
  s += `<rect x="${ox}" y="${oy}" width="${backPx}" height="${b}" fill="#7FDBFF" fill-opacity="0.55" stroke="#7FDBFF" stroke-width="1"/>`;
  if (b > 40) {
    s += `<text x="${ox + backPx / 2}" y="${oy + b / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="10" fill="#0F2436" transform="rotate(-90 ${ox + backPx / 2} ${oy + b / 2})">plecy B ${fmt(armB)}</text>`;
  }

  // Kątownik łącznik w narożniku (wewnętrzny styk pleców) — mały, nie pełny słupek D×D
  const kx = ox + backPx;
  const ky = oy + backPx;
  s += `<rect x="${kx}" y="${ky}" width="${tKpx}" height="${tKpx}" fill="#FF7A45" fill-opacity="0.85" stroke="#FF7A45" stroke-width="1"/>`;
  s += `<text x="${kx + tKpx + 8}" y="${ky + tKpx + 14}" font-family="Inter" font-size="10" fill="#FF7A45">kątownik</text>`;

  // Bok końcowy A (wolny koniec ramienia A)
  const sideAx = ox + a - tPx;
  s += `<rect x="${sideAx}" y="${oy + backPx}" width="${tPx}" height="${d - backPx}" fill="#3E6E8E" fill-opacity="0.85" stroke="#3E6E8E" stroke-width="1"/>`;
  s += `<text x="${sideAx + tPx / 2}" y="${oy + d / 2 + 8}" text-anchor="middle" font-family="Inter" font-size="9" fill="#EAF3FB" transform="rotate(-90 ${sideAx + tPx / 2} ${oy + d / 2 + 8})">bok</text>`;

  // Bok końcowy B (wolny koniec ramienia B)
  const sideBy = oy + b - tPx;
  s += `<rect x="${ox + backPx}" y="${sideBy}" width="${d - backPx}" height="${tPx}" fill="#3E6E8E" fill-opacity="0.85" stroke="#3E6E8E" stroke-width="1"/>`;
  s += `<text x="${ox + d / 2 + 8}" y="${sideBy + tPx / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="9" fill="#EAF3FB">bok</text>`;

  // Drzwi narożnika:
  // 1 skrzydło → linia między bokiem A a bokiem B
  // 2 skrzydła → osobne fronty na ramionach
  if (cfg.door !== 'brak') {
    const doorAy = oy + d;
    const doorA0 = kx + tKpx;
    const doorA1 = sideAx;
    const doorBx = ox + d;
    const doorB0 = ky + tKpx;
    const doorB1 = sideBy;
    const mode = data.doorMode || (Number(cfg.leaves) === 1 ? 'between_sides' : 'per_arm');

    if (mode === 'between_sides') {
      // od wewnętrznego naroża boku A do wewnętrznego naroża boku B
      const x1 = sideAx;
      const y1 = doorAy;
      const x2 = doorBx;
      const y2 = sideBy;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FF7A45" stroke-width="3" stroke-dasharray="8 4"/>`;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const span = data.cornerSpan || Math.sqrt((openingA || 0) ** 2 + (openingB || 0) ** 2);
      s += `<text x="${mx + 10}" y="${my}" font-family="Inter" font-size="11" fill="#FF7A45">1 skrzydło między bokami · ${fmt(span)} cm</text>`;
    } else {
      s += `<line x1="${doorA0}" y1="${doorAy}" x2="${doorA1}" y2="${doorAy}" stroke="#FF7A45" stroke-width="2.5" stroke-dasharray="7 4"/>`;
      s += `<text x="${(doorA0 + doorA1) / 2}" y="${doorAy + 14}" text-anchor="middle" font-family="Inter" font-size="10" fill="#FF7A45">skrzydło A ${fmt(openingA ?? armA - t - tK)} cm</text>`;
      s += `<line x1="${doorBx}" y1="${doorB0}" x2="${doorBx}" y2="${doorB1}" stroke="#FF7A45" stroke-width="2.5" stroke-dasharray="7 4"/>`;
      s += `<text x="${doorBx + 12}" y="${(doorB0 + doorB1) / 2}" text-anchor="start" dominant-baseline="central" font-family="Inter" font-size="10" fill="#FF7A45">skrzydło B ${fmt(openingB ?? armB - t - tK)}</text>`;
    }
  }

  // Wymiar głębokości
  s += `<line x1="${ox + a + 18}" y1="${oy}" x2="${ox + a + 18}" y2="${oy + d}" stroke="#7FDBFF" stroke-width="1"/>`;
  s += `<text x="${ox + a + 28}" y="${oy + d / 2}" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF" dominant-baseline="central">gł. ${fmt(D)}</text>`;

  // Wymiary ramion
  s += `<line x1="${ox}" y1="${oy + b + 22}" x2="${ox + a}" y2="${oy + b + 22}" stroke="#7FDBFF" stroke-width="1"/>`;
  s += `<text x="${ox + a / 2}" y="${oy + b + 38}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF">plecy A: ${fmt(armA)} cm</text>`;

  s += `<line x1="${ox - 22}" y1="${oy}" x2="${ox - 22}" y2="${oy + b}" stroke="#7FDBFF" stroke-width="1"/>`;
  s += `<text x="${ox - 34}" y="${oy + b / 2}" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF" transform="rotate(-90 ${ox - 34} ${oy + b / 2})">plecy B: ${fmt(armB)} cm</text>`;

  s += `<text x="${ox + a / 2}" y="${oy - 36}" text-anchor="middle" font-family="Inter" font-size="11" fill="#9FB8CC">wysokość korpusu: ${fmt(H)} cm</text>`;

  s += `</svg>`;
  return s;
}

export function renderZabudowaSVG(data) {
  const mods = data.modules || [];
  const availW = data.W || 1;
  const H = data.H || 45;
  const padL = 40, padR = 20, padT = 28, padB = 28;
  const labelExtra = 12;
  const maxW = 500, maxH = 228;
  const maxModuleH = mods.reduce((mx, m) => {
    const h = m.panelMode ? Math.max(m.panelHeight || H, H) : H;
    return Math.max(mx, h);
  }, H);
  const innerW = maxW - padL - padR;
  const innerH = maxH - padT - padB - labelExtra;
  const scale = fitScale(availW, maxModuleH, innerW, innerH);
  const wallW = availW * scale;
  const cabH = H * scale;
  const drawH = maxModuleH * scale;
  const ox = padL, oy = padT;
  const svgW = wallW + padL + padR;
  const svgH = drawH + padT + padB + labelExtra;

  const kindLabel = {
    wiszaca: 'wisz.',
    stojaca: 'stoj.',
    regal: 'regał',
    gora: '↑ góra',
    przesuwne: '↔ przes.',
    panel: 'płyta',
    naroznik: 'naroż.',
    szuflady: 'szufl.'
  };

  let s = `<svg width="100%" height="100%" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" role="img"><title>Zabudowa</title>`;
  // ściana / dostępna szerokość
  s += `<line x1="${ox}" y1="${oy - 8}" x2="${ox + wallW}" y2="${oy - 8}" stroke="#5F86A3" stroke-width="3"/>`;
  s += `<text x="${ox + wallW / 2}" y="${oy - 14}" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#7FDBFF">${fmt(availW)} cm dostępne</text>`;

  let x = ox;
  mods.forEach((m, i) => {
    const w = (m.displayW || m.W || 60) * scale;
    const isCorner = !!m.isCorner;
    const fill = isCorner ? 'rgba(255,122,69,0.18)' : 'rgba(62,110,142,0.25)';
    const stroke = isCorner ? '#FF7A45' : '#3E6E8E';
    const modH = m.panelMode ? Math.max((m.panelHeight || H) * scale, cabH) : cabH;
    s += `<rect x="${x}" y="${oy}" width="${Math.max(w, 2)}" height="${cabH}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    if (m.panelMode && modH > cabH + 1) {
      s += `<rect x="${x}" y="${oy}" width="${Math.max(w, 2)}" height="${modH}" fill="none" stroke="#5F86A3" stroke-width="1" stroke-dasharray="3 3"/>`;
      const freeH = modH - cabH;
      if (freeH > 12 && w > 20) {
        s += `<text x="${x + w / 2}" y="${oy + cabH + freeH / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="9" fill="#5F86A3">wolna płyta</text>`;
      }
    }
    if ((m.shelves || 0) > 0 && !isCorner && m.kind !== 'szuflady' && m.doorType !== 'szuflady') {
      for (let k = 1; k <= m.shelves; k++) {
        const yy = oy + (cabH * k) / (m.shelves + 1);
        s += `<line x1="${x + 3}" y1="${yy}" x2="${x + w - 3}" y2="${yy}" stroke="#3E6E8E" stroke-width="1" stroke-dasharray="3 2" opacity="0.7"/>`;
      }
    }
    const isDrawers = m.kind === 'szuflady' || m.doorType === 'szuflady';
    if (isDrawers) {
      s += drawerFrontsSvg(x, oy, w, cabH, m.drawerCount || data.drawerCount || 3);
    } else if (m.doorType && m.doorType !== 'brak' && m.kind !== 'regal') {
      s += `<rect x="${x + 3}" y="${oy + 3}" width="${Math.max(w - 6, 1)}" height="${cabH - 6}" fill="none" stroke="#FF7A45" stroke-width="1" stroke-dasharray="5 3"/>`;
    }
    const label = kindLabel[m.kind] || m.kind;
    if (w > 22) {
      s += `<text x="${x + w / 2}" y="${oy + cabH / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="${w > 36 ? 10 : 8}" fill="#EAF3FB">${i + 1}. ${label}</text>`;
    }
    if (w > 36) {
      const sub = isDrawers
        ? `${fmt(m.displayW || m.W)} · ${m.drawerCount || 3}sz`
        : `${fmt(m.displayW || m.W)} · ${m.shelves || 0}p`;
      s += `<text x="${x + w / 2}" y="${oy + Math.min(modH, drawH) + 10}" text-anchor="middle" font-family="JetBrains Mono" font-size="8" fill="#7FDBFF">${sub}</text>`;
    }
    x += w;
  });

  if (data.remainingW > 0.5) {
    const rw = data.remainingW * scale;
    s += `<rect x="${x}" y="${oy}" width="${rw}" height="${drawH}" fill="none" stroke="#5F86A3" stroke-width="1" stroke-dasharray="4 3"/>`;
    if (rw > 40) {
      s += `<text x="${x + rw / 2}" y="${oy + drawH / 2}" text-anchor="middle" dominant-baseline="central" font-family="Inter" font-size="10" fill="#5F86A3">wolne ${fmt(data.remainingW)}</text>`;
    }
  }

  s += `</svg>`;
  return s;
}

export function buildPreviewSvg(data, cfg) {
  if (!data) return { svg: '', legend: [] };

  if (data.isZabudowa) {
    if (data.empty || !(data.modules && data.modules.length)) {
      return {
        svg: `<svg width="100%" viewBox="0 0 400 80"><text x="12" y="40" font-family="Inter" font-size="13" fill="#5F86A3">Dodaj szafki z palety — wybierz typy na powierzchni.</text></svg>`,
        legend: [{ color: '#FF7A45', label: 'Dodaj moduły z palety' }]
      };
    }
    // jeden narożnik bez rzędu → klasyczny rzut L
    if (data.modules.length === 1 && data.modules[0].isCorner) {
      return {
        svg: renderCornerSVG(data.modules[0], {
          door: data.modules[0].doorType,
          leaves: data.modules[0].leaves
        }),
        legend: [
          { color: '#7FDBFF', label: 'Plecy' },
          { color: '#3E6E8E', label: 'Boki' },
          { color: '#FF7A45', label: 'Drzwi / kątownik' }
        ]
      };
    }
    return {
      svg: renderZabudowaSVG(data),
      legend: [
        { color: '#3E6E8E', label: 'Szafka liniowa' },
        { color: '#FF7A45', label: 'Front / szuflady' },
        { color: '#5F86A3', label: 'Wolne miejsce' }
      ]
    };
  }

  if (data.isCorner) {
    return {
      svg: renderCornerSVG(data, cfg),
      legend: [
        { color: '#7FDBFF', label: 'Plecy (wzdłuż ścian)' },
        { color: '#3E6E8E', label: 'Boki końcowe' },
        { color: '#FF7A45', label: 'Kątownik + drzwi' }
      ]
    };
  }
  return {
    svg: renderLinearSVG(data, cfg),
    legend: [
      { color: '#3E6E8E', label: 'Korpus (boki / wieńce)' },
      { color: '#FF7A45', label: 'Front / drzwi' },
      { color: '#7FDBFF', label: 'Wymiar' },
      ...(data.topConstruction === 'countertop' ? [{ color: '#5F86A3', label: 'Carga / wzmocnienie pod blat' }] : []),
      ...(data.doorType === 'szuflady' ? [{ color: '#FF7A45', label: 'Fronty szuflad' }] : [])
    ]
  };
}
