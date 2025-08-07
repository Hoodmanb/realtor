import nodemailer from "nodemailer";
import { TransportOptions } from "nodemailer";

interface SendEmailParams {
    pdfPath: string;
    recipientEmail: string; 
}
const sendEmail = async ({ pdfPath, recipientEmail }: SendEmailParams): Promise<void> => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.SENDING_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        } as TransportOptions);

        const mailOptions = {
            from: process.env.SENDING_EMAIL,
            to: recipientEmail,
            subject: "Modified PDF with Table",
            html: "Here is the modified PDF with the added table.",
            attachments: [
                {
                    filename: "modified.pdf",
                    path: pdfPath,
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${recipientEmail}`);
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
