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
exports.myFriends = exports.listContactRequest = exports.updateContactRequest = exports.addInContact = void 0;
const Contact_1 = __importDefault(require("../model/Contact"));
const Notification_1 = __importDefault(require("../model/Notification"));
const constant_1 = require("../config/constant");
const user_1 = __importDefault(require("../model/user"));
const app_1 = require("../app");
const socket_1 = require("../service/socket");
const Room_1 = __importDefault(require("../model/Room"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_serivce_1 = require("../service/user.serivce");
const addInContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { receiver } = req.body;
    try {
        const sender = req.user._id;
        const receiverDetail = yield user_1.default.findById(receiver);
        if (!receiverDetail) {
            return res.status(404).json({
                success: false,
                message: "Receiver not exist!"
            });
        }
        // check if user has blocked 
        // already sent friend request
        let isContactExist = yield Contact_1.default.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        }).populate("sender").populate("receiver").sort({ createdAt: -1 });
        isContactExist = isContactExist[0];
        if (isContactExist && ["accepted", "pending"].includes(isContactExist.status)) {
            let message = "";
            switch (isContactExist.status) {
                case "accepted":
                    message = "Already friends!";
                    break;
                case "pending":
                    message = sender.toString() === ((_a = isContactExist === null || isContactExist === void 0 ? void 0 : isContactExist.sender) === null || _a === void 0 ? void 0 : _a._id.toString()) ? "You have already send friend request!" : `${receiverDetail.username} already send frinend request to you`;
                    break;
                // case "blocked":
                //     message = sender.toString() === isContactExist?.sender?._id.toString() ? "You have already send friend request!" : `${receiverDetail.username} already send frinend request to you`
                //     break;
                default:
                    break;
            }
            return res.status(401).json({
                success: false,
                message: message
            });
        }
        const newContact = yield Contact_1.default.create({ sender, receiver });
        // create notification
        yield Notification_1.default.create({
            user: receiver,
            title: constant_1.notificationContent.sendAddContact.title,
            description: constant_1.notificationContent.sendAddContact.description.replace("{{username}}", receiverDetail.username),
            contactRequestId: newContact._id
        });
        //check user connect with socket
        if (receiverDetail.socketId && (0, socket_1.checkUserSocketConnected)(receiverDetail.socketId)) {
            app_1.io.to(receiverDetail.socketId).emit("notification", {
                type: "FriendRequest",
                message: "you have new friend request",
                contactRequetId: newContact._id
            });
        }
        if (!newContact) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured. Try again"
            });
        }
        return res.status(201).json({
            success: true,
            message: "Successfully send request"
        });
    }
    catch (error) {
        console.error('Error in addInContact controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.addInContact = addInContact;
const updateContactRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { status, contactRequestId } = req.body;
    try {
        const currentUserId = req.user._id;
        let senderDetail;
        let chatroom;
        const contactRequestExist = yield Contact_1.default.findOne({ _id: contactRequestId, status: "pending" })
            .populate("sender", "_id email fullName username socketId")
            .populate("receiver", "_id email fullName username socketId")
            .lean();
        console.log("contactRequestExist::", contactRequestExist);
        if (!contactRequestExist) {
            return res.status(404).json({
                success: false,
                message: "Invalid Request"
            });
        }
        senderDetail = contactRequestExist.sender;
        if (contactRequestExist && ((_a = contactRequestExist.receiver) === null || _a === void 0 ? void 0 : _a._id.toString()) !== currentUserId.toString()) {
            console.log("not receiver");
            return res.status(403).json({
                success: false,
                message: "Invalid Request"
            });
        }
        // check user blocked or not
        if (status === "accepted") {
            yield Contact_1.default.findOneAndUpdate({ _id: contactRequestId }, { status: "accepted" });
            // create notification
            yield Notification_1.default.create({
                user: senderDetail._id,
                title: constant_1.notificationContent.acceptContactRequest.title,
                description: constant_1.notificationContent.acceptContactRequest.description.replace("{{username}}", (_b = contactRequestExist.sender) === null || _b === void 0 ? void 0 : _b.username).replace("{{friendName}}", (_c = contactRequestExist.receiver) === null || _c === void 0 ? void 0 : _c.username),
                contactRequestId: contactRequestId
            });
            if (senderDetail.socketId && (0, socket_1.checkUserSocketConnected)(senderDetail.socketId)) {
                app_1.io.to(senderDetail.socketId).emit("notification", {
                    type: "FriendRequestAccepted",
                    message: "Your friend Request accepted!",
                    contactRequetId: contactRequestId
                });
            }
            // create chatroom here
            chatroom = yield Room_1.default.create({
                participants: [senderDetail._id, contactRequestExist.receiver._id]
            });
        }
        else {
            // soft delete contactRequest
            yield Contact_1.default.findOneAndUpdate({ _id: contactRequestId }, { status: "rejected" });
            // create notification
            yield Notification_1.default.create({
                user: senderDetail._id,
                title: constant_1.notificationContent.rejectContactRequest.title,
                description: constant_1.notificationContent.rejectContactRequest.description.replace("{{username}}", (_d = contactRequestExist.sender) === null || _d === void 0 ? void 0 : _d.username).replace("{{friendName}}", (_e = contactRequestExist.receiver) === null || _e === void 0 ? void 0 : _e.username),
                contactRequestId: contactRequestId
            });
            if (senderDetail.socketId && (0, socket_1.checkUserSocketConnected)(senderDetail.socketId)) {
                app_1.io.to(senderDetail.socketId).emit("notification", {
                    type: "FriendRequestRejected",
                    message: "Your friend Request rejected!",
                    contactRequetId: contactRequestId
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: "Successfully updated!",
            data: {
                chatroom,
                contactRequestExist
            }
        });
    }
    catch (error) {
        console.error('Error in updateContactRequest controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.updateContactRequest = updateContactRequest;
const listContactRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { status = "pending", limit, page } = req.query;
    try {
        console.log("status::", status);
        const currentUserId = req.user._id;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        const contactRequests = yield Contact_1.default.find({
            receiver: currentUserId,
            status: status
        })
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 })
            // .populate("sender", "_id email username fullName")
            .populate({
            path: "sender",
            select: {
                _id: 1,
                email: 1,
                username: 1,
                fullName: 1,
                bio: 1,
                profileImage: 1
            },
            populate: {
                path: "profileImage",
                select: user_serivce_1.fileModelFieldSelection,
            }
        });
        const totalResut = yield Contact_1.default.countDocuments({
            receiver: currentUserId,
            status: status
        });
        const total = totalResut || 0;
        const totalPages = Math.ceil(total / limit);
        if (contactRequests.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Data not found",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "Data Fetched!",
            data: {
                total: total,
                limit: limit,
                page: page,
                totalPages: totalPages,
                contactRequests: contactRequests
            }
        });
    }
    catch (error) {
        console.error('Error in listContactRequest controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.listContactRequest = listContactRequest;
const myFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { limit, page, search = '' } = req.query;
    try {
        const currentUserId = req.user._id;
        const user = yield (0, user_serivce_1.fetchUser)(currentUserId);
        console.log('user', user);
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        let searchQuery = {};
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
        }
        const pipeline = [
            {
                $match: {
                    $or: [
                        { receiver: new mongoose_1.default.Types.ObjectId(currentUserId) },
                        { sender: new mongoose_1.default.Types.ObjectId(currentUserId) }
                    ],
                    status: 'accepted',
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "receiver",
                    foreignField: "_id",
                    as: "receiver"
                }
            },
            {
                $unwind: {
                    path: "$receiver",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "sender",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            {
                $unwind: {
                    path: "$sender",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    friend: {
                        $cond: {
                            if: { $ne: ['$receiver._id', new mongoose_1.default.Types.ObjectId(currentUserId)] },
                            then: "$receiver",
                            else: "$sender"
                        }
                    }
                }
            },
            {
                $match: searchQuery
            },
            {
                $addFields: {
                    currentBlockedUsers: user.blockedUsers.map((user) => new mongoose_1.default.Types.ObjectId(user._id))
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: { $in: ["$friend._id", "$currentBlockedUsers"] },
                            then: "blocked",
                            else: "$status"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "usersettings",
                    localField: "friend._id",
                    foreignField: "user",
                    as: "profileSetting"
                }
            },
            {
                $unwind: {
                    path: "$profileSetting",
                    preserveNullAndEmptyArrays: true
                }
            },
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
                            if: { $eq: ["$profileSetting.isProfileImageShow", true] },
                            then: { $arrayElemAt: ["$friendImage", 0] },
                            else: null
                        }
                    }
                }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    // sender: userFieldSelectionModel,
                    // receiver: userFieldSelectionModel,
                    status: 1,
                    friend: Object.assign(Object.assign({}, user_serivce_1.userFieldSelectionModel), { profileImage: user_serivce_1.fileModelFieldSelection }),
                    // friendImage:1,
                    // profileSetting:1
                }
            }
        ];
        const countPipeline = [...pipeline.slice(0, -3), { $count: "total" }];
        // pipeline.push({ $skip: skip })
        const list = yield Contact_1.default.aggregate(pipeline);
        const result = yield Contact_1.default.aggregate(countPipeline);
        // console.log("result::", result);
        // console.log("list::", list)
        const total = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        const totalPages = Math.ceil(total / limit);
        if (list.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Data not found",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "Data Fetched!",
            data: {
                total: total,
                limit: limit,
                page: page,
                totalPages: totalPages,
                friends: list
            }
        });
    }
    catch (error) {
        console.error('Error in myFriends controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.myFriends = myFriends;
