export const DOOR = {
  hingeGap: 0.3,
  slideOverlap: 2.5,
  slideClearance: 0.5
};

export function effectiveLeaves(doorType, leaves) {
  if (doorType === 'szuflady' || doorType === 'brak') return 0;
  return doorType === 'przesuwne' ? 2 : leaves;
}

export function addDoorFronts(pm, { doorType, leaves, opening, H, t, qtySections, nameBase }) {
  if (doorType === 'brak') return;
  const L = effectiveLeaves(doorType, leaves);
  if (doorType === 'przesuwne') {
    const leafW = (opening + DOOR.slideOverlap) / 2;
    const doorH = Math.max(H - DOOR.slideClearance, 0.1);
    pm.addPart(nameBase + ' przesuwny (skrzydło)', leafW, doorH, t * 10, qtySections * 2);
    return;
  }
  if (L === 1) {
    pm.addPart(nameBase, opening + t, H, t * 10, qtySections);
  } else {
    const leafW = (opening + t - DOOR.hingeGap) / 2;
    pm.addPart(nameBase + ' (skrzydło)', leafW, H, t * 10, qtySections * 2);
  }
}

/**
 * Drzwi narożnika:
 * - 1 skrzydło → jedna płyta między bokiem A a bokiem B (przekątna światła)
 * - 2 skrzydła → osobne drzwi na ramieniu A i na ramieniu B
 */
export function addCornerDoors(pm, { doorType, leaves, openingA, openingB, H, t }) {
  if (doorType === 'brak') return { mode: 'none', span: 0 };

  const L = Math.min(2, Math.max(1, Number(leaves) || 1));
  const doorH = doorType === 'przesuwne' ? Math.max(H - DOOR.slideClearance, 0.1) : H;

  if (L === 1) {
    const span = Math.sqrt(openingA * openingA + openingB * openingB);
    const w = doorType === 'przesuwne' ? span : span + t;
    const name = doorType === 'przesuwne'
      ? 'Front narożny przesuwny (między bokami A–B)'
      : 'Front narożny (między bokami A–B)';
    pm.addPart(name, w, doorH, t * 10, 1);
    return { mode: 'between_sides', span, leaves: 1 };
  }

  // 2 skrzydła — po jednym na każde ramię
  if (doorType === 'przesuwne') {
    pm.addPart('Front ramię A przesuwny', openingA + DOOR.slideOverlap / 2, doorH, t * 10, 1);
    pm.addPart('Front ramię B przesuwny', openingB + DOOR.slideOverlap / 2, doorH, t * 10, 1);
  } else {
    pm.addPart('Front ramię A', openingA + t, H, t * 10, 1);
    pm.addPart('Front ramię B', openingB + t, H, t * 10, 1);
  }
  return { mode: 'per_arm', span: 0, leaves: 2 };
}
