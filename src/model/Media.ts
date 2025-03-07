import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IMedia extends Document {
    user: mongoose.Types.ObjectId,
    fileType: 'image'|'audio'|'video',
    url: String,
    size: String,
    name: String,
    folderName:String,
    alt?:string,
    mimeType:string
}

// Define the User Schema
const MediaSchema: Schema<IMedia> = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        },
        fileType:{
            type:String,
            enum:["image","audio","video","file"],
            required:true
        },
        url:{
            type:String,
            required:true
        },
        size:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        folderName:{
            type:String,
            required:true
        },
        alt:{
            type:String
        },
        mimeType:{
            type:String
        }

    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the User model
const Media = mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
