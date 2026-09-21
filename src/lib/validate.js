import { fmt } from './utils.js';

export function collectSanityWarnings(data, cfg) {
  if (!data) return [];
  const w = [];
  const t = data.t;
  const H = data.H;
  const D = data.D;
  const shelvesPer = data.shelvesPer || 0;
  const door = cfg?.door;

  if (data.isZabudowa && data.remainingW < -0.5) {
    w.push('Szafki wystają poza dostępną szerokość — zmniejsz szerokości modułów.');
  }
  if (data.isZabudowa && data.moduleCount === 0) {
    return w;
  }

  if (D < 15) w.push('Głębokość poniżej 15 cm — konstrukcja może być niestabilna / trudna w użytkowaniu.');
  if (H < 20) w.push('Wysokość poniżej 20 cm — sprawdź, czy to zamierzony wymiar.');

  if (!data.isCorner && !data.isZabudowa && data.sectionOpening != null) {
    if (data.sectionOpening < 15) w.push('Światło sekcji poniżej 15 cm — fronty i półki będą praktycznie bezużyteczne.');
    if (data.sectionOpening < 2 * t + 5) w.push('Sekcja zbyt wąska względem grubości płyty — zweryfikuj liczbę sekcji / szerokość.');
    if (door === 'przesuwne' && data.sectionOpening < 40) {
      w.push('Dla drzwi przesuwnych zalecane światło sekcji ≥ 40 cm (2 skrzydła + nakładka).');
    }
  }

  if (data.isCorner) {
    if (data.openingA < 15 || data.openingB < 15) {
      w.push('Jedno z ramion ma bardzo małe światło wewnętrzne (< 15 cm).');
    }
    if (data.doorMode === 'between_sides' && data.cornerSpan > 0 && data.cornerSpan < 25) {
      w.push('Jedno skrzydło między bokami jest wąskie (< 25 cm po przekątnej) — sprawdź wymiary pleców.');
    }
    if (door === 'przesuwne' && data.doorMode === 'per_arm') {
      if (data.openingA < 40) w.push('Przesuwne na ramieniu A: światło < 40 cm.');
      if (data.openingB < 40) w.push('Przesuwne na ramieniu B: światło < 40 cm.');
    }
  }

  if (shelvesPer > 0 && H / (shelvesPer + 1) < 12) {
    w.push('Odstęp między półkami poniżej ok. 12 cm — rozważ mniej półek lub większą wysokość.');
  }

  if (data.panelMode && data.panelHeight - H < 10) {
    w.push('„Wolna” część płyty montażowej ma mniej niż 10 cm — efekt wizualny będzie minimalny.');
  }

  if (shelvesPer > 0 && (door === 'szuflady' || data.doorType === 'szuflady')) {
    w.push('Szafka ze szufladami zwykle nie ma półek wewnętrznych — rozważ ustawienie półek na 0.');
  }

  if (data.doorType === 'szuflady' || cfg?.door === 'szuflady') {
    const nl = data.nominalRunnerLength;
    if (nl && D < nl + 0.3) {
      w.push(`Głębokość korpusu (${fmt(D)} cm) jest za mała na prowadnice ${fmt(nl * 10)} mm — zwiększ głęb. o ok. 3 cm.`);
    }
    const cnt = data.drawerCount || cfg?.drawerCount || 3;
    if (cnt > 0 && H / cnt < 12) {
      w.push('Fronty szuflad będą bardzo niskie (< 12 cm) — zmniejsz liczbę szuflad lub zwiększ wysokość.');
    }
  }

  const topC = data.topConstruction || cfg?.topConstruction;
  if (topC === 'countertop') {
    const front = data.frontCargo != null ? data.frontCargo : (cfg?.frontCargo !== false);
    const rear = !!(data.rearReinforcement ?? cfg?.rearReinforcement);
    if (!front && !rear) {
      w.push('Korpus pod blat bez cargi przedniej i bez wzmocnienia tylnego — dodaj przynajmniej jeden element montażowy.');
    }
    if (front && !rear && (data.W > 80 || data.isZabudowa)) {
      w.push('Przy szerszej zabudowie pod blat rozważ wzmocnienie tylne (carga z tyłu korpusu).');
    }
    const cd = Number(data.cargoDepth ?? cfg?.cargoDepth) || 8;
    if (cd > D - 2) {
      w.push('Głębokość cargi jest zbliżona do głębokości korpusu — zmniejsz cargę lub zwiększ głębokość szafki.');
    }
  }

  if (data.isZabudowa && data.moduleCount != null && data.modWidth < 35) {
    w.push('Auto-dobór dał moduły węższe niż 35 cm — zwiększ preferowaną szerokość.');
  }

  return w;
}
