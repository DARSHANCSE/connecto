import { PrismaClient } from '@prisma/client';

const prismaclient = new PrismaClient();
console.log(process.env.DATABASE_URL);
export default prismaclient;