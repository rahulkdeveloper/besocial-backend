import { required } from 'joi';
import mongoose, { Schema, Document,Types } from 'mongoose';

enum Gender {
  male = "male",
  female = "female",
  other = "other"
}

// Interface for User Document
export interface IUser extends Document {
  _id:Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  username: string;
  dateOfBirth?: Date; // Optional field
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileImage?: mongoose.Types.ObjectId;
  phone: string;
  gender: Gender;
  bio: string;
  lastSeen: Date;
  lastLoginAt: Date;
  status: "online" | "offline";
  blockedUsers: mongoose.Types.ObjectId[];
  resetPasswordToken: string;
  socketId: string;
  isDeleted: boolean;
  isAccountActive: boolean;
  blockedByAdmin:boolean;
  isOnBoardCompleted:boolean;
}

// Define the User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    profileImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    phone: {
      type: String,
      // required: true
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true, // If gender is required, set this to true
    },
    bio: {
      type: String,
    },
    lastSeen: {
      type: Date
    },
    status: {
      type: String,
      enum: ["offline", "online"],
      default: "offline"
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastLoginAt: {
      type: Date
    },
    resetPasswordToken: {
      type: String
    },
    socketId: {
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isAccountActive: {
      type: Boolean,
      default: true
    },
    blockedByAdmin: {
      type: Boolean,
      default: false
    },
    isOnBoardCompleted: {
      type: Boolean,
      default: false
    }

  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({username:1});
UserSchema.index({fullName:1});
UserSchema.index({gender:1});


// Create the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
