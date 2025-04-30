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
exports.updateSocketId = exports.userFieldSelection = void 0;
const user_1 = __importDefault(require("../model/user"));
const utils_1 = require("../helper/utils");
exports.userFieldSelection = {
    _id: 1,
    fullName: 1,
    username: 1,
    email: 1,
    dateOfBirth: 1,
    phone: 1,
    gender: 1,
    bio: 1,
    status: 1,
    age: {
        $floor: {
            $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                1000 * 60 * 60 * 24 * 365.25
            ]
        }
    }
};
const updateSocketId = (token_1, ...args_1) => __awaiter(void 0, [token_1, ...args_1], void 0, function* (token, socketId = '') {
    try {
        let decode = yield (0, utils_1.verifyJwtToken)(token);
        console.log("decode::", decode);
        if (!decode) {
            return false;
        }
        const user = yield user_1.default.findOne({ _id: decode._id }).lean();
        if (!user) {
            return false;
        }
        yield user_1.default.findOneAndUpdate({ _id: user._id }, { socketId });
        return true;
    }
    catch (error) {
        console.log("error in update user serivce fn::", error);
        return false;
    }
});
exports.updateSocketId = updateSocketId;
