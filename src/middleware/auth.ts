import UserModel, { IUser } from "../model/user";
import { verifyJwtToken } from "../helper/utils";
import { Request, Response, NextFunction } from "express";
import { AuthUser } from "src/types/user.types";

export const isLoggedIn = async (req: any, res: Response, next: NextFunction): Promise<any> => {
    try {

        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }


        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Forbidden."
            })
        }

        let decode:any = await verifyJwtToken(token);

        if (!decode) {
            return res.status(401).json({
                success: false,
                message: "Access Forbidden."
            })
        }

        let userExist: IUser | null = await UserModel.findOne({ _id: decode._id }).lean();

        if (!userExist) {
            return res.status(401).json({
                success: false,
                message: "Unathorized."
            })
        }

        req.user = userExist
        return next()

    } catch (error: any) {
        console.log("error in isLoggedIn middleware", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: "Access Denied"
        })

    }
}