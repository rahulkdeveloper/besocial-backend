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
exports.sendEmailNormal = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailTemplates_1 = require("./emailTemplates");
const sendEmailNormal = (email, subject, templateName, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const emailFrom = process.env.SENDING_EMAIL;
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            port: 465,
            secure: true,
            auth: {
                user: emailFrom,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        let html = "";
        if (templateName === "forgotPassword") {
            html = (0, emailTemplates_1.forgotPasswordTemplate)(data);
        }
        const mailOptions = {
            from: emailFrom,
            to: email,
            subject: subject,
            html: html
        };
        // Send the email
        transporter
            .sendMail(mailOptions)
            .then((info) => {
            console.log("email send print information about email", info);
        })
            .catch((err) => console.log("error in send email with nodemailer", err));
        return true;
    }
    catch (error) {
        console.log("error in send email with nodemailer", error);
        return false;
    }
});
exports.sendEmailNormal = sendEmailNormal;
