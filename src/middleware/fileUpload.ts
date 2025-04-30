import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination:(req,res,cb)=>{
        cb(null,'uploads/')
    },
    filename:(req,file,cb)=>{
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`; 
        cb(null,filename)
    }
})

const upload = multer({
    storage,
    limits:{fileSize:100*1024*1024}
})

export default upload;