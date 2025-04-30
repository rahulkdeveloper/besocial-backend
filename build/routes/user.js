"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const user_1 = require("../controller/user");
const auth_1 = require("../middleware/auth");
router.get("/list", auth_1.isLoggedIn, user_1.userList);
router.get("/view-profile/:id", auth_1.isLoggedIn, user_1.viewUserProfile);
router.get("/profile/", auth_1.isLoggedIn, user_1.userProfile);
exports.default = router;
