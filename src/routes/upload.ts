import express from "express";
const router = express.Router();
import {uploadSingleFile,uploadMultipleeFiles} from "../controller/upload";
import {isLoggedIn} from "../middleware/auth";
import multer from "../middleware/fileUpload"

router.post("/single",isLoggedIn,multer.single("file"),uploadSingleFile);
router.post("/multiple",isLoggedIn, multer.array('files',10),uploadMultipleeFiles);


export default router;