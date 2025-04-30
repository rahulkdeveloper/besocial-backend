import AuthenticationRouter from "./authentication";
import ContactRouter from "./contact";
import UserRouter from './user'
import NotificationRouter from './notification';
import UploadFileRouter from "./upload";
import ChatRoomRouter from './chatroom';
import GroupChatRouter from './group';

const routers =[
    {
        path:"/api/authentication",
        handler:AuthenticationRouter

    },
    {
        path:"/api/contact",
        handler:ContactRouter

    },
    {
        path:"/api/user",
        handler:UserRouter

    },
    {
        path:"/api/notification",
        handler:NotificationRouter

    },
    {
        path:"/api/upload",
        handler:UploadFileRouter

    },
    {
        path:"/api/chatroom",
        handler:ChatRoomRouter

    },
    {
        path:"/api/group",
        handler:GroupChatRouter

    }
]

export default routers;