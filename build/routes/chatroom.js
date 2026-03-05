"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const chat_1 = require("../controller/chat");
const auth_1 = require("../middleware/auth");
router.post("/:id/send", auth_1.isLoggedIn, chat_1.sendMessage);
router.put("/:id", auth_1.isLoggedIn, chat_1.updateChatRoom);
router.get("/:id", auth_1.isLoggedIn, chat_1.chatroomById);
router.get("/", auth_1.isLoggedIn, chat_1.allChatrooms);
router.delete("/:id/message/:messageId", auth_1.isLoggedIn, chat_1.deleteMessage);
router.put("/:id/message/:messageId", auth_1.isLoggedIn, chat_1.editMessage);
exports.default = router;
