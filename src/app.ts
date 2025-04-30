import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import morgan from "morgan";
import { Request, Response } from 'express'
import dbConnection from './db/connection';
// import cors from "cors";
import routers from "./routes/index"
import socketIo from "socket.io";
import http from "http";
import {updateSocketId} from "./service/user.serivce"

dbConnection();

const server = http.createServer(app);
const io = new socketIo.Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST","PUT","DELETE","PATCH"]
    }
})


io.on('connection', async(socket:any) => {

    const token = socket.handshake.auth.token;
    const socketId = socket.id;
    console.log("socketId",socketId);
    

    if(socketId && token){
        // save to user document
        await updateSocketId(token,socketId)
    }

    socket.join(socketId)

    socket.on('chat message', (msg:string) => {
        console.log('Message received: ' + msg);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected');
        if(token){
            await updateSocketId(token,'')
        }
    });
});




// app.use(cors())

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))


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

export {io}