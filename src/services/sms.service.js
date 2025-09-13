const twilio = require('twilio');
const config = require('../config/config');


const { accountSid, authToken } = config.twilio;
const twilioClient = twilio(accountSid, authToken);

const sendOtpSms = async (phoneNumber, otp, type) => {
    console.log('Original phone number:', phoneNumber);

    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
    }

    console.log('Formatted phone number:', formattedPhone);
    try {
        const message = getOtpMessage(otp, type);

        const result = await twilioClient.messages.create({
            body: message,
            from: config.twilio.phoneNumber,
            to: formattedPhone,
        });

        console.log(`SMS sent to ${formattedPhone}, SID: ${result.sid}`);
        return result;
    } catch (error) {
        console.error('Twilio SMS error:', error);
        if (error.code === 21608) {
            throw new Error('Phone number not verified for trial account. Please use a verified number.');
        } else if (error.code === 21614) {
            throw new Error('Invalid phone number format.');
        } else {
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }
};

const getOtpMessage = (otp, type) => {
    const messages = {
        'phone-verification': `Your verification code is: ${otp}. Valid for 10 minutes.`,
        'sign-in': `Your login code is: ${otp}. Valid for 10 minutes.`,
        'password-reset': `Your password reset code is: ${otp}. Valid for 10 minutes.`,
    };
    return messages[type] || `Your code is: ${otp}. Valid for 10 minutes.`;
};
module.exports = { sendOtpSms };