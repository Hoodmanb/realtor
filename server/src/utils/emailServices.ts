import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { TransportOptions } from "nodemailer";

interface SendEmailParams {
    pdfPath: string; // This is now a folder path
    recipientEmail: string;
}

const sendEmail = async ({ pdfPath, recipientEmail }: SendEmailParams): Promise<void> => {
    try {
        // Read all files in the folder and filter only .pdf
        const files = fs.readdirSync(pdfPath).filter(file => file.endsWith(".pdf"));

        if (files.length === 0) {
            console.warn("⚠️ No PDF files found in the directory.");
            return;
        }

        // Map files to attachment format
        const attachments = files.map(file => ({
            filename: file,
            path: path.join(pdfPath, file),
        }));

        // const transporter = nodemailer.createTransport({
        //     host: "smtp.gmail.com",
        //     port: 465,
        //     secure: true,
        //     auth: {
        //         user: process.env.SENDING_EMAIL,
        //         pass: process.env.GMAIL_APP_PASSWORD,
        //     },
        // } as TransportOptions);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SENDING_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });


        const mailOptions = {
            from: process.env.SENDING_EMAIL,
            to: recipientEmail,
            subject: "Your PDFs are ready 📄📬",
            html: "<p>Yo! Attached are your processed PDFs.</p>",
            attachments,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${recipientEmail} with ${attachments.length} PDF(s)`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`❌ Error sending to ${recipientEmail}: ${error.message}`);
            throw error;
        } else {
            console.error("❌ An unknown error occurred while sending email.");
            throw new Error("Unknown error while sending email");
        }
    }
};

export default sendEmail;
