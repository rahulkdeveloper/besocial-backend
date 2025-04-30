import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IRoom extends Document {
    participants: mongoose.Types.ObjectId[];
    favouriteBy: mongoose.Types.ObjectId[];
    blockStatus: {
        userId: mongoose.Types.ObjectId,
        blockedUserId: mongoose.Types.ObjectId
    }[];
    messageClearStatus: {
        userId: mongoose.Types.ObjectId,
        clearedAt: Date
    }[];
    active: boolean;
    blocked: boolean;
    deletedBy:mongoose.Types.ObjectId[];
}

// Define the User Schema
const ChatRoomSchema: Schema<IRoom> = new Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        }],
        favouriteBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        blockStatus: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required:true
            },
            blockedUserId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            }
        }],
        messageClearStatus: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required:true
            },
            clearedAt:{
                type: Date,
            }
        }],
        deletedBy:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],

        active: {
            type: Boolean,
            default: true
        },
        blocked: {
            type: Boolean,
            default: false
        },


    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the User model
const ChatRoom = mongoose.model<IRoom>('ChatRoom', ChatRoomSchema);

export default ChatRoom;
