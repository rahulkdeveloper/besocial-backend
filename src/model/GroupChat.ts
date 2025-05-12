import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IGroupChat extends Document {
    name: string;
    description: string;
    active: boolean;
    admin: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    favouriteBy: mongoose.Types.ObjectId[];
    messageClearStatus: {
        userId: mongoose.Types.ObjectId,
        clearedAt: Date
    }[];
    groupImage: mongoose.Types.ObjectId;
    isParticipantsCanSendMessage: boolean;
    isParticipantsCanAddMembers: boolean
    isParticipantsCanModifyGroupImage: boolean;
    isDeleted:boolean;
    deletedBy:mongoose.Types.ObjectId[];
}

// Define the User Schema
const GroupChatSchema: Schema<IGroupChat> = new Schema(
    {
        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        }],
        groupImage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media', // Reference to the 'User' model
        },
        favouriteBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        messageClearStatus: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            clearedAt: {
                type: Date,
            }
        }],
        deletedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        active: {
            type: Boolean,
            default: true
        },
        isParticipantsCanSendMessage: {
            type: Boolean,
            default: true
        },
        isParticipantsCanAddMembers: {
            type: Boolean,
            default: true
        }
        ,
        isParticipantsCanModifyGroupImage: {
            type: Boolean,
            default: true
        },
        isDeleted:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the User model
const GroupChat = mongoose.model<IGroupChat>('GroupChat', GroupChatSchema);

export default GroupChat;
