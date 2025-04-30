"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationContent = exports.emailTemplateName = void 0;
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
        description: `Hii {{username}} accepted your friend request send. Now you can chat with him.`
    },
    rejectContactRequest: {
        title: "Friend Request Rejected | Besocial",
        description: `Hii {{username}} rejected your friend request send. Don't worry explore new friends.`
    },
};
