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
exports.validateUser = exports.checkUsersBlockedEachOther = exports.fetchUser = exports.createUserSetting = exports.updateSocketId = exports.modifiyUserDataBasedOnSettings = exports.fileModelFieldSelection = exports.userFieldSelectionModel = exports.userFieldSelectionContactModel = exports.userFieldSelection = void 0;
const user_1 = __importDefault(require("../model/user"));
const utils_1 = require("../helper/utils");
const UserSettings_1 = __importDefault(require("src/model/UserSettings"));
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
    profileImage: "$profileImage.url",
    age: {
        $floor: {
            $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                1000 * 60 * 60 * 24 * 365.25
            ]
        }
    },
    // userContacts:1
};
exports.userFieldSelectionContactModel = {
    _id: 1,
    fullName: 1,
    username: 1,
    email: 1,
    status: 1,
};
exports.userFieldSelectionModel = {
    _id: 1,
    fullName: 1,
    username: 1,
    email: 1,
    bio: 1,
    status: 1,
    lastSeen: 1
};
exports.fileModelFieldSelection = {
    _id: 1,
    url: 1,
    path: 1,
    name: 1
};
const modifiyUserDataBasedOnSettings = (userData, userProfileSettings) => {
    if (!userProfileSettings.isOnlineShow) {
        delete userData.isOnlineShow;
    }
    if (!userProfileSettings.isProfileImageShow) {
        delete userData.profileImage;
    }
    return userData;
};
exports.modifiyUserDataBasedOnSettings = modifiyUserDataBasedOnSettings;
const updateSocketId = (token_1, ...args_1) => __awaiter(void 0, [token_1, ...args_1], void 0, function* (token, socketId = '', status, lastSeen) {
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
        let updateData = {
            socketId
        };
        if (status) {
            updateData.status = status;
        }
        if (lastSeen) {
            updateData.lastSeen = lastSeen;
        }
        yield user_1.default.findOneAndUpdate({ _id: user._id }, updateData);
        return true;
    }
    catch (error) {
        console.log("error in update user serivce fn::", error);
        return false;
    }
});
exports.updateSocketId = updateSocketId;
const createUserSetting = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let userSettingObj = Object.assign({ user: userId }, data);
        const userSetting = yield UserSettings_1.default.create(userSettingObj);
        if (userSetting) {
            return userSetting;
        }
        else {
            return {};
        }
    }
    catch (error) {
        console.log("error in update createUserSetting serivce fn::", error);
        return {};
    }
});
exports.createUserSetting = createUserSetting;
const fetchUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findOne({ _id: userId }).populate([
            {
                path: "profileImage",
                select: exports.fileModelFieldSelection
            },
            {
                path: "blockedUsers",
                select: {
                    _id: 1,
                    email: 1,
                    username: 1,
                    fullName: 1,
                }
            }
        ]).lean();
        return user;
    }
    catch (error) {
        console.log("error in fetchUser service func", error);
        return null;
    }
});
exports.fetchUser = fetchUser;
const checkUsersBlockedEachOther = (senderDetail, receiverDetail, currentUserId, chatroom) => {
    var _a;
    let returnMessage = { error: false, message: '', statusCode: 200, blockedByMe: false };
    if (chatroom && ((_a = chatroom.blockStatus) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        const isBlocked = chatroom.blockStatus.some((item) => item.userId._id.toString() === currentUserId.toString());
        if (isBlocked) {
            return { error: true, message: 'You have blocked this user!', statusCode: 403, blockedByMe: true };
        }
        else {
            return { error: true, message: 'Receiver has been blocked you!', statusCode: 403, blockedByMe: false };
        }
    }
    if (senderDetail && (senderDetail === null || senderDetail === void 0 ? void 0 : senderDetail.blockedUsers.length) > 0) {
        let isBlocked = senderDetail.blockedUsers.some((user) => user._id.toString() === receiverDetail._id.toString());
        if (isBlocked) {
            returnMessage = { error: true, message: 'You have blocked this user!', statusCode: 403, blockedByMe: true };
        }
    }
    if (receiverDetail && (receiverDetail === null || receiverDetail === void 0 ? void 0 : receiverDetail.blockedUsers.length) > 0) {
        let isBlocked = receiverDetail.blockedUsers.some((user) => user._id.toString() === currentUserId.toString());
        if (isBlocked) {
            returnMessage = { error: true, message: 'Receiver has been blocked you!', statusCode: 403, blockedByMe: false };
        }
    }
    return returnMessage;
};
exports.checkUsersBlockedEachOther = checkUsersBlockedEachOther;
const validateUser = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!token) {
            return null;
        }
        let decode = yield (0, utils_1.verifyJwtToken)(token);
        if (!decode)
            return null;
        const user = yield user_1.default.findOne({ _id: decode._id }).lean();
        return user;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unkown error occured");
    }
});
exports.validateUser = validateUser;
