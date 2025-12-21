import { prisma } from "../utils/prisma";
import AppError from "../utils/appError";

export const createContactUs = async ({ name, email, subject, message }) => {
    try {
        const contactUs = await prisma.contactUs.create({
            data: {
                name,
                email,
                subject,
                message
            }
        });
        return {
            name: contactUs.name,
            subject: contactUs.subject,
        };
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};