import express from "express";
const router = express.Router();
import {createGroup} from "../controller/group";
import {isLoggedIn} from "../middleware/auth"

router.post("/create",isLoggedIn,createGroup);
export default router;