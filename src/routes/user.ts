import express from "express";
const router = express.Router();
import {userList,userProfile,viewUserProfile,updateProfile,updateProfileSetting} from "../controller/user";
import {isLoggedIn} from "../middleware/auth"

router.get("/list",isLoggedIn,userList);
router.get("/view-profile/:id",isLoggedIn,viewUserProfile);
router.get("/profile/",isLoggedIn,userProfile);
router.put("/profile/update",isLoggedIn,updateProfile);
router.put("/profile/settings",isLoggedIn,updateProfileSetting);

export default router;