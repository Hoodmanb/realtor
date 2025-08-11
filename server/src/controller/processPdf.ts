import { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import { modifyMultiplePdfs } from "../utils/modifyPdf.js";
import sendEmail from "../utils/emailServices.js";
import fs from "fs/promises";
import fsSync from "fs";
import { fileURLToPath } from "url";
import downloadMultiplePDFs from "../utils/downloadPdf.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.ENV;

async function processPdf(req: Request, res: Response) {
    const { urls, email, clientName, plotNumber, cadZone, district, autoCardUrl } = req.body;

    const cloudinaryUrls = urls;
    const recipientEmail = email;
    const date = new Date().toLocaleDateString("en-GB").replace(/\//g, "/");

    if (!cloudinaryUrls || !recipientEmail) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const baseDir =
        env !== "production"
            ? path.join(__dirname, "..", "files")
            : path.join("/tmp", "files");

    const randomStringForBasePath = crypto.randomBytes(16).toString("hex");
    const randomStringForSavedPath = crypto.randomBytes(16).toString("hex");

    const baseFolderPath = path.join(baseDir, randomStringForBasePath);
    const savedFolderPath = path.join(baseDir, randomStringForSavedPath);

    try {
        // Ensure folders
        await fs.mkdir(baseFolderPath, { recursive: true });
        await fs.mkdir(savedFolderPath, { recursive: true });

        // Step 1: Download PDFs
        try {
            await downloadMultiplePDFs({ cloudinaryUrls, baseFolderPath });
        } catch (err) {
            console.error("Error downloading PDFs:", err);
            return res.status(500).json({
                error: "Failed to download PDFs. Please check the URLs and try again.",
            });
        }

        // Step 2: Modify PDFs
        try {
            await modifyMultiplePdfs(
                baseFolderPath,
                savedFolderPath,
                clientName,
                date,
                plotNumber,
                cadZone,
                district
            );
        } catch (err) {
            console.error("Error modifying PDFs:", err);
            return res.status(500).json({
                error:
                    "Failed to process PDFs. Please verify input details and try again.",
            });
        }

        // Step 3: Send Email
        try {
            await sendEmail({ pdfPath: savedFolderPath, recipientEmail, autoCardUrl });
        } catch (err) {
            console.error("Error sending email:", err);
            return res.status(500).json({
                error:
                    "Failed to send the email. Please check the recipient address or try again later.",
            });
        }

        // Cleanup
        // await Promise.all([
        //     fs.rm(baseFolderPath, { recursive: true, force: true }),
        //     fs.rm(savedFolderPath, { recursive: true, force: true }),
        // ]);

        return res
            .status(200)
            .json({ message: "PDF processed and sent successfully!" });
    } catch (err) {
        console.error("Unexpected server error:", err);
        return res
            .status(500)
            .json({ error: "An unexpected error occurred. Please try again." });
    }
}

export default processPdf;
