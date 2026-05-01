import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_MAIL', 'SMTP_PASSWORD'];
requiredEnvVars.forEach(varName => {
	if (!process.env[varName]) {
		console.error(`ERROR: ${varName} is not defined in environment variables`);
	}
});

const createTransporter = () => {
	const isSecure = process.env.SMTP_PORT === "465";
	console.log(`Creating transporter with settings: Host=${process.env.SMTP_HOST}, Port=${process.env.SMTP_PORT}, Secure=${isSecure}`);

	return nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: parseInt(process.env.SMTP_PORT, 10) || 587,
		secure: isSecure,
		auth: {
			user: process.env.SMTP_MAIL,
			pass: process.env.SMTP_PASSWORD,
		},
		pool: true,
		maxConnections: 5,
		maxMessages: 100,
		rateDelta: 1000,
		rateLimit: 5,
		connectionTimeout: 10000,
		greetingTimeout: 10000,
		socketTimeout: 15000,
		tls: {
			rejectUnauthorized: false,
		},
	});
};

let cachedTransporter = null;

export const sendMail = async (mailOptions, retries = 3) => {
	let attempt = 0;
	let lastError = null;

	mailOptions.headers = mailOptions.headers || {};
	mailOptions.headers['X-Environment'] = process.env.NODE_ENV || 'development';

	console.log(`Attempting to send email to ${mailOptions.to} with subject "${mailOptions.subject}"`);

	while (attempt <= retries) {
		try {
			if (!cachedTransporter) {
				cachedTransporter = createTransporter();
			}

			const response = await cachedTransporter.sendMail(mailOptions);
			console.log(`Email sent successfully on attempt ${attempt + 1}. Message ID: ${response.messageId}`);
			return response;
		} catch (error) {
			lastError = error;
			console.error(`Email attempt ${attempt + 1} failed:`, error.message);

			if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
				console.log('Connection error detected, recreating transporter...');
				if (cachedTransporter) {
					try {
						cachedTransporter.close();
					} catch (e) {
						console.error('Error closing transporter:', e.message);
					}
				}
				cachedTransporter = null;
			}

			if (attempt === retries) {
				console.error('All email sending attempts failed. Last error:', error);
				throw error;
			}

			attempt++;
			const backoffTime = 1000 * Math.pow(2, attempt);
			console.log(`Retrying in ${backoffTime}ms...`);
			await new Promise(resolve => setTimeout(resolve, backoffTime));
		}
	}
};

export const sender = {
	email: process.env.SMTP_MAIL || "lastminutescsit0@gmail.com",
	name: "Last Minute SCSIT",
};