"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleeFiles = exports.uploadSingleFile = void 0;
const Media_1 = __importDefault(require("src/model/Media"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const fs_1 = __importDefault(require("fs"));
const uploadSingleFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user._id;
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }
        const file = req.file;
        const result = yield cloudinary_1.default.v2.uploader.upload(req.file.path, {
            folder: 'uploads',
        });
        let newMedia;
        if (result.secure_url) {
            newMedia = yield Media_1.default.create({
                user: currentUserId,
                name: file.originalname,
                filename: file.filename,
                path: file.path,
                url: result.secure_url,
                mimetype: file.mimetype,
                size: file.size,
                fileType: file.mimetype.split("/")[0],
                folderName: result.asset_folder,
                alt: "",
            });
            fs_1.default.unlinkSync(req.file.path);
        }
        else {
            newMedia = yield Media_1.default.create({
                user: currentUserId,
                name: file.originalname,
                filename: file.filename,
                path: file.path,
                url: file.path,
                mimetype: file.mimetype,
                size: file.size,
                fileType: file.mimetype.split("/")[0],
                folderName: file.destination,
                alt: "",
            });
        }
        return res.status(200).json({
            success: true,
            message: "file uploaded!",
            data: newMedia
        });
    }
    catch (error) {
        console.log("error in user uploadSingleFile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.uploadSingleFile = uploadSingleFile;
const uploadMultipleeFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user._id;
        if (req.files.length === 0) {
            return res.status(400).send({ message: 'No file uploaded' });
        }
        const files = req.files;
        const mediaData = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const newMedia = yield Media_1.default.create({
                user: currentUserId,
                name: file.originalname,
                filename: file.filename,
                path: file.path,
                url: file.path,
                mimetype: file.mimetype,
                size: file.size,
                fileType: file.mimetype.split("/")[0],
                folderName: file.destination,
                alt: "",
            });
            return newMedia;
        })));
        return res.status(200).json({
            success: true,
            message: "file uploaded!",
            data: mediaData
        });
    }
    catch (error) {
        console.log("error in user uploadMultipleeFiles controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.uploadMultipleeFiles = uploadMultipleeFiles;
