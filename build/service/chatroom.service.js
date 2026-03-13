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
exports.fetchChatRoom = void 0;
const Room_1 = __importDefault(require("src/model/Room"));
const user_serivce_1 = require("./user.serivce");
const fetchChatRoom = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("insdie the fetchChatRoom", id, userId);
    try {
        let chatroom = yield Room_1.default.findOne({ _id: id, participants: userId })
            .populate([
            {
                path: "participants",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
                path: "blockStatus.userId",
                select: user_serivce_1.userFieldSelectionModel
            },
            {
                path: "blockStatus.blockedUserId",
                select: user_serivce_1.userFieldSelectionModel
            },
            {
                path: 'messageClearStatus.userId',
                select: user_serivce_1.userFieldSelectionModel
            }
        ]).lean();
        if (chatroom && userId) {
            chatroom === null || chatroom === void 0 ? void 0 : chatroom.participants.map((participant) => {
                if (participant._id.toString() === userId.toString()) {
                    chatroom.sender = participant;
                }
                else {
                    chatroom.receiver = participant;
                }
            });
        }
        return chatroom;
    }
    catch (error) {
        console.log("error in fetchChatRoom service func", error);
        return null;
    }
});
exports.fetchChatRoom = fetchChatRoom;
