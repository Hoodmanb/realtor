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
  fontSize: number;
  width: number;
  height: number;
};

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const regex = new RegExp(`.{1,${maxCharsPerLine}}`, 'g');
  return text.match(regex) || [];
}

async function findPlaceholdersFromBytes(pdfBytes: Uint8Array): Promise<FoundPlaceholder[]> {
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  const found: FoundPlaceholder[] = [];
  const placeholderRegex = /^(.)(\1{3,})$/;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string") {
        const str = item.str.trim();

        if (placeholderRegex.test(str)) {
          const textItem = item as TextItem;
          const transform = textItem.transform;

          const x = transform[4];
          const y = transform[5];

          // PDF.js gives you the exact width and height
          const width = textItem.width;
          const height = textItem.height;

          // Compute font size from transform (just in case)
          const fontSize = Math.sqrt(transform[2] ** 2 + transform[3] ** 2);

          found.push({
            pageIndex: i - 1,
            x,
            y,
            placeholder: str,
            fontSize,
            width,
            height,
          });
        }
      }
    }
  }

  return found;
}


async function modifySinglePdfDynamic(
  inputBytes: Uint8Array,
  replacements: Record<string, string>
): Promise<Uint8Array> {
  const placeholders = await findPlaceholdersFromBytes(inputBytes);
  const pdfDoc = await PDFDocument.load(inputBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Use placeholder’s own font size (already detected in ph if available)
  placeholders.sort((a, b) =>
    a.pageIndex === b.pageIndex
      ? a.y === b.y
        ? a.x - b.x
        : b.y - a.y
      : a.pageIndex - b.pageIndex
  );

  placeholders.forEach((ph) => {
    const page = pdfDoc.getPages()[ph.pageIndex];
    const placeholderChar = ph.placeholder[0];
    const replacement = replacements[placeholderChar] ?? "";

    const fontSize = ph.fontSize; // fallback if fontSize wasn’t captured

    // Measure placeholder bounding box
    const placeholderWidth = font.widthOfTextAtSize(ph.placeholder, fontSize);
    const ascent = fontSize * 0.8;
    const descent = fontSize * 0.2;
    const placeholderHeight = ascent + descent;

    const rectX = ph.x;
    const rectY = ph.y - ph.height * 0.25;
    const rectWidth = ph.width;
    const rectHeight = ph.height;

    // Draw exact white rectangle over placeholder
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight,
      color: rgb(1, 1, 1),
    });

    // Keep replacement text at same font size
    let safeText = replacement;
    while (font.widthOfTextAtSize(safeText, fontSize) > placeholderWidth && safeText.length > 0) {
      safeText = safeText.slice(0, -1); // trim until it fits
    }

    // Draw replacement text using placeholder’s font size
    page.drawText(safeText, {
      x: rectX,
      y: ph.y,
      font,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
  });

  return await pdfDoc.save();
}


export async function modifyMultiplePdfs(
  basePath: string,
  savedPath: string,
  clientName: string,
  date: string,
  plotNumber: string,
  cadZone: string,
  district: string
) {
  const files = await fs.readdir(basePath);
  const errors: { file: string; reason: string }[] = [];
  const processed: string[] = [];

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".pdf")) continue;

    const inputPath = path.join(basePath, file);
    const outputPath = path.join(savedPath, file);

    try {
      const inputBytes = await fs.readFile(inputPath);
      const modifiedBytes = await modifySinglePdfDynamic(inputBytes, {
        "*": clientName,
        "@": plotNumber,
        "&": cadZone,
        "#": district,
        "$": date
      });
      await fs.writeFile(outputPath, modifiedBytes);
      processed.push(file);
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Unknown error modifying PDF";
      errors.push({ file, reason });
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Failed to process ${errors.length} PDF(s): ${errors
        .map(e => `${e.file} (${e.reason})`)
        .join(", ")}`
    );
  }

  console.log(`✅ Processed ${processed.length} PDFs successfully`);
  return processed;
}