import ContactModel, { IContact } from "../model/Contact";
import NotificationModel from "../model/Notification";
import { notificationContent } from "../config/constant";
import UserModel from "../model/user";
import { io } from "../app";
import { checkUserSocketConnected } from "../service/socket";
import ChatRoom from "../model/Room";
import mongoose, { Types } from "mongoose";
import { fetchUser, checkUsersBlockedEachOther, userFieldSelectionModel, fileModelFieldSelection } from '../service/user.serivce';

export const addInContact = async (req: any, res: any) => {
    const { receiver } = req.body;
    try {

        const sender = req.user._id;

        const receiverDetail = await UserModel.findById(receiver);
        if (!receiverDetail) {
            return res.status(404).json({
                success: false,
                message: "Receiver not exist!"
            });
        }

        // check if user has blocked 


        // already sent friend request

        let isContactExist: any = await ContactModel.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        }).populate("sender").populate("receiver").sort({ createdAt: -1 });

        isContactExist = isContactExist[0];

        if (isContactExist && ["accepted", "pending"].includes(isContactExist.status)) {
            let message = "";

            switch (isContactExist.status) {
                case "accepted":
                    message = "Already friends!"
                    break;

                case "pending":
                    message = sender.toString() === isContactExist?.sender?._id.toString() ? "You have already send friend request!" : `${receiverDetail.username} already send frinend request to you`
                    break;

                // case "blocked":
                //     message = sender.toString() === isContactExist?.sender?._id.toString() ? "You have already send friend request!" : `${receiverDetail.username} already send frinend request to you`
                //     break;

                default:
                    break;
            }

            return res.status(401).json({
                success: false,
                message: message
            });


        }

        const newContact = await ContactModel.create({ sender, receiver });

        // create notification
        await NotificationModel.create({
            user: receiver,
            title: notificationContent.sendAddContact.title,
            description: notificationContent.sendAddContact.description.replace("{{username}}", receiverDetail.username),
            contactRequestId: newContact._id
        })

        //check user connect with socket

        if (receiverDetail.socketId && checkUserSocketConnected(receiverDetail.socketId)) {

            io.to(receiverDetail.socketId).emit("notification", {
                type: "FriendRequest",
                message: "you have new friend request",
                contactRequetId: newContact._id
            })
        }


        if (!newContact) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured. Try again"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Successfully send request"
        });



    } catch (error: any) {
        console.error('Error in addInContact controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const updateContactRequest = async (req: any, res: any) => {
    const { status, contactRequestId } = req.body;
    try {

        const currentUserId = req.user._id;
        let senderDetail;
        let chatroom;

        const contactRequestExist: any = await ContactModel.findOne({ _id: contactRequestId, status: "pending" })
            .populate("sender", "_id email fullName username socketId")
            .populate("receiver", "_id email fullName username socketId")
            .lean();

        console.log("contactRequestExist::", contactRequestExist)

        if (!contactRequestExist) {
            return res.status(404).json({
                success: false,
                message: "Invalid Request"
            });
        }

        senderDetail = contactRequestExist.sender;

        if (contactRequestExist && contactRequestExist.receiver?._id.toString() !== currentUserId.toString()) {
            console.log("not receiver")
            return res.status(403).json({
                success: false,
                message: "Invalid Request"
            });
        }

        // check user blocked or not

        if (status === "accepted") {

            await ContactModel.findOneAndUpdate({ _id: contactRequestId }, { status: "accepted" });

            // create notification
            await NotificationModel.create({
                user: senderDetail._id,
                title: notificationContent.acceptContactRequest.title,
                description: notificationContent.acceptContactRequest.description.replace("{{username}}", contactRequestExist.sender?.username).replace("{{friendName}}", contactRequestExist.receiver?.username),
                contactRequestId: contactRequestId
            })

            if (senderDetail.socketId && checkUserSocketConnected(senderDetail.socketId)) {

                io.to(senderDetail.socketId).emit("notification", {
                    type: "FriendRequestAccepted",
                    message: "Your friend Request accepted!",
                    contactRequetId: contactRequestId
                })
            }

            // create chatroom here

            chatroom = await ChatRoom.create({
                participants: [senderDetail._id, contactRequestExist.receiver._id]

            })


        }
        else {

            // soft delete contactRequest
            await ContactModel.findOneAndUpdate({ _id: contactRequestId }, { status: "rejected" });

            // create notification
            await NotificationModel.create({
                user: senderDetail._id,
                title: notificationContent.rejectContactRequest.title,
                description: notificationContent.rejectContactRequest.description.replace("{{username}}", contactRequestExist.sender?.username).replace("{{friendName}}", contactRequestExist.receiver?.username),
                contactRequestId: contactRequestId
            })

            if (senderDetail.socketId && checkUserSocketConnected(senderDetail.socketId)) {

                io.to(senderDetail.socketId).emit("notification", {
                    type: "FriendRequestRejected",
                    message: "Your friend Request rejected!",
                    contactRequetId: contactRequestId
                })
            }

        }

        return res.status(200).json({
            success: true,
            message: "Successfully updated!",
            data: {
                chatroom
            }
        });



    } catch (error: any) {
        console.error('Error in updateContactRequest controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const listContactRequest = async (req: any, res: any) => {

    let { status = "pending", limit, page } = req.query;
    try {

        const currentUserId = req.user._id;

        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;

        const skip = (page - 1) * limit

        const contactRequests = await ContactModel.find({
            receiver: currentUserId,
            status: status
        })
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 })
            .populate("sender", "_id email username fullName");

        const totalResut = await ContactModel.countDocuments({
            receiver: currentUserId,
            status: status
        })

        const total: any = totalResut || 0;
        const totalPages = Math.ceil(total / limit)

        if (contactRequests.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Data not found",
                data: []
            });
        }


        return res.status(200).json({
            success: true,
            message: "Data Fetched!",
            data: {
                total: total,
                limit: limit,
                page: page,
                totalPages: totalPages,
                contactRequests: contactRequests
            }
        });



    } catch (error: any) {
        console.error('Error in listContactRequest controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const myFriends = async (req: any, res: any) => {

    let { limit, page,search='' } = req.query;
    try {

        const currentUserId = req.user._id;

        const user: any = await fetchUser(currentUserId);

        console.log('user', user)

        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;

        const skip = (page - 1) * limit;

        let searchQuery={};

        if (search) {
            let regex = {
                $regex: new RegExp(search, 'i')
            }
            searchQuery = {
                $or: [
                    { "friend.fullName": regex },
                    { "friend.email": regex },
                    { "friend.username": regex }
                ]
            }
        }

        const pipeline = [
            {
                $match: {
                    $or: [
                        { receiver: new mongoose.Types.ObjectId(currentUserId) },
                        { sender: new mongoose.Types.ObjectId(currentUserId) }
                    ],
                    status: 'accepted',
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "receiver",
                    foreignField: "_id",
                    as: "receiver"
                }
            },
            {
                $unwind: {
                    path: "$receiver",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "sender",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            {
                $unwind: {
                    path: "$sender",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    friend: {
                        $cond: {
                            if: { $ne: ['$receiver._id', new mongoose.Types.ObjectId(currentUserId)] },
                            then: "$receiver",
                            else: "$sender"
                        }
                    }
                }
            },
            {
                $match: searchQuery
            },
            {
                $addFields: {
                    currentBlockedUsers: user.blockedUsers.map((user: any) => new mongoose.Types.ObjectId(user._id))
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: {
                            if: { $in: ["$friend._id", "$currentBlockedUsers"] },
                            then: "blocked",
                            else: "$status"
                        }
                    }
                }
            },
            
            {
                $lookup: {
                    from: "usersettings",
                    localField: "friend._id",
                    foreignField: "user",
                    as: "profileSetting"
                }
            },
            {
                $unwind: {
                    path: "$profileSetting",
                    preserveNullAndEmptyArrays: true
                }
            },
            
            {
                $lookup: {
                    from: "media",
                    localField: "friend.profileImage",
                    foreignField: "_id",
                    as: "friendImage"
                }
            },
            {
                $addFields: {
                    "friend.profileImage": {
                        $cond: {
                            if: { $eq: ["$profileSetting.isProfileImageShow", true] },
                            then: { $arrayElemAt: ["$friendImage", 0] },
                            else: null
                        }
                    }
                }
            },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    // sender: userFieldSelectionModel,
                    // receiver: userFieldSelectionModel,
                    status: 1,
                    friend: { ...userFieldSelectionModel, profileImage: fileModelFieldSelection },
                    // friendImage:1,
                    // profileSetting:1
                }
            }

        ]

        const countPipeline = [...pipeline.slice(0, -3), { $count: "total" }];


        // pipeline.push({ $skip: skip })


        const list = await ContactModel.aggregate(pipeline);
        const result = await ContactModel.aggregate(countPipeline);

        console.log("result::",result);
        console.log("list::",list)

        const total: any = result[0]?.total || 0;
        const totalPages = Math.ceil(total / limit)

        if (list.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Data not found",
                data: []
            });
        }


        return res.status(200).json({
            success: true,
            message: "Data Fetched!",
            data: {
                total: total,
                limit: limit,
                page: page,
                totalPages: totalPages,
                friends: list
            }
        });



    } catch (error: any) {
        console.error('Error in myFriends controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

