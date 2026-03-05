"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaTypes = exports.notificationContent = exports.emailTemplateName = void 0;
exports.emailTemplateName = {
    forgotPassword: "forgotPassword"
};
exports.notificationContent = {
    sendAddContact: {
        title: "Friend Request Received | Besocial",
        description: `Hii {{username}} you have received new  friend request. Just check and update him.`
    },
    acceptContactRequest: {
        title: "Friend Request Accepted | Besocial",
        description: `Hii {{username}}, {{friendName}} accepted your friend request. Now you can chat with him.`
    },
    rejectContactRequest: {
        title: "Friend Request Rejected | Besocial",
        description: `Hii {{username}}, {{friendName}} rejected your friend request. Don't worry explore new friends.`
    },
};
exports.mediaTypes = ["audio", "video", "image", "file"];
