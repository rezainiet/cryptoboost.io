const jwt = require("jsonwebtoken");
const { getUserCollection } = require("../config/db");


const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  const userCollection = getUserCollection();

  if (!token) return res.status(401).send({ message: "Unauthorized access" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized access" });

    const user = await userCollection.findOne({ email: decoded.email });
    if (!user) return res.status(401).send({ message: "User not found" });

    const now = Date.now();
    const lastActive = user.lastActive || now;
    const diff = now - lastActive;

    if (diff > 10 * 60 * 1000) {
      return res.status(440).send({ message: "Session expired due to inactivity" });
    }

    await userCollection.updateOne(
      { email: decoded.email },
      { $set: { lastActive: now } }
    );

    req.user = decoded;
    next();
  });
};

const verifyAdmin = async (req, res, next) => {
  const email = req.user?.email;
  const userCollection = getUserCollection();

  const result = await userCollection.findOne({ email });
  if (!result || result?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden Access! Admin Only Actions!" });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
