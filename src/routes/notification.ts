import express from "express";
const router = express.Router();
import {list} from "../controller/notification";
import {isLoggedIn} from "../middleware/auth"

router.get("/list",isLoggedIn,list);


export default router;