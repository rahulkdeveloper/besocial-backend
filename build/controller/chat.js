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
exports.updateChatRoom = exports.editMessage = exports.deleteMessage = exports.allChatrooms = exports.chatroomById = exports.sendMessage = void 0;
const Room_1 = __importDefault(require("src/model/Room"));
const Message_1 = __importDefault(require("src/model/Message"));
const user_serivce_1 = require("../service/user.serivce");
const chatroom_service_1 = require("../service/chatroom.service");
const app_1 = require("../app");
const chatMessage_service_1 = require("../service/chatMessage.service");
const mongoose_1 = __importDefault(require("mongoose"));
const constant_1 = require("../config/constant");
const user_1 = __importDefault(require("src/model/user"));
const GroupChat_1 = __importDefault(require("src/model/GroupChat"));
const redis_1 = require("../config/redis");
const appError_1 = require("../errors/appError");
const IsProduction = process.env.NODE_ENV === 'production';
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const currentUserId = req.user._id;
    const { message = '', type = 'text', file, fileText = '', replyTo } = req.body;
    try {
        // find room details
        const chatroom = yield (0, chatroom_service_1.fetchChatRoom)(id, currentUserId);
        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: "Room not found!"
            });
        }
        const senderDetail = yield (0, user_serivce_1.fetchUser)(currentUserId);
        const receiverDetail = yield (0, user_serivce_1.fetchUser)((_a = chatroom === null || chatroom === void 0 ? void 0 : chatroom.receiver) === null || _a === void 0 ? void 0 : _a._id);
        if (!receiverDetail) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found!"
            });
        }
        let isBlocked = false;
        const { error, message: erroMessage, statusCode, blockedByMe } = (0, user_serivce_1.checkUsersBlockedEachOther)(senderDetail, receiverDetail, currentUserId, chatroom);
        if (error) {
            isBlocked = true;
        }
        if (error && blockedByMe) {
            return res.status(statusCode || 500).json({
                success: false,
                message: erroMessage || 'Some error has occured'
            });
        }
        if (["audio", "video", "image", "video", "file"].includes(type) && !file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded!"
            });
        }
        let messageData = {
            sender: currentUserId,
            receiver: receiverDetail._id,
            content: message,
            type: type,
            chatRoomId: chatroom._id,
            isBlocked: isBlocked
        };
        if (file) {
            messageData.file = file;
        }
        if (file && fileText) {
            messageData.fileText = fileText;
        }
        if (replyTo) {
            // check replyTo message exist...
            const replyToMessage = yield Message_1.default.findOne({ _id: replyTo }).lean();
            if (!replyToMessage) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Request!"
                });
            }
            messageData.replyTo = replyTo;
        }
        // create new message;
        let newMessage = yield Message_1.default.create(messageData);
        // check someone deleted his chatroom now active;
        if (chatroom.deletedBy.length > 0 && newMessage) {
            yield Room_1.default.findOneAndUpdate({ _id: chatroom._id }, { deletedBy: [] });
        }
        newMessage = yield (0, chatMessage_service_1.messageDetail)(newMessage._id);
        if (!newMessage) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured, Please try again!"
            });
        }
        if (!isBlocked) {
            // console.log("sending message socket=====", chatroom._id)
            app_1.io.to(chatroom._id.toString()).emit('message_received', {
                type: 'chat',
                room: chatroom._id,
                receiverId: receiverDetail._id,
                data: newMessage
            });
            // console.log("sending unread_messages===========>",receiverDetail._id.toString())
            // io.to(receiverDetail._id.toString()).emit('unread_messages', {
            //     type: 'chat',
            //     room: chatroom._id,
            //     receiverId: receiverDetail._id,
            //     data: newMessage,
            // })
        }
        return res.status(201).json({
            success: true,
            message: "Message send",
            data: {
                message: newMessage,
                chatroom: chatroom
            }
        });
    }
    catch (error) {
        console.error('Error in sendMessage controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.sendMessage = sendMessage;
const chatroomById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const redis = (0, redis_1.getRedisClient)();
    try {
        const currentUserId = req.user._id;
        let { limit = 10, page = 1 } = req.query;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        // find room details
        let chatroom = yield (0, chatroom_service_1.fetchChatRoom)(id, currentUserId);
        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: "Room not found!"
            });
        }
        if (chatroom.receiver) {
            chatroom.friend = chatroom.receiver;
            const isOnline = yield redis.exists(`sockets:${(_a = chatroom.receiver) === null || _a === void 0 ? void 0 : _a._id.toString()}`);
            console.log("isOnline====>", isOnline);
            chatroom.friend.status = isOnline ? "online" : "offline";
        }
        const receiverDetail = yield (0, user_serivce_1.fetchUser)((_b = chatroom === null || chatroom === void 0 ? void 0 : chatroom.receiver) === null || _b === void 0 ? void 0 : _b._id);
        const senderDetail = yield (0, user_serivce_1.fetchUser)(currentUserId);
        let isBlocked = false;
        let ChatCleared;
        let chatClearedDate = null;
        if (chatroom.messageClearStatus.length > 0) {
            ChatCleared = chatroom.messageClearStatus.find((item) => item.userId._id.toString() === currentUserId.toString());
        }
        if (ChatCleared) {
            chatClearedDate = new Date(ChatCleared.clearedAt);
        }
        console.log("isChatCleared::", ChatCleared);
        const { error, message } = (0, user_serivce_1.checkUsersBlockedEachOther)(senderDetail, receiverDetail, currentUserId, chatroom);
        if (error) {
            isBlocked = true;
        }
        // if (error && message) {
        //     return res.status(statusCode || 500).json({
        //         success: false,
        //         message: message || 'Some error has occured'
        //     });
        // }
        // make all message seen in this chatroom;
        // await MessageModel.updateMany({
        //     chatRoomId: chatroom._id, receiver: currentUserId, isBlocked: false
        // }, { $set: { seen: true } })
        // all message of chatrooms
        const messages = yield Message_1.default.find(Object.assign({ chatRoomId: chatroom._id, isDeleted: false, deletedFor: { $nin: [currentUserId] }, $or: [
                { isBlocked: false },
                { isBlocked: true, sender: currentUserId },
            ] }, (ChatCleared && { createdAt: { $gt: chatClearedDate } }))).limit(limit).skip(skip).sort({ createdAt: -1 })
            .populate([
            {
                path: "sender",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
                path: "receiver",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
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
            },
            {
                path: "file",
                select: user_serivce_1.fileModelFieldSelection
            },
            {
                path: "seenBy",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            }
        ]);
        const totalMessage = (yield Message_1.default.countDocuments(Object.assign({ chatRoomId: chatroom._id, $or: [
                { isBlocked: false },
                { isBlocked: true, sender: currentUserId },
            ] }, (ChatCleared && { createdAt: { $gt: chatClearedDate } })))) || 0;
        chatroom.messages = messages || [];
        const totalPages = Math.ceil(totalMessage / limit);
        return res.status(200).json({
            success: true,
            message: "Detail fetched!",
            data: {
                total: totalMessage,
                limit: limit,
                page: page,
                totalPages: totalPages,
                blockStatus: {
                    isBlocked,
                    message
                },
                chatroom: chatroom
            }
        });
    }
    catch (error) {
        console.error('Error in chatroomById controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.chatroomById = chatroomById;
const allChatrooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        let { limit = 10, page = 1, unread, favourites, search = '' } = req.query;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        let searchQuery = {};
        let matchQuery = {};
        let groupSearchQuery = {};
        if (unread === 'true') {
            matchQuery = { "unreadMessageCount": { $gt: 0 } };
        }
        if (search) {
            let regex = {
                $regex: new RegExp(search, 'i')
            };
            searchQuery = {
                $or: [
                    { "friend.fullName": regex },
                    { "friend.email": regex },
                    { "friend.username": regex }
                ]
            };
            groupSearchQuery = {
                $or: [
                    { "name": regex },
                    { "description": regex }
                ]
            };
        }
        if (favourites === 'true') {
            searchQuery = Object.assign(Object.assign({}, searchQuery), { 'favouriteBy._id': new mongoose_1.default.Types.ObjectId(currentUserId) });
        }
        let chatrooms = yield Room_1.default.aggregate([
            { $match: { participants: new mongoose_1.default.Types.ObjectId(currentUserId), deletedBy: { $ne: new mongoose_1.default.Types.ObjectId(currentUserId) } } },
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participants"
                }
            },
            {
                $addFields: {
                    friend: {
                        $first: {
                            $filter: {
                                input: "$participants",
                                as: "user",
                                cond: { $ne: ["$$user._id", new mongoose_1.default.Types.ObjectId(currentUserId)] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    chatCleared: {
                        $first: {
                            $filter: {
                                input: "$messageClearStatus",
                                as: "item",
                                cond: { $eq: ["$$item.userId", new mongoose_1.default.Types.ObjectId(currentUserId)] }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "favouriteBy",
                    foreignField: "_id",
                    as: "favouriteBy"
                }
            },
            {
                $match: searchQuery
            },
            {
                $lookup: {
                    from: "usersettings",
                    localField: "friend._id",
                    foreignField: "user",
                    as: "friendProfileSetting"
                }
            },
            {
                $unwind: {
                    path: "$friendProfileSetting",
                    preserveNullAndEmptyArrays: true
                }
            },
            //profileImage
            {
                $lookup: {
                    from: "media",
                    localField: "friend.profileImage",
                    foreignField: "_id",
                    as: "friendImage"
                }
            },
            {
                $addFields: {
                    "friend.profileImage": {
                        $cond: {
                            if: { $eq: ["$friendProfileSetting.isProfileImageShow", true] },
                            then: { $arrayElemAt: ["$friendImage", 0] },
                            else: null
                        }
                    }
                }
            },
            //messages
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id", currentUserId: new mongoose_1.default.Types.ObjectId(currentUserId), clearAt: "$chatCleared.clearedAt" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$chatRoomId", "$$chatroomId"] },
                                        { $eq: ["$isDeleted", false] },
                                        { $not: { $in: ["$$currentUserId", "$deletedFor"] } },
                                        {
                                            $or: [
                                                { $eq: ["$isBlocked", false] },
                                                {
                                                    $and: [
                                                        { $eq: ["$isBlocked", true] },
                                                        { $eq: ["$sender", "$$currentUserId"] }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            $or: [
                                                { $eq: ['$$clearAt', null] },
                                                { $gt: ['$createdAt', "$$clearAt"] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        { $skip: 0 }
                    ],
                    as: "currentMessage"
                }
            },
            {
                $unwind: {
                    path: "$currentMessage",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id", currentUserId: currentUserId },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$chatRoomId", "$$chatroomId"] },
                                        { $eq: ["$seen", false] },
                                        { $eq: ["$receiver", "$$currentUserId"] },
                                        { $eq: ["$isBlocked", false] },
                                    ]
                                }
                            }
                        },
                    ],
                    as: "unreadMessages"
                }
            },
            {
                $addFields: {
                    unreadMessageCount: {
                        $size: "$unreadMessages"
                    }
                }
            },
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "users",
                    localField: "currentMessage.sender",
                    foreignField: "_id",
                    as: "currentMessage.sender"
                }
            },
            {
                $unwind: {
                    path: "$currentMessage.sender",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "currentMessage.receiver",
                    foreignField: "_id",
                    as: "currentMessage.receiver"
                }
            },
            {
                $unwind: {
                    path: "$currentMessage.receiver",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: { "currentMessage.createdAt": -1 } },
            // { $skip: skip },
            // { $limit: limit },
            {
                $project: {
                    _id: 1,
                    participants: user_serivce_1.userFieldSelectionModel,
                    active: 1,
                    blocked: 1,
                    chatCleared: 1,
                    // favouriteBy:1,
                    friend: Object.assign(Object.assign({}, user_serivce_1.userFieldSelectionModel), { profileImage: user_serivce_1.fileModelFieldSelection }),
                    currentMessage: Object.assign(Object.assign({}, chatMessage_service_1.messageFieldSelection), { sender: user_serivce_1.userFieldSelectionModel, receiver: user_serivce_1.userFieldSelectionModel }),
                    unreadMessageCount: 1
                }
            }
        ]);
        chatrooms = chatrooms.map((chat) => {
            return Object.assign(Object.assign({}, chat), { chatType: "single" });
        });
        let groupChatrooms = yield GroupChat_1.default.aggregate([
            { $match: Object.assign({ participants: new mongoose_1.default.Types.ObjectId(currentUserId), deletedBy: { $ne: new mongoose_1.default.Types.ObjectId(currentUserId) } }, (search && groupSearchQuery)) },
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participants"
                }
            },
            {
                $addFields: {
                    chatCleared: {
                        $first: {
                            $filter: {
                                input: "$messageClearStatus",
                                as: "item",
                                cond: { $eq: ["$$item.userId", new mongoose_1.default.Types.ObjectId(currentUserId)] }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "favouriteBy",
                    foreignField: "_id",
                    as: "favouriteBy"
                }
            },
            { $match: Object.assign({}, (favourites === 'true' && { 'favouriteBy._id': new mongoose_1.default.Types.ObjectId(currentUserId) })) },
            {
                $lookup: {
                    from: "media",
                    localField: "groupImage",
                    foreignField: "_id",
                    as: "groupImage"
                }
            },
            {
                $unwind: {
                    path: "$groupImage",
                    preserveNullAndEmptyArrays: true
                }
            },
            // messages
            {
                $lookup: {
                    from: "messages",
                    let: { groupChatroomId: "$_id", currentUserId: new mongoose_1.default.Types.ObjectId(currentUserId), clearAt: "$chatCleared.clearedAt" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$group", "$$groupChatroomId"] },
                                        {
                                            $or: [
                                                { $eq: ['$$clearAt', null] },
                                                { $gt: ['$createdAt', "$$clearAt"] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        { $skip: 0 }
                    ],
                    as: "currentMessage"
                }
            },
            {
                $unwind: {
                    path: "$currentMessage",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { groupChatroomId: "$_id", currentUserId: currentUserId },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$group", "$$groupChatroomId"] },
                                        { $not: [{ $in: ["$$currentUserId", "$seenBy"] }] }
                                    ]
                                }
                            }
                        },
                    ],
                    as: "unreadMessages"
                }
            },
            {
                $addFields: {
                    unreadMessageCount: {
                        $size: "$unreadMessages"
                    }
                }
            },
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "users",
                    localField: "currentMessage.sender",
                    foreignField: "_id",
                    as: "currentMessage.sender"
                }
            },
            {
                $unwind: {
                    path: "$currentMessage.sender",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "currentMessage.receiver",
                    foreignField: "_id",
                    as: "currentMessage.receiver"
                }
            },
            {
                $unwind: {
                    path: "$currentMessage.receiver",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: { "currentMessage.createdAt": -1 } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    participants: user_serivce_1.userFieldSelectionModel,
                    active: 1,
                    blocked: 1,
                    chatCleared: 1,
                    // favouriteBy:1,
                    groupImage: user_serivce_1.fileModelFieldSelection,
                    // friend: { ...userFieldSelectionModel, profileImage: fileModelFieldSelection },
                    currentMessage: Object.assign(Object.assign({}, chatMessage_service_1.messageFieldSelection), { sender: user_serivce_1.userFieldSelectionModel, receiver: user_serivce_1.userFieldSelectionModel }),
                    unreadMessageCount: 1
                }
            }
        ]);
        groupChatrooms = groupChatrooms.map((chat) => {
            return Object.assign(Object.assign({}, chat), { chatType: "group" });
        });
        const allChatrooms = [...chatrooms, ...groupChatrooms];
        if (allChatrooms.length > 0) {
            allChatrooms.sort((a, b) => {
                var _a, _b;
                const aTime = ((_a = a.currentMessage) === null || _a === void 0 ? void 0 : _a.createdAt) ? new Date(a.currentMessage.createdAt).getTime() : 0;
                const bTime = ((_b = b.currentMessage) === null || _b === void 0 ? void 0 : _b.createdAt) ? new Date(b.currentMessage.createdAt).getTime() : 0;
                return bTime - aTime;
            });
        }
        return res.status(200).json({
            success: true,
            message: "Detail fetched!",
            data: {
                // chatrooms: chatrooms,
                // groupChatrooms: groupChatrooms
                allChatrooms: allChatrooms
                // total: totalMessage,
                // limit: limit,
                // page: page,
                // totalPages: totalPages,
                // chatroom: chatroom
            }
        });
    }
    catch (error) {
        console.error('Error in allChatrooms controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.allChatrooms = allChatrooms;
const deleteMessage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { id, messageId } = req.params;
    console.log("req.body===", req.body);
    const deleteType = req.body.type;
    try {
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // find room details
        let chatroom = yield (0, chatroom_service_1.fetchChatRoom)(id, currentUserId);
        if (!chatroom) {
            throw new appError_1.ApiError(404, "Room not found");
        }
        const messagePopulate = [
            {
                path: "sender",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
                path: "receiver",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
                path: "file",
                select: user_serivce_1.fileModelFieldSelection
            },
            {
                path: "seenBy",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            }
        ];
        // all message of chatrooms
        const messageExist = yield Message_1.default.findOne({ _id: messageId, chatRoomId: chatroom._id, isDeleted: false })
            .populate(messagePopulate);
        if (!messageExist) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Message not found!"
            });
        }
        // if (messageExist.sender?._id.toString() !== currentUserId?.toString()) {
        //     return res.status(403).json({
        //         success: false,
        //         message: IsProduction ? 'Invalid request.' : "Only sender can delete message!"
        //     });
        // }
        let updateQuery = {};
        if (((_b = messageExist.sender) === null || _b === void 0 ? void 0 : _b._id.toString()) === (currentUserId === null || currentUserId === void 0 ? void 0 : currentUserId.toString()) && deleteType === "everyone") {
            updateQuery.isDeleted = true;
        }
        else {
            let messageDeletedUsers = ((_c = messageExist.deletedFor) === null || _c === void 0 ? void 0 : _c.map(id => id.toString())) || [];
            if (currentUserId) {
                messageDeletedUsers.push(currentUserId.toString());
            }
            messageDeletedUsers = [...new Set(messageDeletedUsers)];
            updateQuery.deletedFor = messageDeletedUsers.map(id => new mongoose_1.default.Types.ObjectId(id));
        }
        console.log("updateQuery====", updateQuery);
        const deletedMessage = yield Message_1.default.findOneAndUpdate({ _id: messageId }, updateQuery, { new: true }).populate(messagePopulate).lean();
        if (constant_1.mediaTypes.includes(messageExist.type)) {
            // delete file from path
        }
        const receiverDetail = yield (0, user_serivce_1.fetchUser)(new mongoose_1.default.Types.ObjectId(messageExist.receiver._id));
        // send socket notification to receiver
        // if (checkUserSocketConnected(receiverDetail?.socketId)) {
        //     io.to(receiverDetail?.socketId).emit('message_deleted', {
        //         type: 'chat',
        //         room: chatroom._id,
        //         data: deletedMessage
        //     })
        // }
        // send socket in roomId when user delete for everyone...
        if (((_d = messageExist.sender) === null || _d === void 0 ? void 0 : _d._id.toString()) === (currentUserId === null || currentUserId === void 0 ? void 0 : currentUserId.toString()) && deleteType === "everyone") {
            app_1.io.to((_e = chatroom === null || chatroom === void 0 ? void 0 : chatroom._id) === null || _e === void 0 ? void 0 : _e.toString()).emit("delete_message", {
                type: "chat",
                roomId: chatroom === null || chatroom === void 0 ? void 0 : chatroom._id,
                receiverId: receiverDetail === null || receiverDetail === void 0 ? void 0 : receiverDetail._id,
                messageId: messageId
            });
        }
        let data = Object.assign(Object.assign({}, deletedMessage), { isDeleted: true, roomId: chatroom === null || chatroom === void 0 ? void 0 : chatroom._id });
        return res.status(200).json({
            success: true,
            message: "Message Deleted!",
            data: JSON.parse(JSON.stringify(data))
        });
    }
    catch (error) {
        console.error("Delete Message Error:", error);
        next(error);
        // return res.status(500).json({
        //     success: false,
        //     message: IsProduction
        //         ? "Something went wrong. Please try again later."
        //         : `Server Error: ${error.message}`
        // });
    }
});
exports.deleteMessage = deleteMessage;
const editMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id, messageId } = req.params;
    try {
        const currentUserId = req.user._id;
        const { message, type = "text" } = req.body;
        // find room details
        let chatroom = yield (0, chatroom_service_1.fetchChatRoom)(id, currentUserId);
        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Room not found!"
            });
        }
        const messagePopulate = [
            {
                path: "sender",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
                path: "receiver",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            },
            {
                path: "file",
                select: user_serivce_1.fileModelFieldSelection
            },
            {
                path: "seenBy",
                select: user_serivce_1.userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: user_serivce_1.fileModelFieldSelection
                }
            }
        ];
        // all message of chatrooms
        const messageExist = yield Message_1.default.findOne({ _id: messageId, chatRoomId: chatroom._id, isDeleted: false })
            .populate(messagePopulate);
        if (!messageExist) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Message not found!"
            });
        }
        //wrong
        // if (messageExist.type !== 'text') {
        //     return res.status(403).json({
        //         success: false,
        //         message: IsProduction ? 'Invalid request.' : "Only text message can be edit!"
        //     });
        // }
        if (((_a = messageExist.sender) === null || _a === void 0 ? void 0 : _a._id.toString()) !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: IsProduction ? 'Invalid request.' : "Only sender can edit message!"
            });
        }
        let updatedData = {
            isEdited: true
        };
        if (type === "text") {
            updatedData.content = message;
        }
        else {
            updatedData.fileText = message;
        }
        console.log("updatedData===", updatedData);
        const updatedMessage = yield Message_1.default.findOneAndUpdate({ _id: messageId }, updatedData, { new: true }).populate(messagePopulate).lean();
        // if (mediaTypes.includes(messageExist.type)) {
        //     // delete file from path
        // }
        const receiverDetail = yield (0, user_serivce_1.fetchUser)(new mongoose_1.default.Types.ObjectId(messageExist.receiver._id));
        // send socket notification to receiver
        // if (checkUserSocketConnected(receiverDetail.socketId)) {
        //     io.to(receiverDetail.socketId).emit('message_edited', {
        //         type: 'chat',
        //         room: chatroom._id,
        //         data: updatedMessage
        //     })
        // }
        let messageUpdateField = {};
        if (type === 'text') {
            messageUpdateField.content = updatedMessage.content;
        }
        else {
            messageUpdateField.fileText = updatedMessage.fileText;
        }
        console.log("messageUpdateField====", messageUpdateField);
        if (((_b = messageExist.sender) === null || _b === void 0 ? void 0 : _b._id.toString()) === (currentUserId === null || currentUserId === void 0 ? void 0 : currentUserId.toString())) {
            app_1.io.to((_c = chatroom === null || chatroom === void 0 ? void 0 : chatroom._id) === null || _c === void 0 ? void 0 : _c.toString()).emit("edit_message", {
                type: "chat",
                roomId: chatroom === null || chatroom === void 0 ? void 0 : chatroom._id,
                receiverId: receiverDetail === null || receiverDetail === void 0 ? void 0 : receiverDetail._id,
                messageId: messageId,
                editMessage: Object.assign({ type }, messageUpdateField)
            });
        }
        let data = Object.assign(Object.assign({}, updatedMessage), { roomId: chatroom === null || chatroom === void 0 ? void 0 : chatroom._id });
        return res.status(200).json({
            success: true,
            message: "Message edited!",
            data: data
        });
    }
    catch (error) {
        console.error("editMessage Error:", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.editMessage = editMessage;
const updateChatRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        const { addToFavourites, removeFromFavourites, block, unblock, clearMessage = false, roomDelete = false } = req.body;
        // find room details
        let chatroom = yield (0, chatroom_service_1.fetchChatRoom)(id, currentUserId);
        const friend = yield (0, user_serivce_1.fetchUser)(new mongoose_1.default.Types.ObjectId((_a = chatroom === null || chatroom === void 0 ? void 0 : chatroom.receiver) === null || _a === void 0 ? void 0 : _a._id));
        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Room not found!"
            });
        }
        let responseMessage = '';
        if (addToFavourites) {
            yield Room_1.default.updateOne({ _id: id }, { $addToSet: { favouriteBy: currentUserId } });
            responseMessage = 'Added into Favourites!';
        }
        if (removeFromFavourites) {
            yield Room_1.default.updateOne({ _id: id }, { $pull: { favouriteBy: currentUserId } });
            responseMessage = 'Removed from Favourites!';
        }
        if (block) {
            yield user_1.default.updateOne({ _id: currentUserId }, { $push: { blockedUsers: friend._id } });
            yield Room_1.default.updateOne({ _id: chatroom._id }, { $addToSet: { blockStatus: { userId: currentUserId, blockedUserId: friend._id } } });
            responseMessage = 'Blocked!';
        }
        if (unblock) {
            yield user_1.default.updateOne({ _id: currentUserId }, { $pull: { blockedUsers: friend._id } });
            yield Room_1.default.updateOne({ _id: chatroom._id }, { $pull: { blockStatus: { userId: currentUserId, blockedUserId: friend._id } } });
            responseMessage = 'Unblocked!';
        }
        ;
        if (clearMessage) {
            yield Room_1.default.updateOne({ _id: chatroom._id }, { $pull: { messageClearStatus: { userId: currentUserId } } });
            yield Room_1.default.updateOne({ _id: chatroom._id }, { $addToSet: { messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } });
            responseMessage = 'Message cleared!';
        }
        if (roomDelete) {
            yield Room_1.default.updateOne({ _id: chatroom._id }, { $pull: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId } } });
            yield Room_1.default.updateOne({ _id: chatroom._id }, { $push: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } });
            responseMessage = 'Room deleted!';
        }
        return res.status(200).json({
            success: true,
            message: responseMessage
        });
    }
    catch (error) {
        console.error("updateChatRoom api Error:", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.updateChatRoom = updateChatRoom;
