import { number } from "joi";
import UserModel from "../model/user";
import mongoose from "mongoose";
import { userFieldSelection } from "../service/user.serivce";
import UserSettingModel from "src/model/UserSettings";
import { createUserSetting, modifiyUserDataBasedOnSettings } from "../service/user.serivce"

export const userList = async (req: any, res: any) => {

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
            }

            searchQuery = {
                $or: [
                    { fullName: regex },
                    { gender: regex },
                    { bio: regex },
                    { email: regex },
                    { username: regex }
                ]
            }
        }

        const pipeline: any = [];

        // console.log("pipeline::", pipeline[0]["$match"])

        pipeline.push({
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(userId) }, isAccountActive: true, isDeleted: false, blockedByAdmin: false, ...(search && searchQuery),
                ...(gender && { gender }),
            }
        })

        if (minAge) {
            minAge = parseInt(minAge)
            const currentDate = new Date();
            const filterDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - minAge));

            console.log("filterDate::",filterDate)

            pipeline.push({
                $match: {
                    dateOfBirth: { $lte: filterDate }
                }
            })
        }

        if (maxAge) {
            maxAge = parseInt(maxAge)
            const currentDate = new Date();
            const filterDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - maxAge));

            pipeline.push({
                $match: {
                    dateOfBirth: { $gte: filterDate }
                }
            })
        }


        pipeline.push({
            $lookup: {
                from: "users",
                localField: "blockedUsers",
                foreignField: "_id",
                as: "blockedUsers"
            }
        },
            {
                $lookup: {
                    from: "media",
                    localField: "profileImage",
                    foreignField: "_id",
                    as: "profileImage"
                }
            },
            {
                $unwind: {
                    path: "$profileImage",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "usersettings",
                    localField: "_id",
                    foreignField: "user",
                    as: "userSetting"
                }
            },
            {
                $unwind: {
                    path: "$userSetting",
                    preserveNullAndEmptyArrays: true
                }
            },
        )

        // filter out private account::

        pipeline.push({
            $match: {
                "userSetting.isAccountPrivate": false
            }
        })

        const countPipeline = [...pipeline, { $count: "total" }];

        pipeline.push({ $sort: { "createdAt": 1 } });

        pipeline.push({ $skip: skip }, { $limit: limit });

        pipeline.push({
            $project: userFieldSelection
        })



        const [users, totalResut] = await Promise.all([
            UserModel.aggregate(pipeline),
            UserModel.aggregate(countPipeline)
        ])

        const totalUser: any = totalResut[0]?.total || 0;
        const totalPages = Math.ceil(totalUser / limit)

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

    } catch (error) {
        console.log("error in userList controller", error);

        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const viewUserProfile = async (req: any, res: any) => {
    try {

        const { id } = req.params

        let userFieldsSelection = { ...userFieldSelection, profileImage: 1 }

        let user: any = await UserModel.findOne({ _id: id }, userFieldsSelection)
            .populate("profileImage", "path url name alt")
            .lean()

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "User not found",
                data: []
            });
        }

        const profileSettings = await UserSettingModel.findOne({ user: id }).lean();

        if (profileSettings) {
            user = modifiyUserDataBasedOnSettings(user, profileSettings);
        }


        return res.status(200).json({
            success: true,
            message: "User Fetched!",
            data: user
        });

    } catch (error) {
        console.log("error in user viewUserProfile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const userProfile = async (req: any, res: any) => {
    try {
        const currentUserId = req.user._id;

        let userFieldsSelection = { ...userFieldSelection, profileImage: 1 }

        let user: any = await UserModel.findOne({ _id: currentUserId }, userFieldsSelection)
            .populate("profileImage", "path url name alt")
            .populate("blockedUsers")
            .lean()

        const profileSettings = await UserSettingModel.findOne({ user: currentUserId }).lean();

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "User not found",
                data: []
            });
        }

        user.profileSettings = profileSettings || {}

        return res.status(200).json({
            success: true,
            message: "User Fetched!",
            data: user
        });

    } catch (error) {
        console.log("error in user profile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const updateProfile = async (req: any, res: any) => {
    try {
        const currentUserId = req.user._id;

        let { fullName, dateOfBirth, phone, gender, bio, profileImage } = req.body;

        let updateQuery = {
            ...(fullName && { fullName }),
            ...(dateOfBirth && { dateOfBirth }),
            ...(phone && { phone }),
            ...(gender && { gender }),
            ...(bio && { bio }),
            ...(profileImage && { profileImage: new mongoose.Types.ObjectId(profileImage) }),
        }

        const userUpdate = await UserModel.findOneAndUpdate(
            { _id: currentUserId },
            updateQuery,
            {
                new: true,
                select: "_id fullName username email dateOfBirth phone gender bio status profileImage"
            }
        )

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

    } catch (error) {
        console.log("error in user updateProfile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const updateProfileSetting = async (req: any, res: any) => {
    try {
        const currentUserId = req.user._id;

        let { notification, isProfileImageShow, isLastSeenShow, isOnlineShow, isAccountPrivate } = req.body;

        let updateQuery = {
            ...(notification !== undefined && { notification }),
            ...(isLastSeenShow !== undefined && { isLastSeenShow }),
            ...(isProfileImageShow !== undefined && { isProfileImageShow }),
            ...(isOnlineShow !== undefined && { isOnlineShow }),
            ...(isAccountPrivate !== undefined && { isAccountPrivate })
        }

        const update = await UserSettingModel.findOneAndUpdate(
            { user: currentUserId },
            updateQuery,
            {
                new: true,
                // select:"_id notification isProfileImageShow isLastSeenShow isOnlineShow"
            }
        )

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

    } catch (error) {
        console.log("error in user updateProfileSetting controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}


