import express from "express";
const router = express.Router();
import {createGroup,addMembers,groupChatById,sendMessage,updateChatRoom,favouriteAndUnFavourite,clearMessage,deleteGroupByMember} from "../controller/group";
import {isLoggedIn} from "../middleware/auth"

router.post("/create",isLoggedIn,createGroup);
router.put("/add-members/:id",isLoggedIn,addMembers);
router.get("/:id",isLoggedIn,groupChatById);
router.post("/send-message/:id",isLoggedIn,sendMessage);
router.put("/:id",isLoggedIn,updateChatRoom);
router.put("/favourite/unfavourite/:id",isLoggedIn,favouriteAndUnFavourite);
router.put("/:id/clear",isLoggedIn,clearMessage);
router.put("/:id/remove",isLoggedIn,deleteGroupByMember)

export default router;