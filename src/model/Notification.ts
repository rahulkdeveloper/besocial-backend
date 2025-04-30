import mongoose, { Schema, Document } from 'mongoose';

// Interface for Notification Document
export interface INotification extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    isRead: boolean;
    description: string;
    contactRequestId:mongoose.Types.ObjectId;
}

// Define the Notification Schema
const NotificationSchema: Schema<INotification> = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the 'User' model
            required: true,
        },
        contactRequestId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact', // Reference to the 'User' model
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the Notification model
const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
