// import required packages
import dotenv from "dotenv"
dotenv.config()

import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import processPdf from "./controller/processPdf.js";

// express init
const expApp = express();

expApp.use(express.json());

// List of allowed origins
// const allowedOrigins: string[] = [
//     process.env.ALLOWED_ORIGIN || "", // fallback to empty string just in case
// ];

// // CORS options
// const corsOptions: CorsOptions = {
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     methods: ["POST", "GET"],
//     optionsSuccessStatus: 200,
// };

// expApp.use(cors(corsOptions));

expApp.use(cors())

// Routes
expApp.get("/", (req: Request, res: Response) => res.status(200).send("OK"));

expApp.post("/api/pdf/send", processPdf);


// 404 Handler
expApp.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send("Not found");
});

// Error Handler
expApp.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.message);
    res.status(500).send("Internal server error");
});

expApp.listen(5000, () => console.log("Server running on port 5000"));

// If you're using this in another file, export it
export default expApp;
