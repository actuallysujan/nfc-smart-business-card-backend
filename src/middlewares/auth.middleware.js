const jwt = require("jsonwebtoken");
const userRepo = require("../modules/auth/auth.repository");

exports.protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) throw new Error("Token missing");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepo.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error("Unauthorized");
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  };
};
