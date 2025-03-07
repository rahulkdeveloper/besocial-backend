
import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IUserSetting extends Document {
    user: mongoose.Types.ObjectId,
    notification: boolean,
    isProfileImageShow: boolean,
    isLastSeenShow: boolean,
    isOnlineShow: boolean,
    theme:"light"|"dark"
}

// Define the User Schema
const UserSettingSchema: Schema<IUserSetting> = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        },
        notification:{
            type:Boolean,
            default:true
        },
        isProfileImageShow:{
            type:Boolean,
            default:true
        },
        isLastSeenShow:{
            type:Boolean,
            default:true
        },
        isOnlineShow:{
            type:Boolean,
            default:true
        },
        theme:{
            type:String,
            enum:["light","dark"],
            default:"light"
        }

    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the User model
const UserSetting = mongoose.model<IUserSetting>('UserSetting', UserSettingSchema);

export default UserSetting;
