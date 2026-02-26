"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const group_1 = require("../controller/group");
const auth_1 = require("../middleware/auth");
router.post("/create", auth_1.isLoggedIn, group_1.createGroup);
router.put("/add-members/:id", auth_1.isLoggedIn, group_1.addMembers);
router.get("/:id", auth_1.isLoggedIn, group_1.groupChatById);
router.post("/send-message/:id", auth_1.isLoggedIn, group_1.sendMessage);
router.put("/:id", auth_1.isLoggedIn, group_1.updateChatRoom);
router.put("/favourite/unfavourite/:id", auth_1.isLoggedIn, group_1.favouriteAndUnFavourite);
router.put("/:id/clear", auth_1.isLoggedIn, group_1.clearMessage);
router.put("/:id/remove", auth_1.isLoggedIn, group_1.deleteGroupByMember);
exports.default = router;
