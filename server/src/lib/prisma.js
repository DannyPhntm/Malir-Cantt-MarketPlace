import { PrismaClient } from '@prisma/client';

// Single shared client across the app (avoids exhausting connections on reload).
const prisma = new PrismaClient();

export default prisma;
