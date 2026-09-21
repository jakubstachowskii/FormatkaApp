/**
 * Szuflady — wymiary wg praktyki stolarskiej (systemy box, płyta 18 mm).
 * LW = światło wewnętrzne; NL = długość nominalna prowadnicy ≈ głębokość korpusu − 3 cm.
 * @see robertlatka.pl — formatek dna: LW−75 mm, tyłu: LW−87 mm, dna gł.: NL−24 mm
 */

export const DRAWER = {
  bottomWidthMinus: 7.5,
  backWidthMinus: 8.7,
  bottomDepthMinus: 2.4,
  cabinetDepthMinus: 3,
  frontGap: 0.2,
  bottomThickMm: 16,
  sideThickMm: 16,
  backHeights: { niska: 6.9, srednia: 8.4, wysoka: 11.6 }
};

const RUNNER_STANDARDS_CM = [25, 30, 35, 40, 45, 50, 55, 60];

/** Najbliższa standardowa długość prowadnicy (cm) mieszcząca się w głębokości korpusu. */
export function nominalRunnerLength(D_cm) {
  const raw = Math.max(Number(D_cm) - DRAWER.cabinetDepthMinus, 25);
  let best = RUNNER_STANDARDS_CM[0];
  for (const s of RUNNER_STANDARDS_CM) {
    if (s <= raw + 0.01) best = s;
    else break;
  }
  return best;
}

/** Wysokości frontów szuflad z luzem 2 mm (góra, między, dół). */
export function drawerFrontHeights(totalH_cm, count) {
  const n = Math.max(1, count);
  const gaps = DRAWER.frontGap * (n + 1);
  const each = (totalH_cm - gaps) / n;
  return Array.from({ length: n }, () => Math.max(each, 0.1));
}

/**
 * Dodaje elementy skrzynek szuflad + fronty do listy rozkroju.
 * @returns {{ drawerCount, nominalLength, backH }}
 */
export function addDrawerParts(pm, {
  opening, H, D, t, qtySections = 1,
  drawerCount = 3, drawerStyle = 'srednia',
  frontThickMm = 18
}) {
  const NL = nominalRunnerLength(D);
  const LW = opening;
  const backH = DRAWER.backHeights[drawerStyle] || DRAWER.backHeights.srednia;
  const bottomW = Math.max(LW - DRAWER.bottomWidthMinus, 0.1);
  const bottomD = Math.max(NL - DRAWER.bottomDepthMinus, 0.1);
  const backW = Math.max(LW - DRAWER.backWidthMinus, 0.1);
  const count = Math.max(1, Math.min(5, Number(drawerCount) || 3));
  const fronts = drawerFrontHeights(H, count);

  for (let s = 0; s < qtySections; s++) {
    const secLabel = qtySections > 1 ? ` · s${s + 1}` : '';
    for (let i = 0; i < count; i++) {
      const n = i + 1;
      pm.addPart(`Szuflada ${n}${secLabel} — dno`, bottomW, bottomD, DRAWER.bottomThickMm, 1);
      pm.addPart(`Szuflada ${n}${secLabel} — tył`, backW, backH, frontThickMm, 1);
      pm.addPart(`Szuflada ${n}${secLabel} — bok`, bottomD, backH, DRAWER.sideThickMm, 2);
      pm.addPart(`Szuflada ${n}${secLabel} — front`, opening + t, fronts[i], frontThickMm, 1);
    }
  }

  return { drawerCount: count, nominalLength: NL, backH };
}
