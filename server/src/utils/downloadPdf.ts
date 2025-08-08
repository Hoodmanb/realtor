import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from "crypto";

interface DownloadMultipleParams {
  cloudinaryUrls: string[];
  baseFolderPath: string;
}

async function downloadMultiplePDFs({ cloudinaryUrls, baseFolderPath }: DownloadMultipleParams): Promise<void> {
  for (const url of cloudinaryUrls) {
    try {
      const fileName = path.basename(url.split("?")[0]);

      const response = await axios.get(url, { responseType: "stream" });

      const randomFolderName = crypto.randomBytes(8).toString("hex"); // 16 was overkill tbh
      const filePath = path.join(baseFolderPath, fileName);

      // Make sure the directory exists
      fs.mkdirSync(baseFolderPath, { recursive: true });

      const writer = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", () => {
          console.log(`✅ Downloaded: ${fileName} -> ${filePath}`);
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
