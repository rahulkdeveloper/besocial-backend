import express from "express";
const router = express.Router();
import {sendMessage,chatroomById,allChatrooms,deleteMessage,editMessage,updateChatRoom} from "../controller/chat";
import {isLoggedIn} from "../middleware/auth"

router.post("/:id/send",isLoggedIn,sendMessage);
router.put("/:id",isLoggedIn,updateChatRoom);
router.get("/:id",isLoggedIn,chatroomById);
router.get("/",isLoggedIn,allChatrooms);
router.delete("/:id/message/:messageId",isLoggedIn,deleteMessage);
router.put("/:id/message/:messageId",isLoggedIn,editMessage);

export default router;