/*import axios from "axios";
import fs from "fs";

interface DownlodPdfParams {
    cloudinaryUrl: string;
    basePath: string
}

async function downloadPDF({ cloudinaryUrl, basePath }: DownlodPdfParams): Promise<void> {
    const response = await axios.get(cloudinaryUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(basePath);

    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
        writer.on("finish", () => resolve());
        writer.on("error", (err) => reject(err));
    });
}

export default downloadPDF;
*/

import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from 'crypto'

interface DownloadMultipleParams {
  cloudinaryUrls: string[];
  baseFolderPath:string
}

async function downloadMultiplePDFs({ cloudinaryUrls ,baseFolderPath}: DownloadMultipleParams): Promise<void> {
  for (const url of cloudinaryUrls) {
    try {
      const fileName = path.basename(url.split('?')[0]); // Remove query params if any
      //const outputPath = path.join(outputDir, fileName);
      const response = await axios.get(url, { responseType: "stream" });
        const randomStringForBasePath = crypto.randomBytes(16).toString("hex");
        const filePath = path.join(baseFolderPath, randomStringForBasePath, ".pdf")
      const writer = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", () => {
          console.log(`✅ Downloaded: ${fileName}`);
          resolve();
        });
        writer.on("error", (err) => {
          console.error(`❌ Error writing ${fileName}:`, err);
          reject(err);
        });
      });
    } catch (err) {
      console.error(`❌ Failed to download from ${url}`, err);
    }
  }
}

export default downloadMultiplePDFs;