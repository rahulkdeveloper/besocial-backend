import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IRoom extends Document {
    participants: mongoose.Types.ObjectId[];
    active:boolean;
    blocked:boolean;
}

// Define the User Schema
const ChatRoomSchema: Schema<IRoom> = new Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        }],
        active:{
            type:Boolean,
            default:true
        },
        blocked:{
            type:Boolean,
            default:true
        },


    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the User model
const ChatRoom = mongoose.model<IRoom>('ChatRoom', ChatRoomSchema);

export default ChatRoom;
