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
exports.singleGroupDetail = void 0;
const GroupChat_1 = __importDefault(require("src/model/GroupChat"));
const user_serivce_1 = require("./user.serivce");
const singleGroupDetail = (groupId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const group = yield GroupChat_1.default.findOne({
            _id: groupId,
            participants: userId
        })
            .populate([
            {
                path: "admin",
                select: user_serivce_1.userFieldSelectionModel
            },
            {
                path: "participants",
                select: Object.assign(Object.assign({}, user_serivce_1.userFieldSelectionModel), { socketId: 1 })
            },
            {
                path: "groupImage",
                select: user_serivce_1.fileModelFieldSelection
            }
        ]);
        return group;
    }
    catch (error) {
        console.log("error in singleGroupDetail serivce fn::", error);
        return false;
    }
});
exports.singleGroupDetail = singleGroupDetail;
