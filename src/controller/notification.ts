import NotificationModel from "src/model/Notification";
import {userFieldSelectionContactModel} from "../service/user.serivce"

export const list = async (req: any, res: any) => {

    let { status = "pending", limit, page } = req.query;
    try {

        const currentUserId = req.user._id;

        limit = limit ? parseInt(limit) : 10;
        page = page ? parseInt(page) : 1;

        const skip = (page - 1) * limit;

        const notifications = await NotificationModel.find({
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
                        select: userFieldSelectionContactModel
                    },
                    {
                        path: "receiver",
                        select:userFieldSelectionContactModel
                    }
                ]
            })

        const totalResut = await NotificationModel.countDocuments({
            user: currentUserId
        })

        // mark all notification of current user as read

        await NotificationModel.updateMany({user: currentUserId},{$set:{isRead:true}})

        const total: any = totalResut || 0;
        const totalPages = Math.ceil(total / limit)

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



    } catch (error: any) {
        console.error('Error in listContactRequest controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}