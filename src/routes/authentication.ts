import express from "express";
const router = express.Router();
import {signUp,login,forgotPassword,resetPassword} from "../controller/authentication"

router.post("/signup",signUp);
router.post("/login",login);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password",resetPassword);

export default router;