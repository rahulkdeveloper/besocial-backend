import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../model/user";
import { generateAccessToken, hashPassword, comparePassword, generateToken,decode } from "../helper/utils"
import moment from "moment"



export const signUp = async (req: any, res: any) => {

    let { email, fullName, password, dateOfBirth, gender, phone, bio } = req.body;
    try {
        const checkUserWithEmail = await UserModel.findOne({ email }).lean();

        if (checkUserWithEmail) {
            return res.status(403).json({
                success: true,
                message: "Email already exist!",
                data: null
            });
        }

        if (dateOfBirth) {
            dateOfBirth = moment(dateOfBirth, 'DD-MM-YYYY').toDate();
        }

        const checkUserWithPhone = await UserModel.findOne({ phone }).lean();

        if (checkUserWithPhone) {
            return res.status(403).json({
                success: true,
                message: "Phone already exist!",
                data: null
            });
        }

        let hashPass = await hashPassword(password);

        const newUserData = {
            email,
            fullName,
            password: hashPass,
            phone,
            dateOfBirth,
            gender,
            bio
        };

        const newUserRequest = new UserModel(newUserData);

        const newUser: any = await newUserRequest.save();

        if (!newUser) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured! Try again",
                data: null
            });
        }

        // generate accessToken;
        const token = await generateAccessToken({ _id: newUser._id, email: newUser.email });

        return res.status(200).json({
            success: true,
            message: "Signup successfully!",
            data: {
                user: newUser,
                token
            }
        });

    } catch (error: any) {
        console.log("error in signUp controller", error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Some error has occured"
        });
    }
};

export const login = async (req: any, res: any) => {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email/Phone and password are required.',
        });
    }

    try {
        // Check if the provided emailOrPhone is a valid email or phone
        let user: any;
        if (emailOrPhone.includes('@')) {
            // It's an email
            user = await UserModel.findOne({ email: emailOrPhone });
        } else {
            // It's a phone number
            user = await UserModel.findOne({ phone: emailOrPhone });
        }

        // If user is not found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Compare password with hashed password in database
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials.',
            });
        }

        // Generate JWT Token
        const payload = {
            userId: user._id,
            email: user.email,
            fullName: user.fullName,
        };

        const token = await generateAccessToken({ _id: user._id, email: user.email });

        // Update the last login time
        user.lastLoginAt = new Date();
        user.status = "online";
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    status: "online",
                    gender: user.gender,
                    lastSeen: user.lastSeen,
                },
                token,
            },
        });
    } catch (error) {
        console.log("Error in login:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

export const forgotPassword = async (req: any, res: any) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user: any = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found with this email address.' });
        }

        let { resetToken } = await generateToken({ _id: user._id })

        user.resetPasswordToken = resetToken;
        await user.save();

        // Send the reset email to the user
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        //   await sendResetPasswordEmail(user.email, resetUrl);

        return res.status(200).json({ message: 'Password reset email sent successfully.',resetToken });
    } catch (error) {
        console.error('Error in forgotPassword controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
};

export const resetPassword = async (req: any, res: any) => {
    try {
        const { token, newPassword,confirmPassword } = req.body;

        if(newPassword!==confirmPassword){
            return res.status(400).json({ message: 'New password and confirm password are not equal' });
        }

        // Verify the reset token
        const decoded:any =await decode(token);

        console.log("decoded::",decoded);
        

        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        // Find the user by the decoded userId
        const user:IUser|null = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if(user.resetPasswordToken !== token){
            return res.status(400).json({ message: 'Invalid reset password token' });
        }

        // Hash the new password before saving it
        const hashedPassword = await hashPassword(newPassword);

        // Update the user's password and clear the reset token
        user.password = hashedPassword;
        user.resetPasswordToken = "";  // Clear the reset token field
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error in resetPassword controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
};

export const demo = async (req: any, res: any) => {
    return res.send("demo")
}





