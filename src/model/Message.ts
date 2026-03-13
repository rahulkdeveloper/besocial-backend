import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    chatRoomId: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    type: "text" | "audio" | "video" | "image" | "video" | "file";
    content: string;
    file: mongoose.Types.ObjectId;
    fileText: string;
    seen: boolean;
    seenBy: mongoose.Types.ObjectId[];
    deletedFor: mongoose.Types.ObjectId[];
    isDeleted: boolean;
    isEdited: boolean;
    isBlocked: boolean;
}

// Define the User Schema
const MessageSchema: Schema<IMessage> = new Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
        },

        content: {
            type: String,
        },
        chatRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom',
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GroupChat',
        },
        type: {
            type: String,
            enum: ["text", "audio", "video", "image", "file"],
            default: "text"
        },
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        deletedFor: [{  // which user deleted (deleted for me)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media',
        },
        fileText: {
            type: String
        },

        seen: {
            type: Boolean,
            default: false
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        isDeleted: { // deleted for everyone (sender and receiver)
            type: Boolean,
            default: false
        },
        isBlocked: {
            type: Boolean,
            default: false
        },



    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the User model
const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
