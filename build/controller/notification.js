"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const Notification_1 = __importDefault(require("../model/Notification"));
const user_serivce_1 = require("../service/user.serivce");
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { status = "pending", limit, page } = req.query;
    try {
        const currentUserId = req.user._id;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        const notifications = yield Notification_1.default.find({
            user: currentUserId
        })
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 })
            .populate({
            path: "contactRequestId",
            select: {
                "_id": 1,
                "status": 1
            },
            populate: [
                {
                    path: "sender",
                    select: user_serivce_1.userFieldSelectionContactModel
                },
                {
                    path: "receiver",
                    select: user_serivce_1.userFieldSelectionContactModel
                }
            ]
        });
        const totalResut = yield Notification_1.default.countDocuments({
            user: currentUserId
        });
        // mark all notification of current user as read
        yield Notification_1.default.updateMany({ user: currentUserId }, { $set: { isRead: true } });
        const total = totalResut || 0;
        const totalPages = Math.ceil(total / limit);
        if (notifications.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Data not found",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "Data fetched!",
            data: {
                total: total,
                limit: limit,
                page: page,
                totalPages: totalPages,
                notifications: notifications
            }
        });
    }
    catch (error) {
        console.error('Error in listContactRequest controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.list = list;
