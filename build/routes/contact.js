"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const contact_1 = require("../controller/contact");
const auth_1 = require("../middleware/auth");
router.post("/send-request", auth_1.isLoggedIn, contact_1.addInContact);
router.put("/update/request", auth_1.isLoggedIn, contact_1.updateContactRequest);
router.get("/list", auth_1.isLoggedIn, contact_1.listContactRequest);
exports.default = router;
