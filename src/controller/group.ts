import GroupChatModel from "src/model/GroupChat";
import UserModel from "src/model/user";
import ChatRoomModel from "src/model/Room";
const IsProduction = process.env.NODE_ENV as string === 'production';


export const createGroup = async (req: any, res: any) => {
    let { name, description, participants = [], groupImage } = req.body;
    try {

        const currentUserId = req.user._id;
        const admin = currentUserId;

        // check name already exist with same user;

        const groupExist = await GroupChatModel.findOne({
            name: name,
            admin: admin
        });

        if (groupExist) {
            return res.status(403).json({
                success: false,
                message: "Group exist with this name! Select diffrent name.",
                data: null
            });
        }

        // check all users friend of current Users;

        if (participants.length > 0) {
            participants = await Promise.all(participants.map(async (participant: any) => {

                const chatroomExist = await ChatRoomModel.findOne(
                    { participants: {$all:[currentUserId,participant]} }
                ).
                populate("participants","name email")


                if (chatroomExist) {
                    return participant
                }
            }))
        }
        participants = [...participants, admin];

        participants =  participants.filter((n:any)=>n)

        const groupChatData: any = {
            name,
            description,
            admin,
            participants,
        }

        if (groupImage) {
            groupChatData.groupImage = groupImage
        }

        const newGroup = await GroupChatModel.create(groupChatData);

        if (!newGroup) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong. Please try again later."
            });
        }


        return res.status(201).json({
            success: true,
            message: "Group created successfully!",
            data: newGroup
        });

    } catch (error: any) {
        console.error("Error in createGroup controller fn::", error);

        return res.status(500).json({
            success: false,
            message: IsProduction
                ? "Something went wrong. Please try again later."
                : `Server Error: ${error.message}`
        });
    }
}