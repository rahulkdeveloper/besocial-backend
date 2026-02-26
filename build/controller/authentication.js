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
exports.demo = exports.resetPassword = exports.forgotPassword = exports.login = exports.signUp = void 0;
const user_1 = __importDefault(require("../model/user"));
const utils_1 = require("../helper/utils");
const moment_1 = __importDefault(require("moment"));
const email_1 = require("../helper/email");
const constant_1 = require("../config/constant");
const user_serivce_1 = require("../service/user.serivce");
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { email, username, fullName, password, dateOfBirth, gender, phone, bio } = req.body;
    try {
        const checkUserWithEmail = yield user_1.default.findOne({ email }).lean();
        if (checkUserWithEmail) {
            return res.status(403).json({
                success: true,
                message: "Email already exist!",
                data: null
            });
        }
        if (dateOfBirth) {
            dateOfBirth = (0, moment_1.default)(dateOfBirth, 'DD-MM-YYYY').toDate();
        }
        const checkUserWithPhone = yield user_1.default.findOne({ phone }).lean();
        if (checkUserWithPhone) {
            return res.status(403).json({
                success: true,
                message: "Phone already exist!",
                data: null
            });
        }
        const checkUserWithUsername = yield user_1.default.findOne({ username }).lean();
        if (checkUserWithUsername) {
            return res.status(403).json({
                success: true,
                message: "Username already exist!",
                data: null
            });
        }
        let hashPass = yield (0, utils_1.hashPassword)(password);
        const newUserData = {
            email,
            fullName,
            password: hashPass,
            phone,
            dateOfBirth,
            gender,
            bio,
            username
        };
        const newUserRequest = new user_1.default(newUserData);
        const newUser = yield newUserRequest.save();
        if (!newUser) {
            return res.status(500).json({
                success: false,
                message: "Some error has occured! Try again",
                data: null
            });
        }
        // create user settings
        const userSettings = yield (0, user_serivce_1.createUserSetting)(newUser._id, {});
        // generate accessToken;
        const token = yield (0, utils_1.generateAccessToken)({ _id: newUser._id, email: newUser.email });
        return res.status(200).json({
            success: true,
            message: "Signup successfully!",
            data: {
                user: newUser,
                userSettings: userSettings,
                token
            }
        });
    }
    catch (error) {
        console.log("error in signUp controller", error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Some error has occured"
        });
    }
});
exports.signUp = signUp;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email/Phone and password are required.',
        });
    }
    try {
        // Check if the provided emailOrPhone is a valid email or phone
        let user;
        if (emailOrPhone.includes('@')) {
            // It's an email
            user = yield user_1.default.findOne({ email: emailOrPhone })
                .populate("profileImage", "url");
        }
        else {
            // It's a phone number
            user = yield user_1.default.findOne({ phone: emailOrPhone })
                .populate("profileImage", "url");
        }
        // If user is not found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }
        if (user.blockedByAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You have blocked by Admin.',
            });
        }
        // Compare password with hashed password in database
        const isMatch = yield (0, utils_1.comparePassword)(password, user.password);
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
        const token = yield (0, utils_1.generateAccessToken)({ _id: user._id, email: user.email });
        // Update the last login time
        user.lastLoginAt = new Date();
        user.status = "online";
        yield user.save();
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
                    profilImage: ((_a = user.profileImage) === null || _a === void 0 ? void 0 : _a.url) || ''
                },
                token,
            },
        });
    }
    catch (error) {
        console.log("Error in login:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
});
exports.login = login;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // Find user by email
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found with this email address.' });
        }
        let { resetToken } = yield (0, utils_1.generateToken)({ _id: user._id });
        user.resetPasswordToken = resetToken;
        yield user.save();
        // Send the reset email to the user
        const resetUrl = `${process.env.FRONTEND_FORGOT_PASSWORD_URL}?token=${resetToken}`;
        yield (0, email_1.sendEmailNormal)(email, "Forgot Password link | Besocial", constant_1.emailTemplateName.forgotPassword, { username: user.username, resetUrl: resetUrl });
        return res.status(200).json({ message: 'Password reset email sent successfully.', resetToken });
    }
    catch (error) {
        console.error('Error in forgotPassword controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password are not equal' });
        }
        // Verify the reset token
        const decoded = yield (0, utils_1.decode)(token);
        console.log("decoded::", decoded);
        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }
        // Find the user by the decoded userId
        const user = yield user_1.default.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.resetPasswordToken !== token) {
            return res.status(400).json({ message: 'Invalid reset password token' });
        }
        // Hash the new password before saving it
        const hashedPassword = yield (0, utils_1.hashPassword)(newPassword);
        // Update the user's password and clear the reset token
        user.password = hashedPassword;
        user.resetPasswordToken = ""; // Clear the reset token field
        yield user.save();
        return res.status(200).json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        console.error('Error in resetPassword controller:', error);
        return res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
exports.resetPassword = resetPassword;
const demo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.send("demo");
});
exports.demo = demo;
