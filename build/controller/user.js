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
exports.updateProfileSetting = exports.updateProfile = exports.userProfile = exports.viewUserProfile = exports.userList = void 0;
const user_1 = __importDefault(require("../model/user"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_serivce_1 = require("../service/user.serivce");
const UserSettings_1 = __importDefault(require("src/model/UserSettings"));
const user_serivce_2 = require("../service/user.serivce");
const redis_1 = require("src/config/redis");
const client = (0, redis_1.getRedisClient)();
const userList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.user._id;
        let { limit, page, search = '', minAge, maxAge, gender } = req.query;
        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;
        const skip = (page - 1) * limit;
        let searchQuery;
        if (search) {
            let regex = {
                $regex: new RegExp(search, 'i')
            };
            searchQuery = {
                $or: [
                    { fullName: regex },
                    { gender: regex },
                    { bio: regex },
                    { email: regex },
                    { username: regex }
                ]
            };
        }
        const pipeline = [];
        // console.log("pipeline::", pipeline[0]["$match"])
        pipeline.push({
            $match: Object.assign(Object.assign({ _id: { $ne: new mongoose_1.default.Types.ObjectId(userId) }, isAccountActive: true, isDeleted: false, blockedByAdmin: false }, (search && searchQuery)), (gender && { gender }))
        });
        if (minAge) {
            minAge = parseInt(minAge);
            const currentDate = new Date();
            const filterDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - minAge));
            console.log("filterDate::", filterDate);
            pipeline.push({
                $match: {
                    dateOfBirth: { $lte: filterDate }
                }
            });
        }
        if (maxAge) {
            maxAge = parseInt(maxAge);
            const currentDate = new Date();
            const filterDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - maxAge));
            pipeline.push({
                $match: {
                    dateOfBirth: { $gte: filterDate }
                }
            });
        }
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "blockedUsers",
                foreignField: "_id",
                as: "blockedUsers"
            }
        }, {
            $lookup: {
                from: "media",
                localField: "profileImage",
                foreignField: "_id",
                as: "profileImage"
            }
        }, {
            $unwind: {
                path: "$profileImage",
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from: "contacts",
                let: {
                    currentUserId: new mongoose_1.default.Types.ObjectId(userId),
                    userId: "$_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    {
                                        $and: [
                                            { $eq: ["$sender", "$$userId"] },
                                            { $eq: ["$receiver", "$$currentUserId"] },
                                            { $ne: ["$status", "rejected"] }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { $eq: ["$sender", "$$currentUserId"] },
                                            { $eq: ["$receiver", "$$userId"] },
                                            { $ne: ["$status", "rejected"] }
                                        ]
                                    },
                                ]
                            }
                        }
                    }
                ],
                as: "userContacts"
            }
        }, {
            $addFields: {
                contactStatus: {
                    $let: {
                        vars: {
                            contact: { $arrayElemAt: ["$userContacts", 0] }
                        },
                        in: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $eq: ["$$contact.status", "accepted"] },
                                        then: "friend"
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $eq: ["$$contact.status", "pending"] },
                                                { $eq: ["$$contact.sender", new mongoose_1.default.Types.ObjectId(userId)] }
                                            ]
                                        },
                                        then: "pending"
                                    },
                                    {
                                        case: {
                                            $and: [
                                                { $eq: ["$$contact.status", "pending"] },
                                                { $ne: ["$$contact.sender", new mongoose_1.default.Types.ObjectId(userId)] }
                                            ]
                                        },
                                        then: "Received"
                                    }
                                ],
                                default: "unknown"
                            }
                        }
                    }
                }
            }
        }, {
            $lookup: {
                from: "usersettings",
                localField: "_id",
                foreignField: "user",
                as: "userSetting"
            }
        }, {
            $unwind: {
                path: "$userSetting",
                preserveNullAndEmptyArrays: true
            }
        });
        // filter out private account::
        pipeline.push({
            $match: {
                "userSetting.isAccountPrivate": false
            }
        });
        const countPipeline = [...pipeline, { $count: "total" }];
        pipeline.push({ $sort: { "createdAt": 1 } });
        pipeline.push({ $skip: skip }, { $limit: limit });
        pipeline.push({
            $project: Object.assign(Object.assign({}, user_serivce_1.userFieldSelection), { userContacts: { $arrayElemAt: ["$userContacts", 0] }, contactStatus: 1 })
        });
        const [users, totalResut] = yield Promise.all([
            user_1.default.aggregate(pipeline),
            user_1.default.aggregate(countPipeline)
        ]);
        const totalUser = ((_a = totalResut[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
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
        console.log("error in userList controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.userList = userList;
const viewUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        let userFieldsSelection = Object.assign(Object.assign({}, user_serivce_1.userFieldSelection), { profileImage: 1 });
        let user = yield user_1.default.findOne({ _id: id }, userFieldsSelection)
            .populate("profileImage", "path url name alt")
            .lean();
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "User not found",
                data: []
            });
        }
        const profileSettings = yield UserSettings_1.default.findOne({ user: id }).lean();
        if (profileSettings) {
            user = (0, user_serivce_2.modifiyUserDataBasedOnSettings)(user, profileSettings);
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
        const cacheKey = `profile:${currentUserId}`;
        const cachedData = yield client.get(cacheKey);
        if (cachedData) {
            const data = JSON.parse(cachedData);
            return res.status(200).json({
                success: true,
                message: "User Fetched!",
                data: data
            });
        }
        let userFieldsSelection = Object.assign(Object.assign({}, user_serivce_1.userFieldSelection), { profileImage: 1 });
        let user = yield user_1.default.findOne({ _id: currentUserId }, userFieldsSelection)
            .populate("profileImage", "path url name alt")
            .populate("blockedUsers")
            .lean();
        const profileSettings = yield UserSettings_1.default.findOne({ user: currentUserId }).lean();
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "User not found",
                data: []
            });
        }
        user.profileSettings = profileSettings || {};
        yield client.set(cacheKey, JSON.stringify(user), {
            EX: 900,
        });
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
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user._id;
        let { fullName, dateOfBirth, phone, gender, bio, profileImage, isOnBoardCompleted } = req.body;
        let updateQuery = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (fullName && { fullName })), (dateOfBirth && { dateOfBirth })), (phone && { phone })), (gender && { gender })), (bio && { bio })), (isOnBoardCompleted === true && { isOnBoardCompleted: true })), (profileImage && { profileImage: new mongoose_1.default.Types.ObjectId(profileImage) }));
        const userUpdate = yield user_1.default.findOneAndUpdate({ _id: currentUserId }, updateQuery, {
            new: true,
            select: "_id fullName username email dateOfBirth phone gender bio status profileImage isOnBoardCompleted"
        });
        if (!userUpdate) {
            return res.status(500).json({
                success: true,
                message: "Some error occured while updating profile",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            data: userUpdate
        });
    }
    catch (error) {
        console.log("error in user updateProfile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.updateProfile = updateProfile;
const updateProfileSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUserId = req.user._id;
        let { notification, isProfileImageShow, isLastSeenShow, isOnlineShow, isAccountPrivate } = req.body;
        let updateQuery = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (notification !== undefined && { notification })), (isLastSeenShow !== undefined && { isLastSeenShow })), (isProfileImageShow !== undefined && { isProfileImageShow })), (isOnlineShow !== undefined && { isOnlineShow })), (isAccountPrivate !== undefined && { isAccountPrivate }));
        const update = yield UserSettings_1.default.findOneAndUpdate({ user: currentUserId }, updateQuery, {
            new: true,
            // select:"_id notification isProfileImageShow isLastSeenShow isOnlineShow"
        });
        if (!update) {
            return res.status(500).json({
                success: true,
                message: "Some error occured while updating settings",
                data: []
            });
        }
        return res.status(200).json({
            success: true,
            message: "Profile settings updated successfully!",
            data: update
        });
    }
    catch (error) {
        console.log("error in user updateProfileSetting controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.updateProfileSetting = updateProfileSetting;
