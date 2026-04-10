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
exports.deleteGroupByMember = exports.clearMessage = exports.favouriteAndUnFavourite = exports.updateChatRoom = exports.sendMessage = exports.groupChatById = exports.addMembers = exports.createGroup = void 0;
const GroupChat_1 = __importDefault(require("../model/GroupChat"));
const Room_1 = __importDefault(require("../model/Room"));
const chatMessage_service_1 = require("../service/chatMessage.service");
const Message_1 = __importDefault(require("../model/Message"));
const user_serivce_1 = require("../service/user.serivce");
const app_1 = require("../app");
const socket_1 = require("../service/socket");
const constant_1 = require("../config/constant");
const group_service_1 = require("../service/group.service");
const IsProduction = process.env.NODE_ENV === 'production';
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { name, description, participants = [], groupImage } = req.body;
    try {
        const currentUserId = req.user._id;
        const admin = currentUserId;
        // check name already exist with same user;
        const groupExist = yield GroupChat_1.default.findOne({
            name: name,
            admin: admin
        });
        if (groupExist) {
            return res.status(403).json({
                success: false,
                message: "Group exist with this name! Select diffrent name.",
                data: null
            });
        }
        // check all users friend of current Users;
        if (participants.length > 0) {
            participants = yield Promise.all(participants.map((participant) => __awaiter(void 0, void 0, void 0, function* () {
                const chatroomExist = yield Room_1.default.findOne({ participants: { $all: [currentUserId, participant] } }).
                    populate("participants", "name email");
                if (chatroomExist) {
                    return participant;
                }
            })));
        }
        participants = [...participants, admin];
        participants = participants.filter((n) => n);
        const groupChatData = {
            name,
            description,
            admin,
            participants,
        };
        if (groupImage) {
            groupChatData.groupImage = groupImage;
        }
        const newGroup = yield GroupChat_1.default.create(groupChatData);
        if (!newGroup) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong. Please try again later."
            });
        }
        return res.status(201).json({
            success: true,
            message: "Group created successfully!",
            data: newGroup
        });
    }
    catch (error) {
        console.error("Error in createGroup controller fn::", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.createGroup = createGroup;
const addMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const groupId = id;
    let { members = [] } = req.body;
    try {
        const currentUserId = req.user._id;
        // check name already exist with same user;
        const groupExist = yield GroupChat_1.default.findOne({
            _id: groupId,
            participants: currentUserId
        });
        if (!groupExist) {
            return res.status(401).json({
                success: false,
                message: "Invalid Request",
                data: null
            });
        }
        // check uset has permission or not;
        const isAdmin = currentUserId.toString() === groupExist.admin.toString();
        let participants = groupExist.participants || [];
        if (!isAdmin && !groupExist.isParticipantsCanAddMembers) {
            return res.status(401).json({
                success: false,
                message: "No permission to add members!",
                data: null
            });
        }
        participants = participants.map((participant) => participant.toString());
        // remove existing members::
        members = members.filter((member) => !participants.includes(member));
        // check all members is friend of current user or not
        if (members.length > 0) {
            members = yield Promise.all(members.map((member) => __awaiter(void 0, void 0, void 0, function* () {
                const chatroomExist = yield Room_1.default.findOne({ participants: { $all: [currentUserId, member] } }).
                    populate("participants", "name email");
                if (chatroomExist) {
                    return member;
                }
            })));
        }
        participants = [...participants, ...members];
        participants = participants.filter((n) => n);
        const updatedGroup = yield GroupChat_1.default.findOneAndUpdate({ _id: groupId }, { participants: participants }, { new: true }).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email');
        if (!updatedGroup) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong. Please try again later."
            });
        }
        return res.status(200).json({
            success: true,
            message: "Members add successfully!",
            data: updatedGroup
        });
    }
    catch (error) {
        console.error("Error in createGroup controller fn::", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.addMembers = addMembers;
const groupChatById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        let { limit = 10, page = 1 } = req.query;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        let group = yield GroupChat_1.default.findOne({ _id: id }).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')
            .populate([
            {
                path: "groupImage",
                select: user_serivce_1.fileModelFieldSelection
            }
        ]).lean();
        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }
        let ChatCleared;
        let chatClearedDate = null;
        ChatCleared = group.messageClearStatus.find((item) => item.userId.toString() === currentUserId.toString());
        if (ChatCleared) {
            chatClearedDate = new Date(ChatCleared.clearedAt);
        }
        // make all message seen in this chatroom by currentUser
        yield Message_1.default.updateMany({
            group: group._id, seenBy: { $ne: currentUserId }
        }, { $push: { seenBy: currentUserId } });
        // all message of chatrooms
        const messages = yield Message_1.default.find(Object.assign({ group: group._id }, (ChatCleared && { createdAt: { $gt: chatClearedDate } }))).limit(limit).skip(skip).sort({ createdAt: -1 })
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
        const totalMessage = (yield Message_1.default.countDocuments({ group: group._id })) || 0;
        group.messages = messages || [];
        const totalPages = Math.ceil(totalMessage / limit);
        return res.status(201).json({
            success: true,
            message: "Group detail!",
            data: {
                total: totalMessage,
                limit: limit,
                page: page,
                totalPages: totalPages,
                chatroom: group
            }
        });
    }
    catch (error) {
        console.error("Error in createGroup controller fn::", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.groupChatById = groupChatById;
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const currentUserId = req.user._id;
    const { message = '', type = 'text', file, fileText = '' } = req.body;
    try {
        // find room details
        const groupChatroom = yield (0, group_service_1.singleGroupDetail)(id, currentUserId);
        if (!groupChatroom) {
            return res.status(404).json({
                success: false,
                message: "Group not found!"
            });
        }
        if (constant_1.mediaTypes.includes(type) && !file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded!"
            });
        }
        // check user permission::
        const isAdmin = currentUserId.toString() === ((_a = groupChatroom.admin) === null || _a === void 0 ? void 0 : _a._id.toString());
        if (!isAdmin && !groupChatroom.isParticipantsCanSendMessage) {
            return res.status(401).json({
                success: false,
                message: "Only Admin can send message!"
            });
        }
        let participants = groupChatroom.participants;
        let messageData = {
            sender: currentUserId,
            content: message,
            type: type,
            group: groupChatroom._id,
            seenBy: [currentUserId]
        };
        if (file) {
            messageData.file = file;
        }
        if (file && fileText) {
            messageData.fileText = fileText;
        }
        // // create new message;
        let newMessage = yield Message_1.default.create(messageData);
        // // check someone deleted his chatroom now active;
        // if(chatroom.deletedBy.length>0 && newMessage){
        //     await ChatRoomModel.findOneAndUpdate(
        //         {_id:chatroom._id},
        //         {deletedBy:[]}
        //     )
        // }
        newMessage = yield (0, chatMessage_service_1.messageDetail)(newMessage._id);
        if (!newMessage) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured, Please try again!"
            });
        }
        // send socket notification to particapinats except sender
        participants = participants.filter((participant) => participant._id.toString() !== currentUserId.toString());
        for (const participant of participants) {
            if ((0, socket_1.checkUserSocketConnected)(participant.socketId)) {
                app_1.io.to(participant.socketId).emit('group_message_received', {
                    type: 'groupChat',
                    // room: chatroom._id,
                    group: groupChatroom._id,
                    data: newMessage
                });
            }
        }
        return res.status(201).json({
            success: true,
            message: "Message sent!",
            data: {
                message: newMessage,
                chatroom: groupChatroom._id
            }
        });
    }
    catch (error) {
        console.error('Error in group sendMessage controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.sendMessage = sendMessage;
const updateChatRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id: groupId } = req.params;
    try {
        const currentUserId = req.user._id;
        const { addToFavourites, removeFromFavourites, groupImage, isParticipantsCanSendMessage, isParticipantsCanAddMembers, isParticipantsCanModifyGroupImage, clearMessage = false, roomDelete = false, removeMemberIds = [] } = req.body;
        const group = yield GroupChat_1.default.findOne({ _id: groupId }).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }
        const isAdmin = currentUserId.toString() === ((_a = group.admin) === null || _a === void 0 ? void 0 : _a._id.toString());
        let responseMessage = '';
        let groupUpdateQuery = {};
        if (isAdmin && (isParticipantsCanSendMessage === true || isParticipantsCanSendMessage === false)) {
            groupUpdateQuery.isParticipantsCanSendMessage = isParticipantsCanSendMessage;
        }
        if (isAdmin && (isParticipantsCanModifyGroupImage === true || isParticipantsCanModifyGroupImage === false)) {
            groupUpdateQuery.isParticipantsCanModifyGroupImage = isParticipantsCanModifyGroupImage;
        }
        if (isAdmin && (isParticipantsCanAddMembers === true || isParticipantsCanAddMembers === false)) {
            groupUpdateQuery.isParticipantsCanAddMembers = isParticipantsCanAddMembers;
        }
        ;
        if (groupImage) {
            if (!isAdmin && !group.isParticipantsCanModifyGroupImage) {
                return res.status(403).json({
                    success: false,
                    message: IsProduction ? 'No permission to modify group image.' : "No permission to modify group image."
                });
            }
            else {
                groupUpdateQuery.groupImage = groupImage;
            }
        }
        responseMessage = 'Updated!';
        if (isAdmin && removeMemberIds.length > 0) {
            let existingParticipants = group.participants.map((participant) => participant._id.toString());
            console.log("existingParticipants::", existingParticipants);
            const participants = [];
            existingParticipants.map((participant) => {
                if (!removeMemberIds.includes(participant)) {
                    participants.push(participant);
                }
            });
            console.log("participants::", participants);
            groupUpdateQuery.participants = participants;
            responseMessage = 'Member removed successfully!';
        }
        let updatedGroup = yield GroupChat_1.default.findOneAndUpdate({ _id: group._id }, groupUpdateQuery, { new: true })
            .populate('admin', '_id username fullName email');
        return res.status(200).json({
            success: true,
            message: responseMessage,
            data: updatedGroup
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
const favouriteAndUnFavourite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        const { favourite, unFavourite } = req.body;
        const group = yield GroupChat_1.default.findOne({ _id: id }).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }
        let responseMessage = '';
        if (favourite) {
            yield GroupChat_1.default.updateOne({ _id: id }, { $pull: { favouriteBy: currentUserId } });
            yield GroupChat_1.default.updateOne({ _id: id }, { $addToSet: { favouriteBy: currentUserId } });
            responseMessage = 'Added into Favourites!';
        }
        if (unFavourite) {
            yield GroupChat_1.default.updateOne({ _id: id }, { $pull: { favouriteBy: currentUserId } });
            responseMessage = 'Removed from Favourites!';
        }
        return res.status(200).json({
            success: true,
            message: responseMessage
        });
    }
    catch (error) {
        console.error("favouriteAndUnFavourite api Error:", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.favouriteAndUnFavourite = favouriteAndUnFavourite;
const clearMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        const group = yield GroupChat_1.default.findOne({ _id: id }).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }
        yield GroupChat_1.default.updateOne({ _id: group._id }, { $pull: { messageClearStatus: { userId: currentUserId } } });
        yield GroupChat_1.default.updateOne({ _id: group._id }, { $addToSet: { messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } });
        return res.status(200).json({
            success: true,
            message: "Message cleared!"
        });
    }
    catch (error) {
        console.error("clearMessage api Error:", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.clearMessage = clearMessage;
const deleteGroupByMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        const group = yield GroupChat_1.default.findOne({ _id: id }).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }
        const isAdmin = currentUserId.toString() === ((_a = group.admin) === null || _a === void 0 ? void 0 : _a._id.toString());
        // if (isAdmin) {
        //     await GroupChatModel.updateOne(
        //         { _id: group._id },
        //         { isDeleted: true }
        //     )
        // }
        yield GroupChat_1.default.updateOne({ _id: group._id }, { $pull: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId } } });
        yield GroupChat_1.default.updateOne({ _id: group._id }, { $push: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } });
        return res.status(200).json({
            success: true,
            message: "Group removed!"
        });
    }
    catch (error) {
        console.error("deleteGroupByMember api Error:", error);
        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
});
exports.deleteGroupByMember = deleteGroupByMember;
