import { jsPDF } from 'jspdf';
import { fmt } from './utils.js';
import { DRAWER } from './drawers.js';

let setPdfFont = () => {};

async function ensurePdfFonts(doc) {
  if (!doc._formatkaFonts) {
    const fonts = await import('./pdf-fonts.js');
    fonts.registerPdfFonts(doc);
    setPdfFont = fonts.setPdfFont;
  }
}

const ACCENT = [217, 87, 45];
const LINE = [90, 90, 90];
const DIM = [120, 120, 120];
const HEADER_BG = [245, 245, 245];
const ZEBRA = [250, 250, 250];

function sideHoles(D_mm, H_mm, t_mm, shelvesPer) {
  const rows = [t_mm / 2];
  for (let k = 1; k <= shelvesPer; k++) rows.push(H_mm * k / (shelvesPer + 1));
  rows.push(H_mm - t_mm / 2);
  const off = Math.min(37, D_mm * 0.28);
  const pts = [];
  rows.forEach((y) => { pts.push({ x: off, y }); pts.push({ x: D_mm - off, y }); });
  return pts;
}

function perimeterHoles(wMm, hMm, margin = 10, spacing = 180) {
  const pts = [];
  const nx = Math.max(2, Math.round((wMm - 2 * margin) / spacing) + 1);
  for (let i = 0; i < nx; i++) {
    const x = margin + (wMm - 2 * margin) * i / (nx - 1);
    pts.push({ x, y: margin });
    pts.push({ x, y: hMm - margin });
  }
  const ny = Math.max(2, Math.round((hMm - 2 * margin) / spacing) + 1);
  for (let i = 1; i < ny - 1; i++) {
    const y = margin + (hMm - 2 * margin) * i / (ny - 1);
    pts.push({ x: margin, y });
    pts.push({ x: wMm - margin, y });
  }
  return pts;
}

function getHoles(part, data) {
  if (/^Bok|słupek|Kątownik/.test(part.name)) {
    return sideHoles(part.w * 10, part.h * 10, data.t * 10, data.shelvesPer);
  }
  if (/Plecy|Płyta montażowa|Carga|Wzmocnienie|Wieniec/.test(part.name)) {
    return perimeterHoles(part.w * 10, part.h * 10);
  }
  return [];
}

/** Opis tekstowy pozycji otworów dla stolarni (odległości od krawędzi). */
function getHoleDescription(part, data, holes) {
  const wMm = part.w * 10;
  const hMm = part.h * 10;
  const isSide = /^Bok|słupek|Kątownik/.test(part.name);

  if (isSide) {
    const off = Math.min(37, wMm * 0.28);
    const rowYs = [...new Set(holes.map((h) => Math.round(h.y * 10) / 10))].sort((a, b) => a - b);
    const fromBottom = rowYs.map((y) => fmt(hMm - y));
    const fromTop = rowYs.map((y) => fmt(y));

    const lines = [
      `Odległość od krawędzi czołowej i tylnej (głęb.): ${fmt(off)} mm`,
      `Pierwszy rząd — od góry: ${fromTop[0]} mm, od dołu: ${fromBottom[0]} mm`,
      `Ostatni rząd — od dołu: ${fromBottom[fromBottom.length - 1]} mm, od góry: ${fromTop[fromTop.length - 1]} mm`,
    ];

    if (rowYs.length > 2) {
      lines.push(`Wszystkie wysokości rzędów od dołu: ${fromBottom.join(', ')} mm`);
    }

    if ((data.shelvesPer || 0) > 0) {
      lines.push(`Rzędy środkowe: pod ${data.shelvesPer} półkami (równomiernie w świetle wysokości)`);
    }

    lines.push(`Łącznie: ${holes.length} otworów (${rowYs.length} rzędów × 2 strony)`);
    return { lines, note: 'Układ: oś Y od góry płyty (jak na rysunku). Wysokości podane także od dołu — typowy sposób w stolarni.' };
  }

  const margin = 10;
  const top = [...new Set(holes.filter((h) => h.y <= margin + 0.5).map((h) => Math.round(h.x * 10) / 10))].sort((a, b) => a - b);
  const bottom = [...new Set(holes.filter((h) => h.y >= hMm - margin - 0.5).map((h) => Math.round(h.x * 10) / 10))].sort((a, b) => a - b);
  const left = [...new Set(holes.filter((h) => h.x <= margin + 0.5 && h.y > margin && h.y < hMm - margin).map((h) => Math.round(h.y * 10) / 10))].sort((a, b) => a - b);
  const right = [...new Set(holes.filter((h) => h.x >= wMm - margin - 0.5 && h.y > margin && h.y < hMm - margin).map((h) => Math.round(h.y * 10) / 10))].sort((a, b) => a - b);

  const edgeSpacing = (pts, span) => (pts.length > 1 ? fmt((pts[pts.length - 1] - pts[0]) / (pts.length - 1)) : '—');

  const lines = [
    `Odstęp otworów od każdej krawędzi: ${margin} mm`,
  ];

  if (top.length) {
    lines.push(`Górna krawędź — ${top.length} otw.: od lewej ${top.map((x) => fmt(x)).join(', ')} mm (rozstaw ~${edgeSpacing(top)} mm)`);
  }
  if (bottom.length) {
    lines.push(`Dolna krawędź — ${bottom.length} otw.: od lewej ${bottom.map((x) => fmt(x)).join(', ')} mm (rozstaw ~${edgeSpacing(bottom)} mm)`);
  }
  if (left.length) {
    lines.push(`Lewa krawędź — ${left.length} otw.: od dołu ${left.map((y) => fmt(hMm - y)).join(', ')} mm`);
  }
  if (right.length) {
    lines.push(`Prawa krawędź — ${right.length} otw.: od dołu ${right.map((y) => fmt(hMm - y)).join(', ')} mm`);
  }

  lines.push(`Łącznie: ${holes.length} otworów w obwodzie płyty`);
  return { lines, note: 'Wymiary od lewej (szer.) i od dołu (wys.) — widok od strony wiercenia.' };
}

function addPageFooter(doc, pageNum, totalPages, pageW, pageH, margin) {
  setPdfFont(doc, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DIM);
  doc.text('FormatkaApp — lista rozkroju', margin, pageH - 8);
  doc.text(`Strona ${pageNum} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
}

function drawPartDiagram(doc, part, holes, x0, y0, boxW, boxH, opts = {}) {
  const { showCaption = true } = opts;
  const wMm = part.w * 10, hMm = part.h * 10;
  const scale = Math.min((boxW - 4) / wMm, (boxH - 4) / hMm);
  const dW = wMm * scale, dH = hMm * scale;
  const dx = x0 + (boxW - dW) / 2;
  const dy = y0 + 2;

  doc.setFillColor(...HEADER_BG);
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  const captionH = showCaption ? 18 : 0;
  doc.roundedRect(x0, y0, boxW, boxH + captionH, 1.5, 1.5, 'FD');

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.35);
  doc.rect(dx, dy, dW, dH);

  doc.setFillColor(...ACCENT);
  holes.forEach((h) => {
    doc.circle(dx + h.x * scale, dy + h.y * scale, 0.65, 'F');
  });

  const ratio = Math.round(Math.max(wMm, hMm) / Math.max(dW, dH));
  if (ratio > 2) {
    doc.setFontSize(6);
    doc.setTextColor(...DIM);
    doc.text(`1:${ratio}`, dx + dW - 1, dy + 2, { align: 'right' });
  }

  if (showCaption) {
    doc.setFontSize(7.5);
    setPdfFont(doc, 'bold');
    doc.setTextColor(40, 40, 40);
    const nameLines = doc.splitTextToSize(part.name, boxW - 4);
    doc.text(nameLines[0], x0 + boxW / 2, y0 + boxH + 6, { align: 'center' });

    setPdfFont(doc, 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...DIM);
    doc.text(
      `${fmt(wMm)} x ${fmt(hMm)} mm  |  gr. ${part.thickMm} mm  |  szt. ${part.qty}  |  otw.: ${holes.length}`,
      x0 + boxW / 2,
      y0 + boxH + 11,
      { align: 'center' }
    );
  }

  return boxH + captionH;
}

/** Blok: rysunek + szczegółowy opis otworów (pełna szerokość strony). */
function drawHolePartBlock(doc, part, data, y0, pageW, margin) {
  const holes = getHoles(part, data);
  const { lines, note } = getHoleDescription(part, data, holes);
  const boxW = 78;
  const boxH = 54;
  const textX = margin + boxW + 8;
  const textW = pageW - margin - textX;
  const lineStep = 4.2;
  const textH = lines.length * lineStep + (note ? 8 : 0) + 6;
  const blockH = Math.max(boxH + 4, textH) + 6;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y0, pageW - 2 * margin, blockH, 2, 2, 'S');

  drawPartDiagram(doc, part, holes, margin + 4, y0 + 4, boxW, boxH, { showCaption: false });

  setPdfFont(doc, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(part.name, textX, y0 + 10);

  setPdfFont(doc, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DIM);
  doc.text(
    `${fmt(part.w * 10)} x ${fmt(part.h * 10)} mm  |  gr. ${part.thickMm} mm  |  szt. ${part.qty}`,
    textX,
    y0 + 15
  );

  let ty = y0 + 21;
  doc.setFontSize(7.8);
  doc.setTextColor(50, 50, 50);
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, textW);
    doc.text(wrapped, textX, ty);
    ty += wrapped.length * lineStep;
  });

  if (note) {
    doc.setFontSize(6.8);
    doc.setTextColor(...DIM);
    setPdfFont(doc, 'normal');
    doc.text(note, textX, ty + 2);
    setPdfFont(doc, 'normal');
  }

  return blockH + 4;
}

function effectiveDoor(cfg, data) {
  return cfg.door || data.doorType || data.modules?.find((m) => m.doorType === 'szuflady' || m.kind === 'szuflady')?.doorType || '';
}

function drawDrawersSummaryBlock(doc, data, cfg, y, pageW, margin, pageH) {
  const door = effectiveDoor(cfg, data);
  if (door !== 'szuflady') return y;

  const modWithDrawers = data.modules?.find((m) => m.doorType === 'szuflady' || m.kind === 'szuflady');
  const count = modWithDrawers?.drawerCount || data.drawerCount || cfg.drawerCount || 3;
  const style = modWithDrawers?.drawerStyle || data.drawerStyle || cfg.drawerStyle || 'srednia';
  const NL = modWithDrawers?.nominalRunnerLength ?? data.nominalRunnerLength;
  const backH = DRAWER.backHeights[style] || DRAWER.backHeights.srednia;
  const styleNames = { niska: 'niska', srednia: 'średnia', wysoka: 'wysoka' };
  const drawerParts = data.parts.filter((p) => /^Szuflada/.test(p.name));

  if (y > pageH - 55) { doc.addPage(); y = margin; }

  setPdfFont(doc, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Szuflady — zestawienie', margin, y);
  y += 7;

  setPdfFont(doc, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Liczba szuflad: ${count}   |   Prowadnice NL: ${NL != null ? `${fmt(NL)} cm` : '—'}`, margin, y);
  y += 4.5;
  doc.text(`Wysokość skrzyni: ${styleNames[style] || style} (tył ${fmt(backH * 10)} mm)`, margin, y);
  y += 4.5;
  doc.setFontSize(7.8);
  doc.setTextColor(...DIM);
  doc.text('Dno: LW−75 mm × NL−24 mm   |   Tył: LW−87 mm   |   Boki: 2 szt. na szufladę', margin, y);
  y += 8;

  if (drawerParts.length) {
    setPdfFont(doc, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text('Elementy szuflad w rozkroju:', margin, y);
    y += 5;
    setPdfFont(doc, 'normal');
    doc.setFontSize(8);

    drawerParts.forEach((p) => {
      if (y > pageH - margin - 8) { doc.addPage(); y = margin; }
      doc.setTextColor(40, 40, 40);
      doc.text(`• ${p.name}`, margin + 2, y);
      doc.text(`${fmt(p.w * 10)} × ${fmt(p.h * 10)} mm`, margin + 95, y);
      doc.text(`${p.thickMm} mm`, margin + 140, y);
      doc.text(`×${p.qty}`, margin + 165, y);
      y += 4.8;
    });
    y += 4;
  }

  return y;
}

export async function buildPdfBase64(data, cfg) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await ensurePdfFonts(doc);
  const pageW = 210, pageH = 297, margin = 14;
  let y = margin;
  let pageNum = 1;

  const typeLabel = data.isZabudowa
    ? ({ wiszaca: 'Zabudowa — rząd wiszących', stojaca: 'Zabudowa — rząd stojących', rzad_naroznik: 'Zabudowa — rząd + narożna' }[data.zLayout] || 'Zabudowa')
    : { wiszaca: 'Szafka wisząca', stojaca: 'Szafka stojąca', regal: 'Regał otwarty', naroznik: 'Szafka narożna' }[cfg.type];
  const doorKey = effectiveDoor(cfg, data) || 'brak';
  const drawerCnt = data.drawerCount || cfg.drawerCount || 3;
  const doorLabel = {
    brak: 'brak',
    uchylne: 'uchylne (bok)',
    gora: 'uchylne do góry',
    przesuwne: 'przesuwne',
    szuflady: `szuflady (${drawerCnt} szt.)`
  }[doorKey] || doorKey;
  const topLabel = (data.topConstruction || cfg.topConstruction) === 'countertop'
    ? `Pod blat (cargi${data.rearReinforcement || cfg.rearReinforcement ? ' + wzmocnienie tylne' : ''}, gł. ${fmt(data.cargoDepth || cfg.cargoDepth || 8)} cm)`
    : 'Wieńce standardowe (góra + dół)';

  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 3, 'F');

  setPdfFont(doc, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text('Lista rozkroju', margin, y + 2);
  doc.setFontSize(9);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...DIM);
  doc.text('dokument dla stolarni', margin + 52, y + 2);
  y += 10;

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  doc.setFillColor(...HEADER_BG);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, pageW - 2 * margin, 26, 2, 2, 'FD');

  doc.setFontSize(9.5);
  setPdfFont(doc, 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(`Typ: ${typeLabel}`, margin + 4, y + 7);
  setPdfFont(doc, 'normal');
  doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')}`, pageW - margin - 4, y + 7, { align: 'right' });

  let dimsLine;
  if (data.isCorner && !data.isZabudowa) {
    dimsLine = `Ramię A: ${fmt(data.armA)} cm   Ramię B: ${fmt(data.armB)} cm   Wys: ${fmt(data.H)} cm   Gł: ${fmt(data.D)} cm`;
  } else if (data.isZabudowa) {
    dimsLine = `Dostępna szer.: ${fmt(data.W || data.armA)} cm   Wys: ${fmt(data.H)} cm   Gł: ${fmt(data.D)} cm`;
  } else {
    dimsLine = `Szer: ${fmt(data.W)} cm   Wys: ${fmt(data.H)} cm   Gł: ${fmt(data.D)} cm   Sekcje: ${data.N}`;
  }
  doc.setFontSize(8.5);
  doc.text(dimsLine, margin + 4, y + 13);

  doc.setFontSize(8);
  doc.setTextColor(...DIM);
  doc.text(`Płyta: ${data.t * 10} mm    Plecy: ${data.backT * 10} mm    Drzwi: ${doorLabel}`, margin + 4, y + 18);
  doc.text(`Konstrukcja: ${topLabel}`, margin + 4, y + 23);
  y += 32;

  const col = { lp: margin + 2, name: margin + 12, dim: margin + 88, thick: margin + 140, qty: margin + 170 };
  const colW = { name: 72 };

  doc.setFillColor(62, 110, 142);
  doc.rect(margin, y - 4, pageW - 2 * margin, 7, 'F');
  setPdfFont(doc, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Lp', col.lp, y);
  doc.text('Element', col.name, y);
  doc.text('Wymiary (mm)', col.dim, y);
  doc.text('Grubość', col.thick, y);
  doc.text('Ilość', col.qty, y);
  y += 5;

  setPdfFont(doc, 'normal');
  doc.setFontSize(8.5);
  let totalQty = 0;
  const rowH = 5.8;

  data.parts.forEach((p, i) => {
    if (y > pageH - margin - 10) {
      doc.addPage();
      pageNum++;
      y = margin;
    }
    totalQty += p.qty;

    if (i % 2 === 0) {
      doc.setFillColor(...ZEBRA);
      doc.rect(margin, y - 3.5, pageW - 2 * margin, rowH, 'F');
    }

    doc.setTextColor(40, 40, 40);
    doc.text(String(i + 1), col.lp, y);

    const nameLines = doc.splitTextToSize(p.name, colW.name);
    doc.text(nameLines[0], col.name, y);

    setPdfFont(doc, 'normal');
    doc.text(`${fmt(p.w * 10)} x ${fmt(p.h * 10)}`, col.dim, y);
    doc.text(`${p.thickMm} mm`, col.thick, y);
    setPdfFont(doc, 'bold');
    doc.text(String(p.qty), col.qty, y);
    setPdfFont(doc, 'normal');
    y += rowH;
  });

  y += 2;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  setPdfFont(doc, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Razem elementów: ${totalQty}`, margin, y);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...DIM);
  doc.text(`${data.parts.length} rodzajów`, margin + 50, y);
  y += 12;

  y = drawDrawersSummaryBlock(doc, data, cfg, y, pageW, margin, pageH);

  const holeParts = data.parts.filter((p) => /^Bok|słupek|Kątownik|Plecy|Płyta montażowa|Carga|Wzmocnienie|Wieniec/.test(p.name));
  if (holeParts.length) {
    if (y > pageH - 50) { doc.addPage(); pageNum++; y = margin; }

    setPdfFont(doc, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('Miejsca wiercenia pod wkręty', margin, y);
    setPdfFont(doc, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...DIM);
    doc.text('Pomarańczowe kropki = punkty wiercenia. Poniżej odległości od krawędzi i rozmieszczenie rzędów.', margin, y + 4.5);
    y += 12;

    holeParts.forEach((p) => {
      const estH = 72;
      if (y + estH > pageH - margin) {
        doc.addPage();
        pageNum++;
        y = margin;
      }
      y += drawHolePartBlock(doc, p, data, y, pageW, margin);
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addPageFooter(doc, p, totalPages, pageW, pageH, margin);
  }

  return doc.output('arraybuffer');
}
