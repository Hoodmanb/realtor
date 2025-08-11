import { Request, Response } from "express";
import path from "path"
import crypto from "crypto";
import { modifyMultiplePdfs } from "../utils/modifyPdf.js";
import sendEmail from "../utils/emailServices.js";
import fs from "fs/promises";
import fsSync from "fs";
import { fileURLToPath } from "url";
import downloadMultiplePDFs from "../utils/downloadPdf.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.ENV

async function processPdf(req: Request, res: Response) {
    const { urls, email, clientName, plotNumber, cadZone, district
    } = req.body;

    console.log(clientName)

    const cloudinaryUrls = urls
    const recipientEmail = email
    const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '/');

    console.log("Received request body:", req.body);

    if (!cloudinaryUrls || !recipientEmail) {
        console.warn("Missing required fields:", { cloudinaryUrls, recipientEmail });
        return res.status(400).json({ error: "Missing required fields" });
    }

    const baseDir = env !== "production" ? path.join(__dirname, "..", "files") : path.join('/tmp', 'files');

    const randomStringForBasePath = crypto.randomBytes(16).toString("hex");
    const randomStringForSavedPath = crypto.randomBytes(16).toString("hex");

    const baseFolderPath = path.join(baseDir, randomStringForBasePath);
    const savedFolderPath = path.join(baseDir, randomStringForSavedPath);

    // const basePath = path.join(baseFolderPath, "base.pdf");
    // const savedPath = path.join(savedFolderPath, "saved.pdf");

    console.log("Generated paths:");
    console.log({ baseFolderPath, savedFolderPath });

    try {
        // Ensure folders exist
        if (!fsSync.existsSync(baseFolderPath)) {
            console.log("Creating base folder path:", baseFolderPath);
            await fs.mkdir(baseFolderPath, { recursive: true });
        } else {
            console.log("Base folder path already exists:", baseFolderPath);
        }

        if (!fsSync.existsSync(savedFolderPath)) {
            console.log("Creating saved folder path:", savedFolderPath);
            await fs.mkdir(savedFolderPath, { recursive: true });
        } else {
            console.log("Saved folder path already exists:", savedFolderPath);
        }

        console.log("Starting downloadPDF...");
        await downloadMultiplePDFs({ cloudinaryUrls, baseFolderPath });
        console.log("PDF downloaded to:", baseFolderPath);

        console.log("Starting modifyPdf...");
        await modifyMultiplePdfs(baseFolderPath, savedFolderPath,
            clientName, date, plotNumber, cadZone, district); // Make sure `data` is defined somewhere
        console.log("PDF modified and saved to:", savedFolderPath);

        console.log("Sending email...");
        await sendEmail({ pdfPath: savedFolderPath, recipientEmail });
        console.log("Email sent to:", recipientEmail);

        // Uncomment below if you want to auto-clean
        console.log("Cleaning up temp folders...");
        await fs.rm(baseFolderPath, { recursive: true, force: true });
        await fs.rm(savedFolderPath, { recursive: true, force: true });
        console.log("Temporary folders cleaned up.");

        res.status(200).json({ message: "PDF processed and sent successfully!" });

    } catch (error) {
        console.error("PDF Processing Error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

export default processPdf