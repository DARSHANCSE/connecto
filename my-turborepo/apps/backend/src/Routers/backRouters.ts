import { Router } from "express";
import { createGroupsHandler, getGroupsHandler, getMessagesHandler, loginHandler, registerHandler } from "../Components/handlers";
const backrouter = Router();

backrouter.post("/login", loginHandler);
backrouter.post("/register", registerHandler);
backrouter.get("/getgroups/:userId", getGroupsHandler);
backrouter.post("/creategroups", createGroupsHandler);
backrouter.get("/getmessages/:groupId", getMessagesHandler);

export { backrouter };