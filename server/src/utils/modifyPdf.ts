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

  // Match: any sequence of the same character repeated more than 3 times
  const placeholderRegex = /^(.)(\1{3,})$/;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string") {
        const str = item.str.trim();

        if (placeholderRegex.test(str)) {
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


async function modifySinglePdfDynamic(
  inputBytes: Uint8Array,
  replacements: Record<string, string>
): Promise<Uint8Array> {
  const placeholders = await findPlaceholdersFromBytes(inputBytes);
  const pdfDoc = await PDFDocument.load(inputBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 11;
  const lineHeight = fontSize + 1;

  // Sort or keep order — here, we keep the order they appear
  placeholders.sort((a, b) =>
    a.pageIndex === b.pageIndex
      ? a.y === b.y
        ? a.x - b.x
        : b.y - a.y
      : a.pageIndex - b.pageIndex
  );



  placeholders.forEach((ph, idx) => {
    const page = pdfDoc.getPages()[ph.pageIndex];
    const placeholderChar = ph.placeholder[0];
    const replacement = replacements[placeholderChar] ?? "";
    const horizontalPadding = 0.5;
    const verticalPadding = 0.5;

    const lines = wrapText(replacement, ph.placeholder.length);

    const placeholderWidth = font.widthOfTextAtSize(ph.placeholder, fontSize);
    const ascent = 0.6 * fontSize;
    const descent = 0.2 * fontSize;

    const rectWidth = idx === 3 ? placeholderWidth :
      idx === 1 ? placeholderWidth + horizontalPadding * 2 :
        placeholderWidth + horizontalPadding * 6;
    const rectHeight = ascent + descent + verticalPadding * 4;

    const rectX = ph.x - horizontalPadding;
    const rectY = ph.y - descent - verticalPadding;
    console.log("log me", ph, idx)

    // Draw white rectangle over placeholder
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: idx === 3 ? rectWidth - 70 : idx === 1 ? rectWidth - 30 : rectWidth,
      height: rectHeight,
      color: rgb(1, 1, 1),
    });

    // Draw replacement text
    lines.forEach((line, i) => {
      const lineBaselineY = ph.y + lineHeight * (lines.length - i - 1);
      page.drawText(line, {
        x: ph.x,
        y: lineBaselineY,
        font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    });
  });

  return await pdfDoc.save();
}


// export async function modifyMultiplePdfs(
//   basePath: string,
//   savedPath: string,
//   clientName: string,
//   date: string,
//   plotNumber: string,
//   cadZone: string,
//   district: string,
// ) {
//   const files = await fs.readdir(basePath);

//   for (const file of files) {
//     if (file.toLowerCase().endsWith('.pdf')) {
//       const inputPath = path.join(basePath, file);
//       const outputPath = path.join(savedPath, file);

//       try {
//         const inputBytes = await fs.readFile(inputPath);
//         const modifiedBytes = await modifySinglePdfDynamic(inputBytes,
//           {
//             "*": clientName,
//             "@": plotNumber,
//             "&": cadZone,
//             "#": district,
//             "$": date
//           });
//         await fs.writeFile(outputPath, modifiedBytes);
//         console.log(`✅ Processed: ${file}`);
//       } catch (err) {
//         console.error(`❌ Failed: ${file}`, err);
//       }
//     }
//   }

//   console.log('✨ All PDFs done, king!');
// }

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





































// import pkg from 'pdfjs-dist/legacy/build/pdf.js';



// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// import fs from 'fs/promises';
// import path from 'path';

// function wrapText(text: string, maxCharsPerLine: number): string[] {
//   const regex = new RegExp(`.{1,${maxCharsPerLine}}`, 'g');
//   return text.match(regex) || [];
// }

// import type { TextItem } from "pdfjs-dist/types/src/display/api.js";

// type FoundPlaceholder = {
//   pageIndex: number;
//   x: number;
//   y: number;
//   placeholder: string;
// };

// export async function findPlaceholdersFromBytes(
//   pdfBytes: Uint8Array
// ): Promise<FoundPlaceholder[]> {
//   // Dynamically import PDF.js (avoids ESM issues in some environments)
//   // @ts-ignore – TS doesn't ship types for .mjs build
//   const { getDocument, GlobalWorkerOptions } = await import(
//     "pdfjs-dist/legacy/build/pdf.min.mjs"
//   );

//   // Disable workers for Node.js
//   GlobalWorkerOptions.workerSrc = "";

//   const pdf = await getDocument({ data: pdfBytes }).promise;
//   const found: FoundPlaceholder[] = [];

//   const placeholderRegex = /^(.)(\1{3,})$/; // e.g., ****, ####, $$$$

//   for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
//     const page = await pdf.getPage(pageIndex + 1);
//     const content = await page.getTextContent();

//     for (const item of content.items) {
//       if ("str" in item) {
//         const str = (item as TextItem).str.trim();
//         if (placeholderRegex.test(str)) {
//           const [, , , , x, y] = (item as TextItem).transform;
//           found.push({ pageIndex, x, y, placeholder: str });
//         }
//       }
//     }
//   }

//   return found;
// }



// async function modifySinglePdfDynamic(
//   inputBytes: Uint8Array,
//   replacements: Record<string, string>
// ): Promise<Uint8Array> {
//   const placeholders = await findPlaceholdersFromBytes(inputBytes);
//   const pdfDoc = await PDFDocument.load(inputBytes);
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

//   const fontSize = 11;
//   const lineHeight = fontSize + 1;

//   // Sort or keep order — here, we keep the order they appear
//   placeholders.sort((a, b) =>
//     a.pageIndex === b.pageIndex
//       ? a.y === b.y
//         ? a.x - b.x
//         : b.y - a.y
//       : a.pageIndex - b.pageIndex
//   );



//   placeholders.forEach((ph, idx) => {
//     const page = pdfDoc.getPages()[ph.pageIndex];
//     const placeholderChar = ph.placeholder[0];
//     const replacement = replacements[placeholderChar] ?? "";
//     const horizontalPadding = 0.5;
//     const verticalPadding = 0.5;

//     const lines = wrapText(replacement, ph.placeholder.length);

//     const placeholderWidth = font.widthOfTextAtSize(ph.placeholder, fontSize);
//     const ascent = 0.6 * fontSize;
//     const descent = 0.2 * fontSize;

//     const rectWidth = idx === 3 ? placeholderWidth :
//       idx === 1 ? placeholderWidth + horizontalPadding * 2 :
//         placeholderWidth + horizontalPadding * 6;
//     const rectHeight = ascent + descent + verticalPadding * 4;

//     const rectX = ph.x - horizontalPadding;
//     const rectY = ph.y - descent - verticalPadding;
//     console.log("log me", ph, idx)

//     // Draw white rectangle over placeholder
//     page.drawRectangle({
//       x: rectX,
//       y: rectY,
//       width: idx === 3 ? rectWidth - 70 : idx === 1 ? rectWidth - 30 : rectWidth,
//       height: rectHeight,
//       color: rgb(1, 1, 1),
//     });

//     // Draw replacement text
//     lines.forEach((line, i) => {
//       const lineBaselineY = ph.y + lineHeight * (lines.length - i - 1);
//       page.drawText(line, {
//         x: ph.x,
//         y: lineBaselineY,
//         font,
//         size: fontSize,
//         color: rgb(0, 0, 0),
//       });
//     });
//   });

//   return await pdfDoc.save();
// }


// export async function modifyMultiplePdfs(
//   basePath: string,
//   savedPath: string,
//   clientName: string,
//   date: string,
//   plotNumber: string,
//   cadZone: string,
//   district: string,
// ) {
//   const files = await fs.readdir(basePath);

//   for (const file of files) {
//     if (file.toLowerCase().endsWith('.pdf')) {
//       const inputPath = path.join(basePath, file);
//       const outputPath = path.join(savedPath, file);

//       try {
//         const inputBytes = await fs.readFile(inputPath);
//         const modifiedBytes = await modifySinglePdfDynamic(inputBytes,
//           {
//             "*": clientName,
//             "@": plotNumber,
//             "&": cadZone,
//             "#": district,
//             "$": date
//           });
//         await fs.writeFile(outputPath, modifiedBytes);
//         console.log(`✅ Processed: ${file}`);
//       } catch (err) {
//         console.error(`❌ Failed: ${file}`, err);
//       }
//     }
//   }

//   console.log('✨ All PDFs done, king!');
// }
