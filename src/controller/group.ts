import GroupChatModel from "src/model/GroupChat";
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

        participants = [...participants, admin]

        const groupChatData: any = {
            name,
            description,
            admin,
            participants,
        }

        if (groupImage) {
            groupChatData.groupImage = groupImage
        }

        // check all users friend of current Users;


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