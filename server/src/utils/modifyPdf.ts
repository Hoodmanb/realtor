/*import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';


type LabelStyle = {
    font: string;
    fontSize: number;
    color: string;
};

type BoxStyle = {
    background: string;
    borderColor: string;
    borderWidth: number;
};

type TableItem = {
    label?: string;
    content: string | string[] | { label: string; value: string }[];
    label_style?: LabelStyle;
    content_style?: LabelStyle;
    box_style?: BoxStyle;
};

function hexToRgb(hex: string): [number, number, number] {
    const val = hex.replace('#', '');
    const bigint = parseInt(val, 16);
    return [(bigint >> 16) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth <= maxWidth) {
            line = testLine;
        } else {
            if (line) lines.push(line);
            line = word;
        }
    }

    if (line) lines.push(line);
    return lines;
}

export async function modifyPdf(basePdfPath: string, outputPdfPath: string, data: TableItem[]) {
    const pdfBytes = await fs.readFile(basePdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const boxHeight = 60;
    const yOffset = 30;

    for (const page of pdfDoc.getPages()) {
        const { width: pageWidth } = page.getSize();
        const colWidth = (pageWidth - 40) / data.length;
        const xStart = 20;
        const yStart = yOffset;

        for (let idx = 0; idx < data.length; idx++) {
            const item = data[idx];
            const x = xStart + idx * colWidth;
            let y = yStart;

            const boxStyle = item.box_style ?? {
                background: '#ffffff',
                borderColor: '#000000',
                borderWidth: 0.5,
            };

            const contentStyle = item.content_style ?? {
                font: 'Helvetica',
                fontSize: 8,
                color: '#000000',
            };

            const labelStyle = item.label_style ?? {
                font: 'Helvetica-Bold',
                fontSize: 6,
                color: '#000000',
            };

            const contentFont = contentStyle.font === 'Helvetica-Bold' ? helveticaBold : helvetica;
            const labelFont = labelStyle.font === 'Helvetica-Bold' ? helveticaBold : helvetica;

            // Background and border
            page.drawRectangle({
                x,
                y,
                width: colWidth,
                height: boxHeight,
                color: rgb(...hexToRgb(boxStyle.background)),
                borderColor: rgb(...hexToRgb(boxStyle.borderColor)),
                borderWidth: boxStyle.borderWidth,
            });

            if (Array.isArray(item.content) && item.content.every((i) => typeof i === 'string')) {
                let textY = y + boxHeight - contentStyle.fontSize - 5;

                (item.content as string[]).forEach((line, i) => {
                    const numberedLine = `${i + 1}. ${line}`;
                    const wrappedLines = wrapText(numberedLine, contentFont, contentStyle.fontSize, colWidth - 10);

                    for (const wrappedLine of wrappedLines) {
                        if (textY < y + 5) break; // prevent drawing below the box
                        page.drawText(wrappedLine, {
                            x: x + 5,
                            y: textY,
                            size: contentStyle.fontSize,
                            font: contentFont,
                            color: rgb(...hexToRgb(contentStyle.color)),
                        });
                        textY -= contentStyle.fontSize + 2;
                    }
                });

            } else if (Array.isArray(item.content) && item.content.every((i) => typeof i === 'object')) {
                const rows = item.content as { label: string; value: string }[];
                const itemHeight = boxHeight / rows.length;
                for (let i = 0; i < rows.length; i++) {
                    const pair = rows[i];
                    const itemY = y + boxHeight - (i + 1) * itemHeight;
                    const midX = x + colWidth / 2;

                    const startX = x;
                    const endX = x + colWidth;
                    const lineY = itemY;


                    page.drawLine({
                        start: { x: startX, y: lineY },
                        end: { x: endX, y: lineY },
                        thickness: 0.5,
                    });


                    page.drawText(pair.label, {
                        x: x + 5,
                        y: itemY + itemHeight / 2 - contentStyle.fontSize / 2,
                        size: contentStyle.fontSize,
                        font: contentFont,
                        color: rgb(...hexToRgb(contentStyle.color)),
                    });

                    page.drawText(pair.value, {
                        x: midX + 5,
                        y: itemY + itemHeight / 2 - contentStyle.fontSize / 2,
                        size: contentStyle.fontSize,
                        font: contentFont,
                        color: rgb(...hexToRgb(contentStyle.color)),
                    });
                }
            } else {
                // Single label + content
                if (item.label) {
                    page.drawText(item.label, {
                        x: x + 5,
                        y: y + boxHeight - labelStyle.fontSize - 2,
                        size: labelStyle.fontSize,
                        font: labelFont,
                        color: rgb(...hexToRgb(labelStyle.color)),
                    });
                }

                page.drawText(item.content as string, {
                    x: x + 5,
                    y: y + boxHeight - labelStyle.fontSize - contentStyle.fontSize - 4,
                    size: contentStyle.fontSize,
                    font: contentFont,
                    color: rgb(...hexToRgb(contentStyle.color)),
                });

            }
        }
    }

    const finalBytes = await pdfDoc.save();
    await fs.writeFile(outputPdfPath, finalBytes);
}
*/


// const test = async () => {
//     try {
//         const data = {
//             project: "Smart Estate 1.0",
//             planLayout: "4 Bedroom Duplex",
//             location: "Lekki, Lagos",
//             designerName: "Joshua Nwigiri",
//             checkedBy: "Mr. Check Guy",
//             scale: "1:100",
//             date: "2025-08-05",
//             developer: "JNB Designs",
//             sheetNumber: "Sheet 01",
//             Email: "joshuadebravo@gmail.com",
//             url: "https://res.cloudinary.com/dxc2vrlcu/raw/upload/fl_attachment/mn6iu4tu8hj8jaao8fpk.pdf",
//             clientName: "Odogwu of Lagos"
//         };

//         const response = await fetch("https://formcast-realtor.vercel.app/api/pdf/send", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(data)
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error((errorData && errorData.message) || "Something went wrong");
//         }

//         const result = await response.json();
//         console.log("Response ✅:", result);
//     } catch (error) {
//         console.error("Request failed ❌:", error.message);
//     }
// };

// test();



//import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
/*import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js';
const loadingTask = getDocument({ data: pdfBytes });
const pdf = await loadingTask.promise;

// Set the worker path
GlobalWorkerOptions.workerSrc = pdfjsWorker;*/
// Top-level imports and setup
/*import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';*/

// Set up the PDF.js worker (must be before getDocument is called)
//GlobalWorkerOptions.workerSrc = pdfjsWorker;
//GlobalWorkerOptions.workerSrc = null as any;


/*import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';*/

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TextItem } from 'pdfjs-dist/types/src/display/api'; // Important for proper types
import fs from 'fs/promises';
import path from 'path';

// 🧙 Disable worker in Node.js
GlobalWorkerOptions.workerSrc = null as any;

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const regex = new RegExp(`.{1,${maxCharsPerLine}}`, 'g');
  return text.match(regex) || [];
}

/*async function findPlaceholders(pdfBytes: Uint8Array) {
  //const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  const found: { pageIndex: number; x: number; y: number; placeholder: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      const str = item.str;
      if (str === '*'.repeat(20) || str === '#'.repeat(20)) {
        const [a, b, c, d, x, y] = item.transform;
        found.push({ pageIndex: i - 1, x, y, placeholder: str });
      }
    }
  }

  return found;
}*/

async function findPlaceholders(pdfBytes: Uint8Array) {
  const loadingTask = getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  const found: { pageIndex: number; x: number; y: number; placeholder: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      // Type guard - only touch items that are actual text (TextItem)
      if ('str' in item && typeof item.str === 'string') {
        const str = item.str;

        if (
          str === '*'.repeat(20) ||
          str === '#'.repeat(20) ||
          str === '$'.repeat(15) // don't forget your boo thang – the date placeholder
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
  const placeholders = await findPlaceholders(inputBytes);
  const pdfDoc = await PDFDocument.load(inputBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = fontSize + 2;
  const charWidthEstimate = 6;

  const replacements: Record<string, string> = {
    ['*'.repeat(20)]: location,
    ['#'.repeat(20)]: clientName,
    ['$'.repeat(15)]: date,
  };

  for (const { pageIndex, x, y, placeholder } of placeholders) {
    const page = pdfDoc.getPages()[pageIndex];
    const replacement = replacements[placeholder] ?? '';
    const lines = wrapText(replacement, placeholder.length);

    page.drawRectangle({
      x,
      y,
      width: placeholder.length * charWidthEstimate,
      height: lineHeight * lines.length,
      color: rgb(1, 1, 1),
    });

    lines.forEach((line, i) => {
      page.drawText(line, {
        x,
        y: y + (lineHeight * (lines.length - i - 1)),
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
  location: string,
  clientName: string,
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