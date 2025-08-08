import pkg from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument, GlobalWorkerOptions } = pkg;

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import fs from 'fs/promises';
import path from 'path';

// Disable workers in Node.js
GlobalWorkerOptions.workerSrc = null as any;

type FoundPlaceholder = {
  pageIndex: number;
  x: number;
  y: number;
  placeholder: string;
};

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const regex = new RegExp(`.{1,${maxCharsPerLine}}`, 'g');
  return text.match(regex) || [];
}

async function findPlaceholdersFromBytes(pdfBytes: Uint8Array): Promise<FoundPlaceholder[]> {
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  const found: FoundPlaceholder[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if ('str' in item && typeof item.str === 'string') {
        const str = item.str;

        // Match placeholders — adjust if needed
        if (
          str === '*'.repeat(29) ||
          str === '#'.repeat(30) ||
          str === '$'.repeat(15)
        ) {
          const transform = (item as TextItem).transform;
          const x = transform[4];
          const y = transform[5];

          found.push({ pageIndex: i - 1, x, y, placeholder: str });
        }
      }
    }
  }

  return found;
}

async function modifySinglePdf(
  inputBytes: Uint8Array,
  location: string,
  clientName: string,
  date: string
): Promise<Uint8Array> {
  const placeholders = await findPlaceholdersFromBytes(inputBytes);
  const pdfDoc = await PDFDocument.load(inputBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 11; // 👈 Replacement text size
  const lineHeight = fontSize + 1;
  const replacements: Record<string, string> = {
    ['*'.repeat(29)]: clientName,
    ['#'.repeat(30)]: location,
    ['$'.repeat(15)]: date,
  };

  // Padding controls how much extra space around the white rectangle
  const horizontalPadding = 0.5; // 👈 Reduce this for a tighter fit
  const verticalPadding = 0.5;   // 👈 Reduce this for less top/bottom space

  for (const [index, { pageIndex, x, y, placeholder }] of placeholders.entries()) {
    const page = pdfDoc.getPages()[pageIndex];
    const replacement = replacements[placeholder] ?? '';
    const lines = wrapText(replacement, placeholder.length);

    // Measure the placeholder width based on its actual font space
    const placeholderWidth = font.widthOfTextAtSize(placeholder, fontSize);

    // Height estimate: ascent + descent
    const ascent = 0.6 * fontSize;
    const descent = 0.2 * fontSize;

    // Rectangle size exactly covering placeholder region
    const rectWidth = index === 0 ? placeholderWidth + horizontalPadding * 70 : placeholderWidth + horizontalPadding * 5;
    const rectHeight = ascent + descent + verticalPadding * 4;

    const rectX = x - horizontalPadding;
    const rectY = y - descent - verticalPadding;

    // Draw white rectangle over placeholder
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight,
      color: rgb(1, 1, 1),
    });

    // Draw replacement text
    lines.forEach((line, i) => {
      const lineBaselineY = y + lineHeight * (lines.length - i - 1);
      page.drawText(line, {
        x,
        y: lineBaselineY, // 👈 Adjust this up/down if text isn't vertically aligned
        font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    });
  }

  return await pdfDoc.save();
}

export async function modifyMultiplePdfs(
  basePath: string,
  savedPath: string,
  clientName: string,
  location: string,
  date: string
) {
  const files = await fs.readdir(basePath);

  for (const file of files) {
    if (file.toLowerCase().endsWith('.pdf')) {
      const inputPath = path.join(basePath, file);
      const outputPath = path.join(savedPath, file);

      try {
        const inputBytes = await fs.readFile(inputPath);
        const modifiedBytes = await modifySinglePdf(inputBytes, location, clientName, date);
        await fs.writeFile(outputPath, modifiedBytes);
        console.log(`✅ Processed: ${file}`);
      } catch (err) {
        console.error(`❌ Failed: ${file}`, err);
      }
    }
  }

  console.log('✨ All PDFs done, king!');
}
