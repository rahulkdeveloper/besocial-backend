import multer from "multer";
import path from "path";
import cloudinary from 'cloudinary';
import fs from "fs";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
})


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

const upload = multer({ dest: 'uploads/' });

export default upload;