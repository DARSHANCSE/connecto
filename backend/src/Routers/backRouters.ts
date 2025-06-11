import { Router } from "express";
import { createGroupsHandler, getGroupsHandler, loginHandler, registerHandler } from "../Components/handlers";
const backrouter = Router();

//hello
backrouter.post("/login", loginHandler);
backrouter.post("/register", registerHandler);
backrouter.get("/getgroups/:userId", getGroupsHandler);
backrouter.post("/creategroups", createGroupsHandler);

export { backrouter };