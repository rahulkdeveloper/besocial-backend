"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const upload_1 = require("../controller/upload");
const auth_1 = require("../middleware/auth");
const fileUpload_1 = __importDefault(require("../middleware/fileUpload"));
router.post("/single", auth_1.isLoggedIn, fileUpload_1.default.single("file"), upload_1.uploadSingleFile);
router.post("/multiple", auth_1.isLoggedIn, fileUpload_1.default.array('files', 10), upload_1.uploadMultipleeFiles);
exports.default = router;
