import ChatRoomModel from "src/model/Room";
import MessageModel from "src/model/Message";
import { fetchUser, checkUsersBlockedEachOther, userFieldSelectionModel, fileModelFieldSelection } from '../service/user.serivce';
import { fetchChatRoom } from '../service/chatroom.service';
import { io } from "../app";
import { checkUserSocketConnected } from '../service/socket'
import { messageDetail, messageFieldSelection } from '../service/chatMessage.service';
import mongoose from "mongoose";
import { mediaTypes } from '../config/constant'
import UserModel from "src/model/user";

const IsProduction = process.env.NODE_ENV as string === 'production';

export const sendMessage = async (req: any, res: any) => {
    const { id } = req.params;
    const currentUserId = req.user._id;
    const { message = '', type = 'text', file, fileText = '' } = req.body;
    try {

        // find room details
        const chatroom = await fetchChatRoom(id, currentUserId);

        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: "Room not found!"
            });
        }

        const receiverDetail: any = await fetchUser(chatroom.receiver);
        const senderDetail: any = await fetchUser(currentUserId)

        if (!receiverDetail) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found!"
            });
        }

        let isBlocked = false;

        const { error, message: erroMessage, statusCode, blockedByMe } = checkUsersBlockedEachOther(senderDetail, receiverDetail, currentUserId, chatroom);

        if (error) {
            isBlocked = true
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

        let messageData: any = {
            sender: currentUserId,
            receiver: receiverDetail._id,
            content: message,
            type: type,
            chatRoomId: chatroom._id,
            isBlocked: isBlocked
        }


        if (file) {
            messageData.file = file;
        }

        if (file && fileText) {
            messageData.fileText = fileText
        }

        // create new message;
        let newMessage: any = await MessageModel.create(messageData);


        // check someone deleted his chatroom now active;

        if(chatroom.deletedBy.length>0 && newMessage){
            await ChatRoomModel.findOneAndUpdate(
                {_id:chatroom._id},
                {deletedBy:[]}
            )
        }

        newMessage = await messageDetail(newMessage._id)

        if (!newMessage) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured, Please try again!"
            });
        }

        // send socket notification to receiver
        if (!isBlocked && checkUserSocketConnected(receiverDetail.socketId)) {
            io.to(receiverDetail.socketId).emit('message_received', {
                type: 'chat',
                room: chatroom._id,
                data: newMessage
            })
        }


        return res.status(201).json({
            success: true,
            message: "Message send",
            data: {
                message: newMessage,
                chatroom: chatroom
            }
        });

    } catch (error: any) {
        console.error('Error in sendMessage controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const chatroomById = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        let { limit = 10, page = 1 } = req.query;

        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        const skip = (page - 1) * limit;

        // find room details
        let chatroom = await fetchChatRoom(id, currentUserId);


        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: "Room not found!"
            });
        }

        if (chatroom.receiver) {
            chatroom.friend = chatroom.receiver
        }

        const receiverDetail: any = await fetchUser(chatroom.receiver);
        const senderDetail: any = await fetchUser(currentUserId);

        let isBlocked = false;
        let ChatCleared;
        let chatClearedDate = null;

        ChatCleared = chatroom.messageClearStatus.find((item: any) => item.userId._id.toString() === currentUserId.toString());

        if (ChatCleared) {
            chatClearedDate = new Date(ChatCleared.clearedAt)
        }

        console.log("isChatCleared::", ChatCleared);


        const { error, message } = checkUsersBlockedEachOther(senderDetail, receiverDetail, currentUserId, chatroom);

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

        await MessageModel.updateMany({
            chatRoomId: chatroom._id, receiver: currentUserId, isBlocked: false
        }, { $set: { seen: true } })

        // all message of chatrooms
        const messages = await MessageModel.find(
            {
                chatRoomId: chatroom._id,
                $or: [
                    { isBlocked: false },
                    { isBlocked: true, sender: currentUserId },
                    // {"messageClearStatus.userId":{$ne:currentUserId}},
                    // {"messageClearStatus.userId":currentUserId,"messageClearStatus.clearedAt":{$lt:new Date()}}
                ],

                ...(ChatCleared && { createdAt: { $gt: chatClearedDate } })
            }
        ).limit(limit).skip(skip).sort({ createdAt: -1 })
            .populate([
                {
                    path: "sender",
                    select: userFieldSelectionModel,
                    populate: {
                        path: "profileImage",
                        select: fileModelFieldSelection
                    }
                },
                {
                    path: "receiver",
                    select: userFieldSelectionModel,
                    populate: {
                        path: "profileImage",
                        select: fileModelFieldSelection
                    }
                },
                {
                    path: "file",
                    select: fileModelFieldSelection
                },
                {
                    path: "seenBy",
                    select: userFieldSelectionModel,
                    populate: {
                        path: "profileImage",
                        select: fileModelFieldSelection
                    }
                }
            ])

        const totalMessage = await MessageModel.countDocuments({ chatRoomId: chatroom._id, isDeleted: false }) || 0


        chatroom.messages = messages || [];

        const totalPages = Math.ceil(totalMessage / limit)


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

    } catch (error: any) {
        console.error('Error in chatroomById controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const allChatrooms = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        let { limit = 10, page = 1, unread, favourites, search = '' } = req.query;

        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        const skip = (page - 1) * limit;

        let searchQuery = {};
        let matchQuery = {};

        if (unread === 'true') {
            matchQuery = { "unreadMessageCount": { $gt: 0 } }
        }

        if (search) {
            let regex = {
                $regex: new RegExp(search, 'i')
            }
            searchQuery = {
                $or: [
                    { "friend.fullName": regex },
                    { "friend.email": regex },
                    { "friend.username": regex }
                ]
            }
        }

        if (favourites === 'true') {
            searchQuery = { ...searchQuery, 'favouriteBy._id': new mongoose.Types.ObjectId(currentUserId) }
        }

        const chatrooms = await ChatRoomModel.aggregate([
            { $match: { participants: new mongoose.Types.ObjectId(currentUserId),deletedBy:{$ne:new mongoose.Types.ObjectId(currentUserId)}} },
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
                                cond: { $ne: ["$$user._id", new mongoose.Types.ObjectId(currentUserId)] }
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
                                cond: { $eq: ["$$item.userId", new mongoose.Types.ObjectId(currentUserId)] }
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
                    let: { chatroomId: "$_id", currentUserId: new mongoose.Types.ObjectId(currentUserId), clearAt: "$chatCleared.clearedAt" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$chatRoomId", "$$chatroomId"] },
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
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    participants: userFieldSelectionModel,
                    active: 1,
                    blocked: 1,
                    chatCleared: 1,
                    // favouriteBy:1,
                    friend: { ...userFieldSelectionModel, profileImage: fileModelFieldSelection },
                    currentMessage: { ...messageFieldSelection, sender: userFieldSelectionModel, receiver: userFieldSelectionModel },
                    unreadMessageCount: 1
                }
            }
        ])


        return res.status(200).json({
            success: true,
            message: "Detail fetched!",
            data: {
                chatrooms: chatrooms
                // total: totalMessage,
                // limit: limit,
                // page: page,
                // totalPages: totalPages,
                // chatroom: chatroom
            }
        });

    } catch (error: any) {
        console.error('Error in allChatrooms controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const deleteMessage = async (req: any, res: any) => {
    const { id, messageId } = req.params;
    try {
        const currentUserId = req.user._id;

        // find room details
        let chatroom = await fetchChatRoom(id, currentUserId);

        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Room not found!"
            });
        }

        const messagePopulate = [
            {
                path: "sender",
                select: userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: fileModelFieldSelection
                }
            },
            {
                path: "receiver",
                select: userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: fileModelFieldSelection
                }
            },
            {
                path: "file",
                select: fileModelFieldSelection
            },
            {
                path: "seenBy",
                select: userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: fileModelFieldSelection
                }
            }
        ]

        // all message of chatrooms
        const messageExist = await MessageModel.findOne({ _id: messageId, chatRoomId: chatroom._id, isDeleted: false })
            .populate(messagePopulate)

        if (!messageExist) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Message not found!"
            });
        }

        if (messageExist.sender?._id.toString() !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: IsProduction ? 'Invalid request.' : "Only sender can delete message!"
            });
        }

        const deletedMessage = await MessageModel.findOneAndUpdate({ _id: messageId }, { isDeleted: true }, { new: true }).populate(messagePopulate);

        if (mediaTypes.includes(messageExist.type)) {
            // delete file from path
        }

        const receiverDetail: any = await fetchUser(new mongoose.Types.ObjectId(messageExist.receiver._id));


        // send socket notification to receiver
        if (checkUserSocketConnected(receiverDetail.socketId)) {
            io.to(receiverDetail.socketId).emit('message_deleted', {
                type: 'chat',
                room: chatroom._id,
                data: deletedMessage
            })
        }


        return res.status(200).json({
            success: true,
            message: "Message Deleted!",
            data: deletedMessage
        });

    } catch (error: any) {
        console.error("Delete Message Error:", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const editMessage = async (req: any, res: any) => {
    const { id, messageId } = req.params;
    try {
        const currentUserId = req.user._id;
        const { message } = req.body;

        // find room details
        let chatroom = await fetchChatRoom(id, currentUserId);

        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Room not found!"
            });
        }

        const messagePopulate = [
            {
                path: "sender",
                select: userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: fileModelFieldSelection
                }
            },
            {
                path: "receiver",
                select: userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: fileModelFieldSelection
                }
            },
            {
                path: "file",
                select: fileModelFieldSelection
            },
            {
                path: "seenBy",
                select: userFieldSelectionModel,
                populate: {
                    path: "profileImage",
                    select: fileModelFieldSelection
                }
            }
        ]

        // all message of chatrooms
        const messageExist = await MessageModel.findOne({ _id: messageId, chatRoomId: chatroom._id, isDeleted: false })
            .populate(messagePopulate)

        if (!messageExist) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Message not found!"
            });
        }
        if (messageExist.type !== 'text') {
            return res.status(403).json({
                success: false,
                message: IsProduction ? 'Invalid request.' : "Only text message can be edit!"
            });
        }

        if (messageExist.sender?._id.toString() !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: IsProduction ? 'Invalid request.' : "Only sender can edit message!"
            });
        }

        const updatedMessage = await MessageModel.findOneAndUpdate({ _id: messageId }, { isEdited: true, content: message }, { new: true }).populate(messagePopulate);

        if (mediaTypes.includes(messageExist.type)) {
            // delete file from path
        }

        const receiverDetail: any = await fetchUser(new mongoose.Types.ObjectId(messageExist.receiver._id));


        // send socket notification to receiver
        if (checkUserSocketConnected(receiverDetail.socketId)) {
            io.to(receiverDetail.socketId).emit('message_edited', {
                type: 'chat',
                room: chatroom._id,
                data: updatedMessage
            })
        }


        return res.status(200).json({
            success: true,
            message: "Message updated!",
            data: updatedMessage
        });

    } catch (error: any) {
        console.error("editMessage Error:", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const updateChatRoom = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        const { addToFavourites, removeFromFavourites, block, unblock, clearMessage = false, roomDelete = false } = req.body;

        // find room details
        let chatroom = await fetchChatRoom(id, currentUserId);
        const friend: any = await fetchUser(new mongoose.Types.ObjectId(chatroom.receiver._id));

        if (!chatroom) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Room not found!"
            });
        }

        let responseMessage = ''

        if (addToFavourites) {
            await ChatRoomModel.updateOne(
                { _id: id },
                { $addToSet: { favouriteBy: currentUserId } }
            )
            responseMessage = 'Added into Favourites!'
        }
        if (removeFromFavourites) {
            await ChatRoomModel.updateOne(
                { _id: id },
                { $pull: { favouriteBy: currentUserId } }
            )
            responseMessage = 'Removed from Favourites!'
        }

        if (block) {

            await UserModel.updateOne(
                { _id: currentUserId },
                { $push: { blockedUsers: friend._id } }
            );

            await ChatRoomModel.updateOne(
                { _id: chatroom._id },
                { $addToSet: { blockStatus: { userId: currentUserId, blockedUserId: friend._id } } }
            )

            responseMessage = 'Blocked!'
        }

        if (unblock) {

            await UserModel.updateOne(
                { _id: currentUserId },
                { $pull: { blockedUsers: friend._id } }
            );
            await ChatRoomModel.updateOne(
                { _id: chatroom._id },
                { $pull: { blockStatus: { userId: currentUserId, blockedUserId: friend._id } } }
            );
            responseMessage = 'Unblocked!'
        };

        if (clearMessage) {

            await ChatRoomModel.updateOne(
                { _id: chatroom._id },
                { $pull: { messageClearStatus: { userId: currentUserId } } }
            )

            await ChatRoomModel.updateOne(
                { _id: chatroom._id },
                { $addToSet: { messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } }
            )
            responseMessage = 'Message cleared!'
        }

        if (roomDelete) {
            await ChatRoomModel.updateOne(
                { _id: chatroom._id },
                { $pull: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId } } }
            )

            await ChatRoomModel.updateOne(
                { _id: chatroom._id },
                { $push: { deletedBy: currentUserId,messageClearStatus: { userId: currentUserId, clearedAt: new Date() }  } }
            )
            responseMessage = 'Room deleted!'
        }

        return res.status(200).json({
            success: true,
            message: responseMessage
        });

    } catch (error: any) {
        console.error("updateChatRoom api Error:", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

