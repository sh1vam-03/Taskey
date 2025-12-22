import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";


export const createContactUs = async ({ name, email, subject, message }) => {
    try {
        if (!name || !email || !subject || !message) {
            throw new ApiError(400, "All fields are required");
        }

        const contact = await prisma.contactUs.create({
            data: {
                name,
                email,
                subject,
                message,
            },
        });

        return contact;
    } catch (error) {
        console.error("❌ ContactUs Service Error:", error);

        if (error instanceof ApiError) {
            throw error; // rethrow known error
        }

        throw new ApiError(500, "Failed to submit contact form");
    }
};
