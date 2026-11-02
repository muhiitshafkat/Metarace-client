const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: options.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@metarace.app',
        templateId: options.templateId,
        dynamic_template_data: options.data,
    };

    await sgMail.send(msg);
};

module.exports = sendEmail;
