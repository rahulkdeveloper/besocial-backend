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
import { updateSocketId, validateUser } from "./service/user.serivce";
import MessageModel from './model/Message';
import userModel from './model/user'
import { checkUserSocketConnected } from './service/socket';
import ChatRoomModel from './model/Room';
import { connectRedis, getRedisClient } from './config/redis'
let activeChatrooms = new Map();

dbConnection();

const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
})
connectRedis()

// io.on('connection', async (socket: any) => {

//     const token = socket.handshake.auth.token;
//     const socketId = socket.id;
//     console.log("socketId", socketId);


//     if (socketId && token) {
//         // save to user document
//         await updateSocketId(token, socketId)
//     }

//     socket.join(socketId)

//     socket.on('chat message', (msg: string) => {
//         io.emit('chat message', msg);
//     });

//     // socket.on("chatroom_join", async (data: { userId: string, chatroomdId: string }) => {
//     //     if (data.userId && data.chatroomdId) {
//     //         if (!activeChatrooms.has(data.userId)) {

//     //             activeChatrooms.set(data.userId, [data.chatroomdId])
//     //         }
//     //         else {
//     //             let rooms = activeChatrooms.get(data.userId);
//     //             rooms.push(data.chatroomdId);
//     //             rooms = [...new Set(rooms)]
//     //             activeChatrooms.set(data.userId, rooms)
//     //         }
//     //     }
//     // })

//     // socket.on("chatroom_left", async (data: { userId: string, chatroomdId: string }) => {
//     //     if (data.userId && data.chatroomdId) {
//     //         if (activeChatrooms.has(data.userId)) {
//     //             let rooms = activeChatrooms.get(data.userId);
//     //             rooms = rooms.filter((i: any) => i.toString() !== data.chatroomdId.toString());
//     //             activeChatrooms.set(data.userId, rooms)
//     //         }
//     //     }
//     // })

//     socket.on('message_seen', async (data: any) => {
//         const { roomId, seenBy, unreadMessageIds } = data;

//         if (!Array.isArray(unreadMessageIds) || unreadMessageIds.length < 1) return;

//         const roomDetail = await ChatRoomModel.findOne({ _id: roomId }).populate('participants', '_id socketId').lean();

//         let receiverDetail: any = roomDetail?.participants.find((participant: any) => {
//             if (participant._id.toString() !== seenBy?.toString()) {
//                 return participant
//             }
//         });

//         // update message db to mark seen
//         await MessageModel.updateMany(
//             {
//                 _id: { $in: unreadMessageIds },
//                 sender: { $ne: seenBy },
//                 seen: false
//             },
//             {
//                 $set: { seen: true }
//             }
//         )


//         // send socket notification to receiver
//         if (receiverDetail && receiverDetail.socketId && checkUserSocketConnected(receiverDetail.socketId)) {
//             socket.to(receiverDetail.socketId).emit('message_seen_notify', {
//                 roomId,
//                 seenBy,
//                 messageIds: unreadMessageIds
//             })
//         }

//     })

//     socket.on('disconnect', async () => {
//         console.log('User disconnected');
//         if (token) {
//             await updateSocketId(token, '')
//         }
//     });
// });

io.on('connection', async (socket: any) => {

    const token = socket.handshake.auth.token;
    console.log("Connected:", socket.id);

    const user: any = await validateUser(token);

    if (!user) return;
    const userId = user._id.toString();

    const client = getRedisClient();


    socket.join(userId);

    const chatrooms = await ChatRoomModel.find({ participants: userId });
    if (chatrooms.length > 0) {
        for (const room of chatrooms) {
            socket.to(room._id.toString()).emit("user_online", {
                userId,
                roomId: room._id.toString()
            })
        }
    }

    console.log("User joined socket:", userId);
    await client.sAdd(`sockets:${userId}`, socket.id);

    // emit user_online in concern room

    socket.on("chatroom_join", (data: any) => {
        socket.join(data.roomId)
    })

    socket.on('chat message', (msg: string) => {
        io.emit('chat message', msg);
    });



    socket.on('message_seen', async (data: any) => {
        const { roomId, seenBy, unreadMessageIds } = data;


        if (!Array.isArray(unreadMessageIds) || unreadMessageIds.length < 1) return;

        const roomDetail = await ChatRoomModel.findOne({ _id: roomId }).populate('participants', '_id socketId').lean();

        let receiverDetail: any = roomDetail?.participants.find((participant: any) => {
            if (participant._id.toString() !== seenBy?.toString()) {
                return participant
            }
        });

        // update message db to mark seen
        await MessageModel.updateMany(
            {
                _id: { $in: unreadMessageIds },
                sender: { $ne: seenBy },
                seen: false
            },
            {
                $set: { seen: true }
            }
        )


        // send socket notification to receiver
        if (receiverDetail) {
            socket.to(roomId.toString()).emit('message_seen_notify', {
                roomId,
                seenBy,
                messageIds: unreadMessageIds
            })
        }

    })

    socket.on('disconnect', async () => {
        console.log('User disconnected',socket.id);
        await client.sRem(`sockets:${userId}`, socket.id);
        const count = await client.sCard(`sockets:${userId}`);
        console.log("count===", count);

        if (count === 0) {
            // emit user is offline to concern rooms
            const chatrooms = await ChatRoomModel.find({ participants: userId });
            if (chatrooms.length > 0) {
                for (const room of chatrooms) {
                    socket.to(room._id.toString()).emit("user_offline", {
                        userId,
                        roomId: room._id.toString(),
                        lastSeen: new Date()
                    })
                }
            }
            // update db lastseen..
            await userModel.findOneAndUpdate(
                { _id: userId },
                { lastSeen: new Date() }
            );
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