import GroupChatModel from "../model/GroupChat";
import UserModel from "../model/user";
import ChatRoomModel from "../model/Room";
import { messageDetail, messageFieldSelection } from '../service/chatMessage.service';
import MessageModel from "../model/Message";
import { fetchUser, checkUsersBlockedEachOther, userFieldSelectionModel, fileModelFieldSelection } from '../service/user.serivce';
import { io } from "../app";
import { checkUserSocketConnected } from '../service/socket'
import mongoose from "mongoose";
import { mediaTypes } from '../config/constant';
import { singleGroupDetail } from '../service/group.service'

const IsProduction = process.env.NODE_ENV as string === 'production';


export const createGroup = async (req: any, res: any) => {
    let { name, description, participants = [], groupImage } = req.body;
    try {

        const currentUserId = req.user._id;
        const admin = currentUserId;

        // check name already exist with same user;

        const groupExist = await GroupChatModel.findOne({
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
            participants = await Promise.all(participants.map(async (participant: any) => {

                const chatroomExist = await ChatRoomModel.findOne(
                    { participants: { $all: [currentUserId, participant] } }
                ).
                    populate("participants", "name email")


                if (chatroomExist) {
                    return participant
                }
            }))
        }
        participants = [...participants, admin];

        participants = participants.filter((n: any) => n)

        const groupChatData: any = {
            name,
            description,
            admin,
            participants,
        }

        if (groupImage) {
            groupChatData.groupImage = groupImage
        }

        const newGroup = await GroupChatModel.create(groupChatData);

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

    } catch (error: any) {
        console.error("Error in createGroup controller fn::", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const addMembers = async (req: any, res: any) => {
    const { id } = req.params;
    const groupId = id;
    let { members = [] } = req.body;
    try {

        const currentUserId = req.user._id;

        // check name already exist with same user;

        const groupExist = await GroupChatModel.findOne({
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

        participants = participants.map((participant: any) => participant.toString())

        // remove existing members::
        members = members.filter((member: any) => !participants.includes(member));

        // check all members is friend of current user or not

        if (members.length > 0) {
            members = await Promise.all(members.map(async (member: any) => {

                const chatroomExist = await ChatRoomModel.findOne(
                    { participants: { $all: [currentUserId, member] } }
                ).
                    populate("participants", "name email")


                if (chatroomExist) {
                    return member
                }
            }))
        }
        participants = [...participants, ...members];

        participants = participants.filter((n: any) => n)


        const updatedGroup = await GroupChatModel.findOneAndUpdate(
            { _id: groupId },
            { participants: participants },
            { new: true }
        ).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')

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

    } catch (error: any) {
        console.error("Error in createGroup controller fn::", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const groupChatById = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;

        let { limit = 10, page = 1 } = req.query;

        limit = limit ? parseInt(limit) : 10
        page = page ? parseInt(page) : 1

        const skip = (page - 1) * limit;


        let group: any = await GroupChatModel.findOne(
            { _id: id },
        ).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')
            .populate([
                {
                    path: "groupImage",
                    select: fileModelFieldSelection
                }
            ]).lean()

        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }

        let ChatCleared;
        let chatClearedDate = null;

        ChatCleared = group.messageClearStatus.find((item: any) => item.userId.toString() === currentUserId.toString());

        if (ChatCleared) {
            chatClearedDate = new Date(ChatCleared.clearedAt)
        }

        // make all message seen in this chatroom by currentUser
        await MessageModel.updateMany({
            group: group._id,seenBy:{$ne:currentUserId}
        }, { $push: { seenBy: currentUserId } })

        // all message of chatrooms
        const messages = await MessageModel.find(
            {
                group: group._id,
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
            ]);

        const totalMessage = await MessageModel.countDocuments({ group: group._id }) || 0

        group.messages = messages || [];

        const totalPages = Math.ceil(totalMessage / limit)

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

    } catch (error: any) {
        console.error("Error in createGroup controller fn::", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const sendMessage = async (req: any, res: any) => {
    const { id } = req.params;
    const currentUserId = req.user._id;
    const { message = '', type = 'text', file, fileText = '' } = req.body;
    try {

        // find room details
        const groupChatroom = await singleGroupDetail(id, currentUserId);

        if (!groupChatroom) {
            return res.status(404).json({
                success: false,
                message: "Group not found!"
            });
        }

        if (mediaTypes.includes(type) && !file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded!"
            });
        }

        // check user permission::
        const isAdmin = currentUserId.toString() === groupChatroom.admin?._id.toString();

        if (!isAdmin && !groupChatroom.isParticipantsCanSendMessage) {
            return res.status(401).json({
                success: false,
                message: "Only Admin can send message!"
            });
        }

        let participants: any = groupChatroom.participants;

        let messageData: any = {
            sender: currentUserId,
            content: message,
            type: type,
            group: groupChatroom._id,
            seenBy: [currentUserId]
        }


        if (file) {
            messageData.file = file;
        }

        if (file && fileText) {
            messageData.fileText = fileText
        }

        // // create new message;
        let newMessage: any = await MessageModel.create(messageData);


        // // check someone deleted his chatroom now active;

        // if(chatroom.deletedBy.length>0 && newMessage){
        //     await ChatRoomModel.findOneAndUpdate(
        //         {_id:chatroom._id},
        //         {deletedBy:[]}
        //     )
        // }

        newMessage = await messageDetail(newMessage._id)

        if (!newMessage) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured, Please try again!"
            });
        }

        // send socket notification to particapinats except sender

        participants = participants.filter((participant: any) => participant._id.toString() !== currentUserId.toString());

        for (const participant of participants) {
            if (checkUserSocketConnected(participant.socketId)) {
                io.to(participant.socketId).emit('group_message_received', {
                    type: 'groupChat',
                    // room: chatroom._id,
                    group: groupChatroom._id,
                    data: newMessage
                })
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

    } catch (error: any) {
        console.error('Error in group sendMessage controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const updateChatRoom = async (req: any, res: any) => {
    const { id: groupId } = req.params;
    try {
        const currentUserId = req.user._id;
        const { addToFavourites, removeFromFavourites, groupImage, isParticipantsCanSendMessage, isParticipantsCanAddMembers, isParticipantsCanModifyGroupImage, clearMessage = false, roomDelete = false, removeMemberIds = [] } = req.body;

        const group = await GroupChatModel.findOne(
            { _id: groupId },
        ).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')


        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }

        const isAdmin = currentUserId.toString() === group.admin?._id.toString();

        let responseMessage = '';
        let groupUpdateQuery: any = {};

        if (isAdmin && (isParticipantsCanSendMessage === true || isParticipantsCanSendMessage === false)) {
            groupUpdateQuery.isParticipantsCanSendMessage = isParticipantsCanSendMessage;
        }

        if (isAdmin && (isParticipantsCanModifyGroupImage === true || isParticipantsCanModifyGroupImage === false)) {
            groupUpdateQuery.isParticipantsCanModifyGroupImage = isParticipantsCanModifyGroupImage;
        }

        if (isAdmin && (isParticipantsCanAddMembers === true || isParticipantsCanAddMembers === false)) {
            groupUpdateQuery.isParticipantsCanAddMembers = isParticipantsCanAddMembers
        };


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

        responseMessage = 'Updated!'




        if (isAdmin && removeMemberIds.length > 0) {
            let existingParticipants = group.participants.map((participant: any) => participant._id.toString());
            console.log("existingParticipants::", existingParticipants);
            const participants: any = [];

            existingParticipants.map((participant: any) => {
                if (!removeMemberIds.includes(participant)) {
                    participants.push(participant)
                }
            })

            console.log("participants::", participants);

            groupUpdateQuery.participants = participants;
            responseMessage = 'Member removed successfully!'
        }

        let updatedGroup = await GroupChatModel.findOneAndUpdate(
            { _id: group._id },
            groupUpdateQuery,
            { new: true }
        )
            .populate('admin', '_id username fullName email')

        return res.status(200).json({
            success: true,
            message: responseMessage,
            data: updatedGroup
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

export const favouriteAndUnFavourite = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;
        const { favourite, unFavourite } = req.body;

        const group = await GroupChatModel.findOne(
            { _id: id },
        ).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')


        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }

        let responseMessage = ''

        if (favourite) {
            await GroupChatModel.updateOne(
                { _id: id },
                { $pull: { favouriteBy: currentUserId } }
            )

            await GroupChatModel.updateOne(
                { _id: id },
                { $addToSet: { favouriteBy: currentUserId } }
            )
            responseMessage = 'Added into Favourites!'
        }
        if (unFavourite) {
            await GroupChatModel.updateOne(
                { _id: id },
                { $pull: { favouriteBy: currentUserId } }
            )
            responseMessage = 'Removed from Favourites!'
        }

        return res.status(200).json({
            success: true,
            message: responseMessage
        });

    } catch (error: any) {
        console.error("favouriteAndUnFavourite api Error:", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const clearMessage = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;

        const group = await GroupChatModel.findOne(
            { _id: id },
        ).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')


        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }

        await GroupChatModel.updateOne(
            { _id: group._id },
            { $pull: { messageClearStatus: { userId: currentUserId } } }
        )

        await GroupChatModel.updateOne(
            { _id: group._id },
            { $addToSet: { messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } }
        )

        return res.status(200).json({
            success: true,
            message: "Message cleared!"
        });

    } catch (error: any) {
        console.error("clearMessage api Error:", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}

export const deleteGroupByMember = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const currentUserId = req.user._id;

        const group = await GroupChatModel.findOne(
            { _id: id },
        ).populate('participants', '_id username fullName email')
            .populate('admin', '_id username fullName email')


        if (!group) {
            return res.status(404).json({
                success: false,
                message: IsProduction ? 'The requested content could not be found.' : "Group not found!"
            });
        }
        const isAdmin = currentUserId.toString() === group.admin?._id.toString();

        // if (isAdmin) {
        //     await GroupChatModel.updateOne(
        //         { _id: group._id },
        //         { isDeleted: true }
        //     )
        // }

        await GroupChatModel.updateOne(
            { _id: group._id },
            { $pull: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId } } }
        )

        await GroupChatModel.updateOne(
            { _id: group._id },
            { $push: { deletedBy: currentUserId, messageClearStatus: { userId: currentUserId, clearedAt: new Date() } } }
        )

        return res.status(200).json({
            success: true,
            message: "Group removed!"
        });

    } catch (error: any) {
        console.error("deleteGroupByMember api Error:", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}