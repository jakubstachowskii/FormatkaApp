/** Optymalna liczba półek wewnętrznych na podstawie wysokości korpusu (cm). */
export function optimalShelves(H, { minGap = 28, maxShelves = 6 } = {}) {
  const h = Number(H) || 0;
  if (h < 40) return 0;
  const n = Math.floor(h / minGap) - 1;
  return Math.max(0, Math.min(maxShelves, n));
}

export const MODULE_KINDS = [
  { id: 'wiszaca', label: 'Wisząca', door: 'uchylne', leaves: 1, panel: 0, defaultW: 60 },
  { id: 'stojaca', label: 'Stojąca', door: 'uchylne', leaves: 1, panel: 0, defaultW: 60 },
  { id: 'regal', label: 'Regał otw.', door: 'brak', leaves: 1, panel: 0, defaultW: 60 },
  { id: 'gora', label: 'Uchylna do góry', door: 'gora', leaves: 1, panel: 0, defaultW: 60 },
  { id: 'szuflady', label: 'Szuflady', door: 'szuflady', leaves: 1, panel: 0, defaultW: 60, drawerCount: 3 },
  { id: 'przesuwne', label: 'Przesuwne', door: 'przesuwne', leaves: 2, panel: 0, defaultW: 80 },
  { id: 'panel', label: 'Na wysokiej płycie', door: 'uchylne', leaves: 1, panel: 1, defaultW: 60 },
  { id: 'naroznik', label: 'Narożna', door: 'uchylne', leaves: 1, panel: 0, defaultW: 70 }
];

let _modSeq = 1;
export function nextModuleId() {
  return `m${Date.now().toString(36)}_${_modSeq++}`;
}

export function moduleSpan(m) {
  if (!m) return 0;
  if (m.kind === 'naroznik') return Number(m.armA || m.width || 0);
  return Number(m.width || 0);
}

export function createModule(kindId, defaults = {}) {
  const kind = MODULE_KINDS.find((k) => k.id === kindId) || MODULE_KINDS[0];
  const H = Number(defaults.h) || 45;
  const D = Number(defaults.d) || 30;
  const preferW = Number(defaults.width);
  const width = preferW > 0 ? preferW : kind.defaultW;
  return {
    id: nextModuleId(),
    kind: kind.id,
    door: kind.door,
    leaves: kind.leaves,
    panel: kind.panel,
    width,
    shelves: optimalShelves(H),
    shelvesAuto: true,
    widthLocked: false,
    panelHeight: Math.max(H + 40, Number(defaults.panelHeight) || 120),
    panelThick: Number(defaults.panelThick) || 18,
    armA: Math.max(width, D + 20),
    armB: Math.max(width, D + 20),
    drawerCount: kind.drawerCount || 3,
    drawerStyle: 'srednia'
  };
}

export function occupiedWidth(modules) {
  return (modules || []).reduce((s, m) => s + moduleSpan(m), 0);
}

export function remainingWidth(availW, modules) {
  return Math.max(0, Number(availW || 0) - occupiedWidth(modules));
}

/**
 * Rozkłada dostępną szerokość na sloty.
 * Zablokowane (widthLocked) i narożniki (armA) zostają;
 * reszta dostaje równy udział (min 30 cm).
 */
export function redistributeWidths(modules, availW) {
  const list = (modules || []).map((m) => ({ ...m }));
  const avail = Number(availW) || 0;
  if (!list.length || avail <= 0) return list;

  const flexible = list.filter((m) => m.kind !== 'naroznik' && !m.widthLocked);
  const fixedSum = list.reduce((s, m) => {
    if (m.kind === 'naroznik' || m.widthLocked) return s + moduleSpan(m);
    return s;
  }, 0);
  const pool = Math.max(0, avail - fixedSum);
  if (!flexible.length) return list;

  const raw = pool / flexible.length;
  const wEach = Math.max(30, Math.round(raw * 10) / 10);
  let usedFlex = 0;
  flexible.forEach((m, i) => {
    if (i === flexible.length - 1) {
      m.width = Math.max(30, Math.round((pool - usedFlex) * 10) / 10);
    } else {
      m.width = wEach;
      usedFlex += wEach;
    }
  });
  return list;
}

/** Dodaje slot; nowy bierze wolną szerokość (min 30). Przy przepełnieniu — redystrybucja. */
export function addModuleToList(modules, kindId, defaults = {}) {
  const availW = Number(defaults.availW) || 0;
  const current = modules || [];
  const rem = remainingWidth(availW, current);
  const kind = MODULE_KINDS.find((k) => k.id === kindId) || MODULE_KINDS[0];
  const width = rem >= 30
    ? Math.round(rem * 10) / 10
    : (kind.defaultW || 60);
  const mod = createModule(kindId, { ...defaults, width });
  const next = [...current, mod];
  if (availW > 0 && remainingWidth(availW, next) < 0) {
    return redistributeWidths(next, availW);
  }
  return next;
}

export function applyKindToModule(mod, kindId, H) {
  const kind = MODULE_KINDS.find((k) => k.id === kindId) || MODULE_KINDS[0];
  const next = {
    ...mod,
    kind: kind.id,
    door: kind.door,
    leaves: kind.leaves,
    panel: kind.panel
  };
  if (mod.shelvesAuto) next.shelves = optimalShelves(H);
  if (kindId === 'naroznik') {
    next.armA = mod.armA || mod.width || kind.defaultW;
    next.armB = mod.armB || mod.width || kind.defaultW;
  }
  if (kindId === 'szuflady') {
    next.door = 'szuflady';
    next.shelves = 0;
    next.shelvesAuto = false;
    next.drawerCount = mod.drawerCount || kind.drawerCount || 3;
    next.drawerStyle = mod.drawerStyle || 'srednia';
  }
  return next;
}

export function mergePartsLists(lists) {
  const map = {};
  lists.flat().forEach((p) => {
    const key = `${p.name}|${p.w.toFixed(1)}|${p.h.toFixed(1)}|${p.thickMm}`;
    if (!map[key]) map[key] = { ...p, qty: 0 };
    map[key].qty += p.qty;
  });
  return Object.values(map);
}
