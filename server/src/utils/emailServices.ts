import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

interface SendEmailParams {
    pdfPath: string; // This is a folder path
    recipientEmail: string;
    autoCardUrl: string
}

const sendEmail = async ({ pdfPath, recipientEmail, autoCardUrl }: SendEmailParams): Promise<void> => {
    // Ensure folder exists
    if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF folder does not exist: ${pdfPath}`);
    }

    // Find PDFs
    const files = fs.readdirSync(pdfPath).filter(file => file.endsWith(".pdf"));
    if (files.length === 0) {
        throw new Error("No PDF files found to send");
    }

    // Build attachments
    const attachments = files.map(file => ({
        filename: file,
        path: path.join(pdfPath, file),
    }));

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SENDING_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    // Mail options
    const mailOptions = {
        from: process.env.SENDING_EMAIL,
        to: recipientEmail,
        subject: "Your PDFs from FormCast 📄📬",
        html: autoCardUrl
            ? `<p>Yo! Attached are your processed PDFs.</p>
       <p>Also, <a href="${autoCardUrl}">click here to get your AutoCAD file</a>.</p>`
            : `<p>Yo! Attached are your processed PDFs.</p>`,
        attachments,
    };


    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${recipientEmail} with ${attachments.length} PDF(s)`);
    } catch (err) {
        throw new Error(`Failed to send email to ${recipientEmail}: ${(err as Error).message}`);
    }
};

export default sendEmail;
