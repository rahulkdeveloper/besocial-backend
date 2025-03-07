"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnection = () => {
    const url = process.env.MONGODB_URI;
    mongoose_1.default.connect(url)
        .then(() => console.log("mongodb connected..."))
        .catch((err) => console.log("Error in connected db", err));
};
exports.default = dbConnection;
