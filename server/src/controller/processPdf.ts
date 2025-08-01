import { Request, Response } from "express";
import downloadPDF from "../utils/downloadPdf.js";
import path from "path"
import crypto from "crypto";
import { TableItem } from "../types";
import { modifyPdf } from "../utils/modifyPdf.js";
import sendEmail from "../utils/emailServices.js";
import fs from "fs/promises";
import fsSync from "fs";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processPdf(req: Request, res: Response) {
    const { cloudinaryUrl, recipientEmail } = req.body;
    console.log("Received request body:", req.body);

    if (!cloudinaryUrl || !recipientEmail) {
        console.warn("Missing required fields:", { cloudinaryUrl, recipientEmail });
        return res.status(400).json({ error: "Missing required fields" });
    }

    const baseDir = path.join(__dirname, "..", "files");
    const randomStringForBasePath = crypto.randomBytes(16).toString("hex");
    const randomStringForSavedPath = crypto.randomBytes(16).toString("hex");

    const baseFolderPath = path.join(baseDir, randomStringForBasePath);
    const savedFolderPath = path.join(baseDir, randomStringForSavedPath);

    const basePath = path.join(baseFolderPath, "base.pdf");
    const savedPath = path.join(savedFolderPath, "saved.pdf");

    console.log("Generated paths:");
    console.log({ baseFolderPath, savedFolderPath, basePath, savedPath });

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
        await downloadPDF({ cloudinaryUrl, basePath });
        console.log("PDF downloaded to:", basePath);

        console.log("Starting modifyPdf...");
        await modifyPdf(basePath, savedPath, data); // Make sure `data` is defined somewhere
        console.log("PDF modified and saved to:", savedPath);

        console.log("Sending email...");
        await sendEmail({ pdfPath: savedPath, recipientEmail });
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




const data: TableItem[] = [
    {
        label: 'CLIENT:',
        content: 'AFRICEAN SADUL LIMITED',
        label_style: {
            font: 'Helvetica-Bold',
            fontSize: 6,
            color: '#FF0000', // red
        },
        content_style: {
            font: 'Helvetica-Bold',
            fontSize: 8,
            color: '#008000', // green
        },
        box_style: {
            background: '#FFFFFF',
            borderColor: '#000000',
            borderWidth: 0.5,
        },
    },
    {
        label: 'PROJECT:',
        content: 'PROPOSED RESIDENTIAL DEVELOPMENT @ PLOT 4033 APO E27',
        label_style: {
            font: 'Helvetica-Bold',
            fontSize: 6,
            color: '#FF0000',
        },
        content_style: {
            font: 'Helvetica-Bold',
            fontSize: 8,
            color: '#008000',
        },
        box_style: {
            background: '#FFFFFF',
            borderColor: '#000000',
            borderWidth: 0.5,
        },
    },
    {
        label: 'LOCATION',
        content: [
            'PROPOSED RESIDENTIAL DEVELOPMENT @ PLOT 4033 APO E27',
            'PROPOSED RESIDENTIAL DEVELOPMENT @ PLOT 4033 APO E27',
            'PROPOSED RESIDENTIAL DEVELOPMENT @ PLOT 4033 APO E27',
        ],
        label_style: {
            font: 'Helvetica',
            fontSize: 0,
            color: '#000000',
        },
        content_style: {
            font: 'Helvetica',
            fontSize: 5,
            color: '#000000',
        },
        box_style: {
            background: '#FFFFFF',
            borderColor: '#000000',
            borderWidth: 0.5,
        },
    },
    {
        label: 'DRAWING TITLE:',
        content: 'GROUND FLOOR',
        label_style: {
            font: 'Helvetica-Bold',
            fontSize: 6,
            color: '#FF0000',
        },
        content_style: {
            font: 'Helvetica-Bold',
            fontSize: 8,
            color: '#0000FF', // blue
        },
        box_style: {
            background: '#FFFFFF',
            borderColor: '#000000',
            borderWidth: 0.5,
        },
    },
    {
        label: '',
        content: [
            { label: 'DESIGN & DRAWN BY', value: 'CHRIS IZAHA' },
            { label: 'CHECKED BY', value: 'MICHEAL ABAH ELIAS' },
            { label: 'SCALE:', value: '1:100' },
            { label: 'DATE:', value: 'MARCH 23' },
        ],
        label_style: {
            font: 'Helvetica-Bold',
            fontSize: 4,
            color: '#000000',
        },
        content_style: {
            font: 'Helvetica-Bold',
            fontSize: 6,
            color: '#000000',
        },
        box_style: {
            background: '#FFFFFF',
            borderColor: '#000000',
            borderWidth: 0.5,
        },
    },
    {
        label: 'WORKING DRAWINGS',
        content: 'SWD/03',
        label_style: {
            font: 'Helvetica-Bold',
            fontSize: 6,
            color: '#000000',
        },
        content_style: {
            font: 'Helvetica',
            fontSize: 8,
            color: '#FF0000',
        },
        box_style: {
            background: '#FFFFFF',
            borderColor: '#000000',
            borderWidth: 0.5,
        },
    },
];


export default processPdf