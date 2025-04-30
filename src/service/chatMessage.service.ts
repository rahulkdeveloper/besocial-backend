import mongoose from "mongoose";
import MessageModel from "src/model/Message";

export const messageFieldSelection = {
    _id:1,
    content:1,
    type:1,
    seen:1,
    isDeleted:1
}

export const messageDetail = async (id: mongoose.ObjectId) => {
    try {

        const message = await MessageModel.findById(id)
            .populate("sender", "_id fullName email")
            .populate("receiver", "_id fullName email")
            .populate({
                path:'file',
                select:{
                    _id:1,
                    name:1,
                    url:1,
                    path:1,
                    mimeType:1
                }
            })

        return message

    } catch (error) {
        console.log("error in messageDetail service func",error);
        return null
    }
}