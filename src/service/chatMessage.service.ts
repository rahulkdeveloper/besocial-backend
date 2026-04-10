import mongoose from "mongoose";
import MessageModel from "../model/Message";
import { userFieldSelectionModel, fileModelFieldSelection } from './user.serivce'

export const messageFieldSelection = {
    _id: 1,
    content: 1,
    type: 1,
    seen: 1,
    isDeleted: 1,
    createdAt: 1
}

export const messageDetail = async (id: mongoose.ObjectId) => {
    try {

        const message = await MessageModel.findById(id)
            .populate("sender", "_id fullName email")
            .populate("receiver", "_id fullName email")
            .populate({
                path: 'file',
                select: {
                    _id: 1,
                    name: 1,
                    url: 1,
                    path: 1,
                    mimeType: 1
                }
            })
            .populate({
                path: 'seenBy',
                select: userFieldSelectionModel
            })
            .populate({
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
                    select: userFieldSelectionModel
                }
            })

        return message

    } catch (error) {
        console.log("error in messageDetail service func", error);
        return null
    }
}