import axios from "axios";
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
