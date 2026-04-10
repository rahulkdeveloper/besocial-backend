import mongoose, { Types } from "mongoose";
import ChatRoomModel, { IRoom } from "../model/Room";
import { userFieldSelectionModel, fileModelFieldSelection } from './user.serivce'
import { ChatroomWithUsers } from "../types/chatroom.types";
import { IUser } from "../model/user";

export const fetchChatRoom = async (id: string, userId?: Types.ObjectId): Promise<ChatroomWithUsers | null> => {

    try {

        let chatroom = await ChatRoomModel.findOne(
            { _id: id, participants: userId }
        )
            .populate([
                {
                    path: "participants",
                    select: userFieldSelectionModel,
                    populate: {
                        path: "profileImage",
                        select: fileModelFieldSelection
                    }
                },
                {
                    path: "blockStatus.userId",
                    select: userFieldSelectionModel
                },
                {
                    path: "blockStatus.blockedUserId",
                    select: userFieldSelectionModel
                },
                {
                    path: 'messageClearStatus.userId',
                    select: userFieldSelectionModel
                }
            ]).lean<ChatroomWithUsers>()

        if (chatroom && userId) {
            chatroom?.participants.map((participant) => {
                if (participant._id.toString() === userId.toString()) {
                    chatroom.sender = participant
                }
                else {
                    chatroom.receiver = participant
                }
            })

        }

        return chatroom

    } catch (error) {
        console.log("error in fetchChatRoom service func", error);
        return null

    }
}
