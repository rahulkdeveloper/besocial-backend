import UserModel from "../model/user";
import { verifyJwtToken } from "../helper/utils";
import UserSettingModel, { IUserSetting } from "src/model/UserSettings";
import mongoose, { Types } from "mongoose";

export const userFieldSelection = {
    _id: 1,
    fullName: 1,
    username: 1,
    email: 1,
    dateOfBirth: 1,
    phone: 1,
    gender: 1,
    bio: 1,
    status: 1,
    profileImage: "$profileImage.url",
    age: {
        $floor: {
            $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                1000 * 60 * 60 * 24 * 365.25
            ]
        }
    },
    // userContacts:1
}

export const userFieldSelectionContactModel = {
    _id: 1,
    fullName: 1,
    username: 1,
    email: 1,
    status: 1,
}

export const userFieldSelectionModel = {
    _id: 1,
    fullName: 1,
    username: 1,
    email: 1,
    bio: 1,
    status: 1,
    lastSeen:1
}

export const fileModelFieldSelection = {
    _id: 1,
    url: 1,
    path: 1,
    name: 1
}

export const modifiyUserDataBasedOnSettings = (userData: any, userProfileSettings: any) => {

    if (!userProfileSettings.isOnlineShow) {
        delete userData.isOnlineShow
    }

    if (!userProfileSettings.isProfileImageShow) {
        delete userData.profileImage
    }

    return userData
}

export const updateSocketId = async (token: string, socketId = '') => {
    try {

        let decode: any = await verifyJwtToken(token);

        console.log("decode::", decode)

        if (!decode) {
            return false
        }

        const user: any = await UserModel.findOne({ _id: decode._id }).lean();

        if (!user) {
            return false
        }

        await UserModel.findOneAndUpdate({ _id: user._id }, { socketId });
        return true
    } catch (error) {
        console.log("error in update user serivce fn::", error);
        return false

    }
}

export const createUserSetting = async (userId: mongoose.ObjectId, data: IUserSetting | {}) => {
    try {

        let userSettingObj = {
            user: userId,
            ...data
        }

        const userSetting = await UserSettingModel.create(userSettingObj);

        if (userSetting) {
            return userSetting
        }
        else {
            return {}
        }

    } catch (error) {
        console.log("error in update createUserSetting serivce fn::", error);
        return {}

    }
}

export const fetchUser = async (userId: Types.ObjectId | string) => {
    try {

        const user = await UserModel.findOne(
            { _id: userId }
        ).populate([
            {
                path: "profileImage",
                select: fileModelFieldSelection
            },
            {
                path: "blockedUsers",
                select: {
                    _id: 1,
                    email: 1,
                    username: 1,
                    fullName: 1,
                }
            }
        ]).lean();

        return user

    } catch (error) {
        console.log("error in fetchUser service func", error);
        return null
    }
}

export const checkUsersBlockedEachOther = (senderDetail: any, receiverDetail: any, currentUserId: mongoose.ObjectId, chatroom: any) => {

    let returnMessage = { error: false, message: '', statusCode: 200, blockedByMe: false };


    if (chatroom && chatroom.blockStatus?.length > 0) {

        const isBlocked = chatroom.blockStatus.some((item: any) => item.userId._id.toString() === currentUserId.toString());

        if (isBlocked) {

            return { error: true, message: 'You have blocked this user!', statusCode: 403, blockedByMe: true }
        }
        else {
            return { error: true, message: 'Receiver has been blocked you!', statusCode: 403, blockedByMe: false }

        }
    }

    if (senderDetail && senderDetail?.blockedUsers.length > 0) {
        let isBlocked = senderDetail.blockedUsers.some((user: any) => user._id.toString() === receiverDetail._id.toString());
        if (isBlocked) {
            returnMessage = { error: true, message: 'You have blocked this user!', statusCode: 403, blockedByMe: true }
        }
    }

    if (receiverDetail && receiverDetail?.blockedUsers.length > 0) {
        let isBlocked = receiverDetail.blockedUsers.some((user: any) => user._id.toString() === currentUserId.toString());
        if (isBlocked) {
            returnMessage = { error: true, message: 'Receiver has been blocked you!', statusCode: 403, blockedByMe: false }

        }
    }

    return returnMessage
}

export const validateUser = async (token: string) => {
    try {

        if(!token){
            return null
        }
        let decode: any = await verifyJwtToken(token);
        if (!decode) return null;
        const user: any = await UserModel.findOne({ _id: decode._id }).lean();

        if (!user) {
            return false
        }
        return { _id: user._id, email: user.email }

    } catch (error) {
        return null
    }
}