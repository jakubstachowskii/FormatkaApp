import { makePartsMap } from './utils.js';
import { addDoorFronts, addCornerDoors, effectiveLeaves } from './doors.js';
import { addDrawerParts } from './drawers.js';
/**
 * Wieńce górne/dolne lub układ pod blat kuchenny (bez WG, cargi + opcjonalne wzmocnienie tylne).
 * @see https://formatec.pl — korpus szafki dolnej: wieniec dolny + carga zamiast wieńca górnego
 */
function addHorizontalRails(pm, {
  openingW, depthD, thickMm, qty,
  topConstruction = 'standard',
  frontCargo = true,
  rearReinforcement = false,
  cargoDepth = 8,
  namePrefix = ''
}) {
  const p = (label) => `${namePrefix}${label}`;
  pm.addPart(p('Wieniec dolny'), openingW, depthD, thickMm, qty);

  if (topConstruction === 'countertop') {
    const cd = Math.min(Math.max(Number(cargoDepth) || 8, 4), Math.max(depthD - 1, 4));
    if (frontCargo) {
      pm.addPart(p('Carga montażowa (przód)'), openingW, cd, thickMm, qty);
    }
    if (rearReinforcement) {
      pm.addPart(p('Wzmocnienie tylne (carga)'), openingW, cd, thickMm, qty);
    }
  } else {
    pm.addPart(p('Wieniec górny'), openingW, depthD, thickMm, qty);
  }
}

export function buildLinearParts({
  W, H, D, N, t, backT, shelvesPer, doorType, leaves, skipBack, panelMode, panelHeight, panelThick,
  topConstruction = 'standard', frontCargo = true, rearReinforcement = false, cargoDepth = 8,
  drawerCount = 3, drawerStyle = 'srednia'
}) {
  const pm = makePartsMap();
  const uprights = N + 1;
  const sectionOpening = (W - uprights * t) / N;

  pm.addPart('Bok / przegroda pionowa', D, H, t * 10, uprights);
  addHorizontalRails(pm, {
    openingW: sectionOpening,
    depthD: D,
    thickMm: t * 10,
    qty: N,
    topConstruction,
    frontCargo,
    rearReinforcement,
    cargoDepth
  });

  if (shelvesPer > 0) {
    pm.addPart('Półka', Math.max(sectionOpening - 0.2, 0.1), Math.max(D - 0.1, 0.1), t * 10, shelvesPer * N);
  }

  if (panelMode) {
    pm.addPart('Płyta montażowa (pełna wysokość)', W, panelHeight, panelThick * 10, 1);
  } else if (!skipBack) {
    pm.addPart('Plecy (HDF)', W, H, backT * 10, 1);
  }

  let drawerInfo = null;
  if (doorType === 'szuflady' && !skipBack) {
    drawerInfo = addDrawerParts(pm, {
      opening: sectionOpening, H, D, t, qtySections: N,
      drawerCount, drawerStyle, frontThickMm: t * 10
    });
  } else if (doorType !== 'brak' && !skipBack) {
    addDoorFronts(pm, {
      doorType, leaves, opening: sectionOpening, H, t, qtySections: N, nameBase: 'Front / drzwi'
    });
  }

  return {
    isCorner: false, W, H, D, N, shelvesPer, t, backT, sectionOpening, uprights,
    panelMode, panelHeight, panelThick, doorType,
    topConstruction, frontCargo, rearReinforcement, cargoDepth,
    drawerCount: drawerInfo?.drawerCount ?? 0,
    drawerStyle: doorType === 'szuflady' ? drawerStyle : null,
    nominalRunnerLength: drawerInfo?.nominalLength ?? null,
    leaves: effectiveLeaves(doorType, leaves), parts: pm.get()
  };
}

/**
 * Narożnik „zabudowa ścienna”:
 * 2 boki końcowe + 2 plecy + kątownik-łącznik.
 */
export function buildCornerParts({
  armA, armB, H, D, t, backT, shelvesPer, doorType, leaves,
  topConstruction = 'standard', frontCargo = true, rearReinforcement = false, cargoDepth = 8
}) {
  const pm = makePartsMap();
  const tK = t;
  const shelfD = Math.max(D - backT - 0.1, 0.1);

  const openingA = Math.max(armA - t - tK, 0.1);
  const openingB = Math.max(armB - t - tK, 0.1);

  pm.addPart('Bok końcowy', D, H, t * 10, 2);
  pm.addPart('Kątownik łącznik (pion)', tK, H, t * 10, 1);

  addHorizontalRails(pm, { openingW: openingA, depthD: shelfD, thickMm: t * 10, qty: 1, topConstruction, frontCargo, rearReinforcement, cargoDepth, namePrefix: 'Ramię A — ' });
  addHorizontalRails(pm, { openingW: openingB, depthD: shelfD, thickMm: t * 10, qty: 1, topConstruction, frontCargo, rearReinforcement, cargoDepth, namePrefix: 'Ramię B — ' });

  if (shelvesPer > 0) {
    pm.addPart('Półka ramię A', Math.max(openingA - 0.2, 0.1), Math.max(shelfD - 0.1, 0.1), t * 10, shelvesPer);
    pm.addPart('Półka ramię B', Math.max(openingB - 0.2, 0.1), Math.max(shelfD - 0.1, 0.1), t * 10, shelvesPer);
  }

  pm.addPart('Plecy ramię A (MDF/HDF)', armA, H, backT * 10, 1);
  pm.addPart('Plecy ramię B (MDF/HDF)', armB, H, backT * 10, 1);

  const doorInfo = addCornerDoors(pm, { doorType, leaves, openingA, openingB, H, t });

  return {
    isCorner: true,
    cornerModel: 'sciana_katownik',
    armA, armB, H, D, t, backT, tK, openingA, openingB, shelvesPer, shelfD,
    topConstruction, frontCargo, rearReinforcement, cargoDepth,
    doorMode: doorInfo.mode,
    cornerSpan: doorInfo.span || 0,
    doorType,
    leaves: doorType === 'brak' ? 0 : Math.min(2, Math.max(1, Number(leaves) || 1)),
    parts: pm.get()
  };
}
