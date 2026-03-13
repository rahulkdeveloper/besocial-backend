import mongoose from "mongoose";
import { IMessage } from "src/model/Message";
import { IRoom } from "src/model/Room";
import { IUser } from "src/model/user";

export interface IChatroomPopulated extends Omit<IRoom,"participants">{
    participants:IUser[]
}

export interface ChatroomWithUsers extends IChatroomPopulated {
    sender?:IUser;
    receiver?:IUser;
    friend?:IUser;
    messages?:IMessage[];
    deletedFor?:mongoose.Types.ObjectId[]
}