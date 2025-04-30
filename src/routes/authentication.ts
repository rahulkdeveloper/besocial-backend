import express from "express";
const router = express.Router();
import {signUp,login,forgotPassword,resetPassword} from "../controller/authentication";
import {signupSchema} from "../validator/user.validate";
import {validate} from '../middleware/validate'

router.post("/signup",validate(signupSchema),signUp);
router.post("/login",login);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password",resetPassword);

export default router;