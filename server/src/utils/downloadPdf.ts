import axios from "axios";
import fs from "fs";
import path from "path";

interface DownloadMultipleParams {
  cloudinaryUrls: string[];
  baseFolderPath: string;
}

async function downloadMultiplePDFs({ cloudinaryUrls, baseFolderPath }: DownloadMultipleParams): Promise<void> {
  for (const url of cloudinaryUrls) {
    const fileName = path.basename(url.split("?")[0]);

    try {
      const response = await axios.get(url, { responseType: "stream" });

      // Create directory if missing
      fs.mkdirSync(baseFolderPath, { recursive: true });

      const filePath = path.join(baseFolderPath, fileName);
      const writer = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", () => {
          console.log(`✅ Downloaded: ${fileName} -> ${filePath}`);
          resolve();
        });
        writer.on("error", (err) => {
          reject(new Error(`Error writing ${fileName}: ${err.message}`));
        });
      });

    } catch (err) {
      // Throw so the parent can catch and handle
      throw new Error(`Failed to download file from ${url}: ${(err as Error).message}`);
    }
  }
}

export default downloadMultiplePDFs;
