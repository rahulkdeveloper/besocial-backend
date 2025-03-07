import { required } from 'joi';
import mongoose, { Schema, Document } from 'mongoose';

enum Gender{
    male="male",
    female="female",
    other="other"
}

// Interface for User Document
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: Date; // Optional field
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileImage?:string;
  phone:string;
  gender:Gender;
  bio:string;
  lastSeen:Date;
  status:"online"|"offline";
  resetPasswotdToken:string;
  blockedUsers:mongoose.Types.ObjectId;
}

// Define the User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
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
    profileImage:{
        type:String,
        required: false,
    },
    phone:{
        type:String,
        required:true
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true, // If gender is required, set this to true
    },
    bio:{
      type:String,
      required:true
    },
    lastSeen:{
      type:Date
    },
    status:{
      type:String,
      enum:["offline","online"],
      default:"offline"
    },
    resetPasswotdToken:{
      type:String
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

UserSchema.index({ email: 1 });  // Ascending index on email
UserSchema.index({ phone: 1 });  // Ascending index on phone

// Create the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
