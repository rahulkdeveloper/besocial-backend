"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const authentication_1 = require("../controller/authentication");
const user_validate_1 = require("../validator/user.validate");
const validate_1 = require("../middleware/validate");
router.post("/signup", (0, validate_1.validate)(user_validate_1.signupSchema), authentication_1.signUp);
router.post("/login", authentication_1.login);
router.post("/forgot-password", authentication_1.forgotPassword);
router.post("/reset-password", authentication_1.resetPassword);
exports.default = router;
