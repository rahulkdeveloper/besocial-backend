import bcrypt from "bcryptjs";
import mongoose from 'mongoose';
import jwt from "jsonwebtoken";
import enocdeDecode from "base64-url";
import otpGenretor from "otp-generator";

const timeStampOTP = 10;

const generateTimeStamp = (date:Date, minutes:number) => {
    return new Date(date.getTime() + minutes * 60000);
}

const hashPassword = async (password:string):Promise<string>=>{
    return await bcrypt.hash(password,10);
}

const comparePassword = async (password:string,hash:string):Promise<boolean>=>{
    return await bcrypt.compare(password,hash);
}

const generateAccessToken = async (useInfo:{_id:mongoose.Types.ObjectId,email:string}):Promise<string>=>{

    return jwt.sign(useInfo,process.env.JWT_SECRET_CODE as string);
}

export const verifyJwtToken = async(token:string)=>{
    return await jwt.verify(token,process.env.JWT_SECRET_CODE as string);
}

const generateToken = async (obj:{_id:mongoose.Types.ObjectId}) => {
    let otp = '1234';
    
    if (process.env.MODE === 'production') {
        otp = otpGenretor.generate(4, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    }

    let  verifyToken = ({
        timestamp: generateTimeStamp(new Date(), timeStampOTP),   //otp expire after 10 min
        id: obj._id,
        // otpcode: otp,
    });
    const encodeToken = await encode(JSON.stringify(verifyToken));
    return ({resetToken: encodeToken});

}

const encode = async (val:string) => {
    return enocdeDecode.encode(val);
 }

 const decode = async (val:string) => {
    const decodeString = enocdeDecode.decode(val);
    return JSON.parse(decodeString);
}
export {hashPassword,comparePassword,generateAccessToken,generateToken,decode}