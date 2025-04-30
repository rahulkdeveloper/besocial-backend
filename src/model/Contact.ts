import mongoose, { Schema, Document } from 'mongoose';

// Interface for User Document
export interface IContact extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "rejected" | "blocked",

}

// Define the User Schema
const ContactSchema: Schema<IContact> = new Schema(
    {
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "blocked"],
            default: "pending",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

ContactSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Create the User model
const Contact = mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
