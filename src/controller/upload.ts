import MediaModel from "src/model/Media";


export const uploadSingleFile = async (req: any, res: any) => {
    try {

        const currentUserId = req.user._id;

        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        const file = req.file;

        const newMedia = await MediaModel.create({
            user: currentUserId,
            name: file.originalname,
            filename: file.filename,
            path: file.path,
            url: file.path,
            mimetype: file.mimetype,
            size: file.size,
            fileType: file.mimetype.split("/")[0],
            folderName: file.destination,
            alt: "",

        })

        return res.status(200).json({
            success: true,
            message: "file uploaded!",
            data: newMedia
        });


    } catch (error) {
        console.log("error in user uploadSingleFile controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}

export const uploadMultipleeFiles = async (req: any, res: any) => {
    try {

        const currentUserId = req.user._id;

        if (req.files.length === 0) {
            return res.status(400).send({ message: 'No file uploaded' });
        }

        const files = req.files;

       const mediaData =  await Promise.all(files.map(async (file:any) => {
            const newMedia = await MediaModel.create({
                user: currentUserId,
                name: file.originalname,
                filename: file.filename,
                path: file.path,
                url: file.path,
                mimetype: file.mimetype,
                size: file.size,
                fileType: file.mimetype.split("/")[0],
                folderName: file.destination,
                alt: "",
            })
            return newMedia
        }))

        return res.status(200).json({
            success: true,
            message: "file uploaded!",
            data: mediaData
        });


    } catch (error) {
        console.log("error in user uploadMultipleeFiles controller", error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}