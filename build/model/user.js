"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
var Gender;
(function (Gender) {
    Gender["male"] = "male";
    Gender["female"] = "female";
    Gender["other"] = "other";
})(Gender || (Gender = {}));
// Define the User Schema
const UserSchema = new mongoose_1.Schema({
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
        type: mongoose_1.default.Schema.Types.ObjectId,
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
            type: mongoose_1.default.Schema.Types.ObjectId,
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
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ fullName: 1 });
UserSchema.index({ gender: 1 });
// Create the User model
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;
