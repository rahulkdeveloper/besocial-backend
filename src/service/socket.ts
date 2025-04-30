import {io} from "../app"


export const checkUserSocketConnected =(id:string)=>{
    console.log("inside the checkUserSocketConnected");

    if(!io?.sockets?.adapter?.rooms){
        console.error("no room founc");
        return false;
        
    }

    let flag = false;

    for (const roomSocket of io?.sockets?.adapter?.rooms) {

        console.log("room socket::",roomSocket[0]);
        

        if(roomSocket[0]===id){
            flag=true
            break
        }
    }
    
    return flag
}