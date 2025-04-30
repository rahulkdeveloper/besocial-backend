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
exports.userProfile = exports.viewUserProfile = exports.userList = void 0;
const user_1 = __importDefault(require("../model/user"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_serivce_1 = require("../service/user.serivce");
const userList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        let { limit, page } = req.query;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        const pipeline = [];
        pipeline.push({
            $lookup: {
                from: "User",
                localField: "blockedUsers",
                foreignField: "_id",
                as: "blockedUsers"
            }
        });
        pipeline.push({ $match: { _id: { $ne: new mongoose_1.default.Types.ObjectId(userId) }, isAccountActive: true } });
        const countPipeline = [...pipeline, { $count: "total" }];
        pipeline.push({ $sort: { "createdAt": 1 } });
        pipeline.push({ $skip: skip }, { $limit: limit });
        pipeline.push({
            $project: user_serivce_1.userFieldSelection
        });
        console.log("pipeline::", pipeline);
        const [users, totalResut] = yield Promise.all([
            user_1.default.aggregate(pipeline),
            user_1.default.aggregate(countPipeline)
        ]);
        console.log("totalResut::", totalResut);
        console.log("users::", users);
        const totalUser = totalResut[0].total || 0;
        const totalPages = Math.ceil(totalUser / limit);
        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Users not found",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "User Fetched!",
            data: {
                total: totalUser,
                limit: limit,
                page: page,
                totalPages: totalPages,
                users: users
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.userList = userList;
const viewUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_1.default.aggregate([
            {
                $lookup: {
                    from: "User",
                    localField: "blockedUsers",
                    foreignField: "_id",
                    as: "blockedUsers"
                }
            },
            { $match: { _id: new mongoose_1.default.Types.ObjectId(id) } },
            {
                $project: user_serivce_1.userFieldSelection
            }
        ]);
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "User not found",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "User Fetched!",
            data: user
        });
    }
    catch (error) {
        console.log("error in user viewUserProfile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.viewUserProfile = viewUserProfile;
const userProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user._id;
        const pipeline = [];
        const user = yield user_1.default.aggregate([
            {
                $lookup: {
                    from: "User",
                    localField: "blockedUsers",
                    foreignField: "_id",
                    as: "blockedUsers"
                }
            },
            { $match: { _id: new mongoose_1.default.Types.ObjectId(currentUserId) } },
            {
                $project: user_serivce_1.userFieldSelection
            }
        ]);
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "User not found",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "User Fetched!",
            data: user
        });
    }
    catch (error) {
        console.log("error in user profile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.userProfile = userProfile;
