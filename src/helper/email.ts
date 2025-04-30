import nodemailer from "nodemailer";
import {forgotPasswordTemplate} from "./emailTemplates"

export const sendEmailNormal = async (email:string,subject:string,templateName:string, data:any) => {
    try {
      const emailFrom = process.env.SENDING_EMAIL;
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
          user: emailFrom,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      let html:string=""

      if(templateName==="forgotPassword"){
        html = forgotPasswordTemplate(data)
      }
  
      const mailOptions = {
        from: emailFrom,
        to: email,
        subject: subject,
        html:html
      };
  
      // Send the email
      transporter
        .sendMail(mailOptions)
        .then((info) => {
          console.log("email send print information about email", info);
        })
        .catch((err) => console.log("error in send email with nodemailer", err));
  
      return true;
    } catch (error) {
      console.log("error in send email with nodemailer", error);
      return false;
    }
  };