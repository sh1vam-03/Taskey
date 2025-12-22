import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./config/db.js";


dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log("✅ Database connected");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.log("❌ Database connection error", error);
        process.exit(1);
    }
}

startServer();
