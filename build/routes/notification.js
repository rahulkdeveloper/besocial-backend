"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const notification_1 = require("../controller/notification");
const auth_1 = require("../middleware/auth");
router.get("/list", auth_1.isLoggedIn, notification_1.list);
exports.default = router;
