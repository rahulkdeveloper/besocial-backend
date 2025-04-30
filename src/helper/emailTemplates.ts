export const forgotPasswordTemplate = (data:{username:string,resetUrl:string})=>{
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #4CAF50;
            color: white;
            text-align: center;
            padding: 10px 0;
            border-radius: 8px 8px 0 0;
        }

        .content {
            margin-top: 20px;
            color: #333333;
        }

        .content h2 {
            font-size: 20px;
            font-weight: bold;
        }

        .content p {
            font-size: 16px;
        }

        .reset-button {
            display: inline-block;
            background-color: #4CAF50;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 16px;
        }

        .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #777777;
            text-align: center;
        }

        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>

<body>

    <div class="email-container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello ${data.username},</h2>
            <p>We received a request to reset your password for your account. If you did not request this change, please
                ignore this email. Otherwise, click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="reset-button">Reset Password</a>
            <p>If you have any questions or issues, feel free to contact our support team.</p>
        </div>
        <div class="footer">
            <p>Thank you for being a valued user of our service.</p>
            <p>If you didn't request a password reset, please ignore this email. For further assistance, visit our <a
                    href="[Support URL]">support page</a>.</p>
        </div>
    </div>

</body>

</html>
`
}