export const verifyCollegeWiFi = (req, res, next) => {
  try {
    // Force it to a string to prevent crashes
    const clientIp = String(
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    );

    // Log the incoming IP to your terminal so you can see it!
    console.log("📡 Scan Attempt from IP:", clientIp);

    const myCurrentIp = "1.187.161.60";

    if (
      process.env.NODE_ENV === "test" ||
      clientIp.includes(myCurrentIp) ||
      clientIp.includes("127.0.0.1") ||
      clientIp.includes("::1")
    ) {
      console.log("✅ Network Check Passed!");
      return next();
    }

    const isCollegeNetwork =
      clientIp.startsWith("192.168.") || clientIp.startsWith("10.");

    if (!isCollegeNetwork) {
      console.log("❌ Network Check Failed for:", clientIp);
      return res.status(403).json({
        success: false,
        message: "Security Violation: You must be connected to College WiFi.",
      });
    }

    next();
  } catch (error) {
    console.error("WiFi Check Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during network check." });
  }
};
