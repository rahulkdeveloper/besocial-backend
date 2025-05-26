import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import morgan from "morgan";
import { Request, Response } from 'express'
import dbConnection from './db/connection';
import cors from "cors";
import routers from "./routes/index"
import socketIo from "socket.io";
import http from "http";
import path from 'path';
import { updateSocketId } from "./service/user.serivce";
import MessageModel from './model/Message';
import { checkUserSocketConnected } from './service/socket';
import ChatRoomModel from './model/Room';

dbConnection();

const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
})


io.on('connection', async (socket: any) => {

    const token = socket.handshake.auth.token;
    const socketId = socket.id;
    console.log("socketId", socketId);


    if (socketId && token) {
        // save to user document
        await updateSocketId(token, socketId)
    }

    socket.join(socketId)

    socket.on('chat message', (msg: string) => {
        io.emit('chat message', msg);
    });

    // socket.on('message_seen', async (data: any) => {
    //     const { roomId, seenBy, lastSeenMessageId } = data;

    //     // update message db to mark seen
    //     const updateMessage:any = await MessageModel.findOneAndUpdate({ _id: lastSeenMessageId, chatRoomId: roomId }, { seen: true }, { new: true }).populate('sender', '_id socketId');

    //     console.log("updateMessage::",updateMessage)

    //     // send socket notification to receiver
    //     if (updateMessage && updateMessage.sender?.socketId && checkUserSocketConnected(updateMessage.sender?.socketId)) {
    //         socket.to(updateMessage.sender?.socketId).emit('message_seen_notify', {
    //             roomId,
    //             seenBy,
    //             messageId: lastSeenMessageId
    //         })
    //     }

    // })

    socket.on('message_seen', async (data: any) => {
        const { roomId, seenBy, unreadMessageIds } = data;

        console.log("unreadMessageIds::",unreadMessageIds)

        if (!Array.isArray(unreadMessageIds) || unreadMessageIds.length < 1) return;

        const roomDetail = await ChatRoomModel.findOne({_id:roomId}).populate('participants','_id socketId').lean();

        let receiverDetail:any  = roomDetail?.participants.find((participant:any)=>{
            if(participant._id.toString() !== seenBy.toString()){
                return participant
            }
        });

        console.log("receiverDetail::",receiverDetail);

        // update message db to mark seen
        await MessageModel.updateMany(
            {
                _id:{$in:unreadMessageIds},
                sender:{$ne:seenBy},
                seen:false
            },
            {
                $set:{seen:true}
            }
        )

       
        // send socket notification to receiver
        if (receiverDetail && receiverDetail.socketId && checkUserSocketConnected(receiverDetail.socketId)) {
            socket.to(receiverDetail.socketId).emit('message_seen_notify', {
                roomId,
                seenBy,
                messageIds: unreadMessageIds
            })
        }

    })

    socket.on('disconnect', async () => {
        console.log('User disconnected');
        if (token) {
            await updateSocketId(token, '')
        }
    });
});




app.use(cors())

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get("/", async (req: any, res: any) => {
    return res.send("server is running")
})

routers.map(route => {
    app.use(route.path, route.handler)
})

const port = process.env.PORT || 8001;



server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

export { io }