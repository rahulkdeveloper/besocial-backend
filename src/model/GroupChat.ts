import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IGroupChat extends Document {
    name:string;
    description:string;
    active:boolean;
    admin:mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    profileImage:mongoose.Types.ObjectId;
    isAdminCanSendMessage:boolean
}

// Define the User Schema
const GroupChatSchema: Schema<IGroupChat> = new Schema(
    {
        name:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        admin:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        }],
        profileImage:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media', // Reference to the 'User' model
        },
        active:{
            type:Boolean,
            default:true
        },
        isAdminCanSendMessage:{
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
