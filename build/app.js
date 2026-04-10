"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const morgan_1 = __importDefault(require("morgan"));
const connection_1 = __importDefault(require("./db/connection"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./routes/index"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const user_serivce_1 = require("./service/user.serivce");
const Message_1 = __importDefault(require("./model/Message"));
const user_1 = __importDefault(require("./model/user"));
const Room_1 = __importDefault(require("./model/Room"));
const redis_1 = require("./config/redis");
(0, connection_1.default)();
(0, redis_1.connectRedis)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.default.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});
exports.io = io;
io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
    const token = socket.handshake.auth.token;
    console.log("Connected:", socket.id);
    const user = yield (0, user_serivce_1.validateUser)(token);
    if (!user)
        return;
    const userId = user._id.toString();
    const client = (0, redis_1.getRedisClient)();
    // const decodedToken = await jwt.verify(token, process.env.JWT_SECRET_CODE as string);
    // const { _id: userId }: any = decodedToken;
    socket.join(userId);
    const chatrooms = yield Room_1.default.find({ participants: userId });
    if (chatrooms.length > 0) {
        for (const room of chatrooms) {
            socket.to(room._id.toString()).emit("user_online", {
                userId,
                roomId: room._id.toString()
            });
        }
    }
    console.log("User joined socket:", userId);
    yield client.sAdd(`sockets:${userId}`, socket.id);
    // emit user_online in concern room
    socket.on("chatroom_join", (data) => {
        socket.join(data.roomId);
    });
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
    socket.on('message_seen', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { roomId, seenBy, unreadMessageIds } = data;
        if (!Array.isArray(unreadMessageIds) || unreadMessageIds.length < 1)
            return;
        const roomDetail = yield Room_1.default.findOne({ _id: roomId }).populate('participants', '_id').lean();
        let receiverDetail = roomDetail === null || roomDetail === void 0 ? void 0 : roomDetail.participants.find((participant) => {
            if (participant._id.toString() !== (seenBy === null || seenBy === void 0 ? void 0 : seenBy.toString())) {
                return participant;
            }
        });
        // update message db to mark seen
        yield Message_1.default.updateMany({
            _id: { $in: unreadMessageIds },
            sender: { $ne: seenBy },
            seen: false
        }, {
            $set: { seen: true }
        });
        // send socket notification to receiver
        if (receiverDetail) {
            socket.to(roomId.toString()).emit('message_seen_notify', {
                roomId,
                seenBy,
                messageIds: unreadMessageIds
            });
        }
    }));
    socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('User disconnected', socket.id);
        yield client.sRem(`sockets:${userId}`, socket.id);
        const count = yield client.sCard(`sockets:${userId}`);
        console.log("count===", count);
        if (count === 0) {
            // emit user is offline to concern rooms
            const chatrooms = yield Room_1.default.find({ participants: userId });
            if (chatrooms.length > 0) {
                for (const room of chatrooms) {
                    socket.to(room._id.toString()).emit("user_offline", {
                        userId,
                        roomId: room._id.toString(),
                        lastSeen: new Date()
                    });
                }
            }
            // update db lastseen..
            yield user_1.default.findOneAndUpdate({ _id: userId }, { lastSeen: new Date() });
        }
    }));
}));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("server is running...");
}));
index_1.default.map(route => {
    app.use(route.path, route.handler);
});
const port = Number(process.env.PORT) || 8001;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
