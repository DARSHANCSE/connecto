
import { Request, Response } from 'express';
import prismaclient from 'prisma-client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';




export const loginHandler = async (req: Request, res: any) => {
    const {username,password} = req.body;
    const Userdata: any = await prismaclient.user.findFirst({
        where: {
            username: username,
        }
    })

    if (Userdata) {
        if (await bcrypt.compare(password, Userdata.password) ) {
            const secret= process.env.jwt_secret;
            if (!secret) {
                return res.status(500).json({ message: "Server error: JWT secret not set" });
            }
            const token = jwt.sign({ id: Userdata.id, username: Userdata.username }, secret, { expiresIn: '1h' });
            res.status(200).json({ message: "Login successful", token: token });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } else {
        res.status(401).json({ message: "User not found" });
    }
    
};


export const registerHandler = async (req: Request, res: any) => {
    const { username, password } = req.body;


    const existingUser = await prismaclient.user.findFirst({
        where: {
            username: username,
        }
    });

    if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
    }
    const salt= await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prismaclient.user.create({
        data: {
            username: username,
            password: hashedPassword,
        }
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
}


export const getGroupsHandler = async (req: Request, res: any) => {
    console.log("getGroupsHandler called");
    const userId = req.params.userId;
    console.log("Fetching groups for user:", userId);

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const groups = await prismaclient.group.findMany({
            where: {
                memberships:{
                    some: {
                        userId: userId,
                    }
                }
            }
        });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const createGroupsHandler = async (req: Request, res: any) => {
    const { name, userIds } = req.body;

    if (!name || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Group name and user IDs are required" });
    }

    if (userIds.some((id) => !id)) {
        return res.status(400).json({ message: "All user IDs must be valid" });
    }

    try {
        const newGroup = await prismaclient.group.create({
            data: {
                name: name,
                memberships: {
                    create: userIds.map((userId: string) => ({
                        userId,
                    })),
                },
            },
            include: {
                memberships: {
                    include: { user: true }, 
                },
            },
        });

        return res.status(201).json(newGroup);
    } catch (error) {
        console.error("Error creating group:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



export const getMessagesHandler = async (req: Request, res: any) => {
    const groupId = req.params.groupId;

    if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
    }

    try {
        console.log("Fetching messages for group:", groupId);
        const messages = await prismaclient.message.findMany({
            where: {
                toGroupId: parseInt(groupId),
            },
            include: {
                from: true
            },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getuserhandler = async (req: Request, res: any) => {  
    try {
        const users = await prismaclient.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
