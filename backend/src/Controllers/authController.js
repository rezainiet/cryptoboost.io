const jwt = require("jsonwebtoken");
const moment = require("moment");
const { getUserCollection } = require("../config/db");


const login = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ success: false, message: "Email is required" });
  }

  try {
    const userCollection = getUserCollection();

    // Only update lastActive for existing users, don't create new ones
    const result = await userCollection.updateOne(
      { email },
      { $set: { lastActive: Date.now() } }
    );

    if (result.matchedCount === 0) {
      console.log("User not found in database during login:", email);
      // Optional: return 404 or just proceed silently
    }

    // ⚠️ Instead of JWT, set a plain cookie with email or a session ID
    res
      .cookie("auth_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None", // required for cross-site requests
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .status(200)
      .send({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ success: false, message: "Login failed" });
  }
};



const logout = (req, res) => {
  res
    .clearCookie("token", {
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
};

const ping = async (req, res) => {
  const userCollection = getUserCollection();
  await userCollection.updateOne(
    { email: req.user.email },
    { $set: { lastActive: Date.now() } }
  );
  res.send({ success: true });
};

module.exports = { login, logout, ping };
