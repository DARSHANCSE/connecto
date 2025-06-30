import { Router } from "express";
import { createGroupsHandler, getGroupsHandler, getMessagesHandler, getuserhandler, loginHandler, registerHandler } from "../Components/handlers";
const backrouter = Router();

backrouter.post("/login", loginHandler);
backrouter.post("/register", registerHandler);
backrouter.get("/getgroups/:userId", getGroupsHandler);
backrouter.post("/creategroup", createGroupsHandler);
backrouter.get("/getmessages/:groupId", getMessagesHandler);
backrouter.get("/getusers", getuserhandler);
export { backrouter };