const jwt = require("jsonwebtoken");
const User = require("../model/User");

exports.protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization token missing" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Optional: Check if user still exists and is active
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        email: user.email,
        name: user.name,
      };

      // Check if user's role is in allowed roles
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(401).json({ message: "Authentication failed" });
    }
  };
};

// Optional: Middleware to check specific permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    const PERMISSIONS = {
      SUPER_ADMIN: {
        canRegisterUsers: true,
        canManageAdmins: true,
        canDeleteUsers: true,
      },
      ADMIN: {
        canRegisterUsers: false,
        canManageAdmins: false,
        canDeleteUsers: false,
      },
      USER: {
        canRegisterUsers: false,
        canManageAdmins: false,
        canDeleteUsers: false,
      },
    };

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const hasPermission = PERMISSIONS[req.user.role]?.[permission] || false;

    if (!hasPermission) {
      return res.status(403).json({
        message: `Permission denied: ${permission} not allowed for your role`,
      });
    }

    next();
  };
};