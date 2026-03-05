"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("cloudinary"));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});
// const storage = multer.diskStorage({
//     destination:(req,res,cb)=>{
//         cb(null,'uploads/')
//     },
//     filename:(req,file,cb)=>{
//         const ext = path.extname(file.originalname);
//         const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`; 
//         cb(null,filename)
//     }
// })
// const upload = multer({
//     storage,
//     limits:{fileSize:100*1024*1024}
// })
const upload = (0, multer_1.default)({ dest: 'uploads/' });
exports.default = upload;
