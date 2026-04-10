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
exports.messageDetail = exports.messageFieldSelection = void 0;
const Message_1 = __importDefault(require("../model/Message"));
const user_serivce_1 = require("./user.serivce");
exports.messageFieldSelection = {
    _id: 1,
    content: 1,
    type: 1,
    seen: 1,
    isDeleted: 1,
    createdAt: 1
};
const messageDetail = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = yield Message_1.default.findById(id)
            .populate("sender", "_id fullName email")
            .populate("receiver", "_id fullName email")
            .populate({
            path: 'file',
            select: {
                _id: 1,
                name: 1,
                url: 1,
                path: 1,
                mimeType: 1
            }
        })
            .populate({
            path: 'seenBy',
            select: user_serivce_1.userFieldSelectionModel
        })
            .populate({
            path: "replyTo",
            select: {
                _id: 1,
                sender: 1,
                receiver: 1,
                content: 1,
                fileText: 1
            },
            populate: {
                path: "sender",
                select: user_serivce_1.userFieldSelectionModel
            }
        });
        return message;
    }
    catch (error) {
        console.log("error in messageDetail service func", error);
        return null;
    }
});
exports.messageDetail = messageDetail;
