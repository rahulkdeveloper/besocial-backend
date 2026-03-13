import { Types } from "mongoose";

export interface AuthUser {
    _id: Types.ObjectId;
    email: string;
}