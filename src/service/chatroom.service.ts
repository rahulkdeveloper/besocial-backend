import mongoose from "mongoose";
import ChatRoomModel from "src/model/Room";
import {userFieldSelectionModel,fileModelFieldSelection} from './user.serivce'

export const fetchChatRoom = async (id: mongoose.ObjectId, userId?: mongoose.ObjectId) => {
    console.log("insdie the fetchChatRoom", id, userId);

    try {

        let chatroom: any = await ChatRoomModel.findOne(
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
                    select:userFieldSelectionModel
                },
                {
                    path: "blockStatus.blockedUserId",
                    select:userFieldSelectionModel
                },
                {
                    path:'messageClearStatus.userId',
                    select:userFieldSelectionModel
                }
            ]).lean()

        if (chatroom && userId) {
            chatroom.participants.map((participant: any) => {
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
