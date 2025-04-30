import express from "express";
const router = express.Router();
import {addInContact,updateContactRequest,listContactRequest,myFriends} from "../controller/contact";
import {isLoggedIn} from "../middleware/auth"

router.post("/send-request",isLoggedIn,addInContact);
router.put("/update/request",isLoggedIn,updateContactRequest);
router.get("/list",isLoggedIn,listContactRequest);
router.get("/freinds",isLoggedIn,myFriends);

export default router;