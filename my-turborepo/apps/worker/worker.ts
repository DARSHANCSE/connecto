import prismaclient from "prisma-client";
import redis from "redis-client";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.DATABASE_URL);
const processMessage = async (message: any) => {
    console.log("Processing message:", "eeee",message.fromId, message.toGrouprId, message.content);

    await prismaclient.message.create({
        data: {
            content: message.content,
            fromId: message.fromId,
            toGroupId: message.toGroupId,
        }
    });
}

const workerfunc = async () => {
    while (true){
        try{
            const res = await redis.blpop("messagequeue", 0);
            const raw = res?.[1];
            if (raw) {
                const message = JSON.parse(raw);
                await processMessage(message);
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    }
}

workerfunc()
    





