export interface ChatroomJoinPayload {
    roomId: string
}

export interface MessageSeenPayload {
    roomId: string;
    seenBy: string;
    unreadMessageIds: string[]
}