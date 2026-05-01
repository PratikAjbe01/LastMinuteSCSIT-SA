import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
	try {
		let token = null;

		// 1️⃣ Check Authorization header (Bearer token)
		if (req.headers.authorization?.startsWith("Bearer ")) {
			token = req.headers.authorization.split(" ")[1];
		}

		// 2️⃣ Fallback to cookies
		if (!token && req.cookies?.token) {
			token = req.cookies.token;
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized - no token provided",
			});
		}

		// 3️⃣ Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// 4️⃣ Fetch user
		const user = await User.findById(decoded.userId || decoded.id).select("-password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User not found",
			});
		}

		// Optional: if you have isActive in proxy logic
		if (user.isActive === false) {
			return res.status(401).json({
				success: false,
				message: "User is deactivated",
			});
		}

		// 5️⃣ Attach user
		req.user = user;
		req.userId = user._id;

		next();
	} catch (error) {
		console.error("Auth error:", error.message);
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};



// 🔐 Role-based access control
export const restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: `Access denied. Required role: ${roles.join(" or ")}`,
			});
		}
		next();
	};
};