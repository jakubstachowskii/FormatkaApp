import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(dir, '../src/lib/pdf-fonts.js');

function b64(file) {
  return fs.readFileSync(path.join(dir, file)).toString('base64');
}

const regular = b64('Roboto-Regular.ttf');
const bold = b64('Roboto-Bold.ttf');

const content = `// Wygenerowano: node scripts/gen-pdf-font.mjs — fonty z obsługą polskich znaków
export const PDF_FONT = 'Formatka';

export function registerPdfFonts(doc) {
  if (doc._formatkaFonts) return;
  doc.addFileToVFS('Roboto-Regular.ttf', '${regular}');
  doc.addFileToVFS('Roboto-Bold.ttf', '${bold}');
  doc.addFont('Roboto-Regular.ttf', PDF_FONT, 'normal');
  doc.addFont('Roboto-Bold.ttf', PDF_FONT, 'bold');
  doc._formatkaFonts = true;
}

export function setPdfFont(doc, style = 'normal') {
  doc.setFont(PDF_FONT, style === 'bold' ? 'bold' : 'normal');
}
`;

fs.writeFileSync(outPath, content);
console.log('Zapisano', outPath, `(${(content.length / 1024).toFixed(0)} KB)`);
