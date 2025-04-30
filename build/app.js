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
// import cors from "cors";
const index_1 = __importDefault(require("./routes/index"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const user_serivce_1 = require("./service/user.serivce");
(0, connection_1.default)();
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
    const socketId = socket.id;
    console.log("socketId", socketId);
    if (socketId && token) {
        // save to user document
        yield (0, user_serivce_1.updateSocketId)(token, socketId);
    }
    socket.join(socketId);
    socket.on('chat message', (msg) => {
        console.log('Message received: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('User disconnected');
        if (token) {
            yield (0, user_serivce_1.updateSocketId)(token, '');
        }
    }));
}));
// app.use(cors())
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.send("server is running");
}));
index_1.default.map(route => {
    app.use(route.path, route.handler);
});
const port = process.env.PORT || 8001;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
