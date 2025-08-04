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
// force deployment
const env = process.env.ENV

interface DynamicDataProp {
    clientName: string,
    project: string,
    planLayout: string,
    location: string,
    designerName: string,
    checkedBy: string,
    scale: string,
    date: string,
    developer: string,
    sheetNumber: string
}

async function processPdf(req: Request, res: Response) {
    const { url, email, clientName, project, planLayout,
        location, designerName, checkedBy, scale, date, developer, sheetNumber
    } = req.body;

    const cloudinaryUrl = url
    const recipientEmail = email

    console.log("Received request body:", req.body);

    if (!cloudinaryUrl || !recipientEmail) {
        console.warn("Missing required fields:", { cloudinaryUrl, recipientEmail });
        return res.status(400).json({ error: "Missing required fields" });
    }

    const baseDir = env !== "production" ? path.join(__dirname, "..", "files") : path.join('/tmp', 'files');

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
        await modifyPdf(basePath, savedPath,
            data({
                clientName, project, planLayout,
                location, designerName, checkedBy, scale, date, developer, sheetNumber
            })); // Make sure `data` is defined somewhere
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



const data = ({ clientName, project, planLayout,
    location, designerName, checkedBy, scale, date, developer, sheetNumber }: DynamicDataProp) => {
    return [
        {
            label: 'CLIENT:',
            content: clientName,
            label_style: {
                font: 'Helvetica-Bold',
                fontSize: 6,
                color: '#FF0000', // red
            },
            content_style: {
                font: 'Helvetica-Bold',
                fontSize: 10,
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
            content: project,
            label_style: {
                font: 'Helvetica-Bold',
                fontSize: 6,
                color: '#FF0000',
            },
            content_style: {
                font: 'Helvetica-Bold',
                fontSize: 10,
                color: '#008000',
            },
            box_style: {
                background: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 0.5,
            },
        },
        {
            label: 'NOTES',
            content: [
                'ALL DIMENSIONS ARE IN MILLIMETERS (MM)',
                'ALL FIGURED DIMENSIONS ARE TO BE READ AS WRITTEN AND NOT SCALED.',
                'THIS DRAWING SHOULD BE READ IN CONJUNCTION WITH ALL OTHER DRAWINGS SUPPLIED FOR THE EXECUTION OF THE WORKS DESCRIBED IN THESE DRAWINGS.',
                'ARCHITECTS ARE TO BE NOTIFIED OF ANY DISCREPANCIES BETWEEN THIS DRAWING AND OTHERS INCLUDING THOSE ISSUED BY CONSULTANT'
            ],
            label_style: {
                font: 'Helvetica',
                fontSize: 8,
                color: '#0000FF',
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
            label: '',
            content: [
                { label: 'Plan Layout:', value: planLayout },
                { label: 'Location:', value: location },
            ],
            label_style: {
                font: 'Helvetica-Bold',
                fontSize: 6,
                color: '#FF0000',
            },
            content_style: {
                font: 'Helvetica-Bold',
                fontSize: 10,
                color: '#000000', // blue
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
                { label: 'DESIGN & DRAWN BY:', value: designerName },
                { label: 'CHECKED BY:', value: checkedBy },
                { label: 'SCALE:', value: scale },
                { label: 'DATE:', value: date },
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
            label: '',
            content: [
                { label: 'Developer:', value: developer },
                { label: 'Sheet Number:', value: sheetNumber },
            ],
            label_style: {
                font: 'Helvetica-Bold',
                fontSize: 6,
                color: '#FF0000',
            },
            content_style: {
                font: 'Helvetica',
                fontSize: 10,
                color: '#FF0000',
            },
            box_style: {
                background: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 0.5,
            },
        },
    ];
}

export default processPdf