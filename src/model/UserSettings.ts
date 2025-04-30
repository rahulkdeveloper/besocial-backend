
import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IUserSetting extends Document {
    user: mongoose.Types.ObjectId,
    notification: boolean,
    isProfileImageShow: boolean,
    isLastSeenShow: boolean,
    isOnlineShow: boolean,
    isAccountPrivate:boolean,
    theme:"light"|"dark"
}

// Define the User Schema
const UserSettingSchema: Schema<IUserSetting> = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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
        isAccountPrivate:{
            type:Boolean,
            default:false
        },
        theme:{
            type:String,
            enum:["light","dark"],
            default:"light"
        }

    },
    {
        timestamps: true,
    }
);

// Create the User model
const UserSetting = mongoose.model<IUserSetting>('UserSetting', UserSettingSchema);

export default UserSetting;
