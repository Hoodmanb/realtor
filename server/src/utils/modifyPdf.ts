import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
