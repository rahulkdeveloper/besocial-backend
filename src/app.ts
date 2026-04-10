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
import { validateUser } from "./service/user.serivce";
import MessageModel from './model/Message';
import userModel, { IUser } from './model/user';
import ChatRoomModel, { IRoom } from './model/Room';
import { connectRedis, getRedisClient } from './config/redis'
import { ChatroomJoinPayload, MessageSeenPayload } from './types/socket.types';
import { Types } from 'mongoose';

dbConnection();


connectRedis();



const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
})


io.on('connection', async (socket: any) => {

    const token: string = socket.handshake.auth.token;
    console.log("Connected:", socket.id);

    const user: IUser = await validateUser(token);

    if (!user) return;
    const userId: string = user._id.toString();

    const client = getRedisClient();

    // const decodedToken = await jwt.verify(token, process.env.JWT_SECRET_CODE as string);
    // const { _id: userId }: any = decodedToken;


    socket.join(userId);

    const chatrooms: IRoom[] = await ChatRoomModel.find({ participants: userId });
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

    socket.on("chatroom_join", (data: ChatroomJoinPayload) => {
        socket.join(data.roomId)
    })

    socket.on('chat message', (msg: string) => {
        io.emit('chat message', msg);
    });



    socket.on('message_seen', async (data: MessageSeenPayload) => {
        const { roomId, seenBy, unreadMessageIds } = data;

        if (!Array.isArray(unreadMessageIds) || unreadMessageIds.length < 1) return;

        const roomDetail: IRoom | null = await ChatRoomModel.findOne({ _id: roomId }).populate('participants', '_id').lean();

        let receiverDetail = roomDetail?.participants.find((participant: { _id: Types.ObjectId }) => {
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
        console.log('User disconnected', socket.id);
        await client.sRem(`sockets:${userId}`, socket.id);
        const count = await client.sCard(`sockets:${userId}`);
        console.log("count===", count);

        if (count === 0) {
            // emit user is offline to concern rooms
            const chatrooms: IRoom[] | null = await ChatRoomModel.find({ participants: userId });
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


app.use(cors({origin:"*"}))

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get("/", async (req: Request, res: Response): Promise<void> => {
    res.send("server is running...")
})

routers.map(route => {
    app.use(route.path, route.handler)
})

const port:number = Number(process.env.PORT) || 8001;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

export { io }