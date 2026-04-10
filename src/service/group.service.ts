import GroupChatModel from "../model/GroupChat";
import mongoose, { Types } from "mongoose";
import {userFieldSelectionModel,fileModelFieldSelection} from './user.serivce'

export const singleGroupDetail = async(groupId:Types.ObjectId,userId?: mongoose.ObjectId) => {

    try {
        const group = await GroupChatModel.findOne({
            _id:groupId,
            participants:userId
        }) 
        .populate([
            {
                path:"admin",
                select:userFieldSelectionModel
            },
            {
                path:"participants",
                select:{...userFieldSelectionModel,socketId:1}
            },
            {
                path:"groupImage",
                select:fileModelFieldSelection
            }
        ])


        return group
        
    } catch (error) {
        console.log("error in singleGroupDetail serivce fn::", error);
        return false
    }
}