const moment = require("moment")
const { getUserCollection, getActivityLogs } = require("../config/db")
const { ObjectId } = require("mongodb")
const userCollection = getUserCollection()
const activityLogsCollection = getActivityLogs()
const admin = require("../config/firebaseAdmin")

const registerUser = async (req, res) => {
  const user = req.body

  // 🔥 Get client IP safely
  let clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress
  if (clientIp && clientIp.includes(",")) {
    // If multiple IPs (proxy chain), take the first one
    clientIp = clientIp.split(",")[0].trim()
  }
  if (clientIp && clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.replace("::ffff:", "")
  }

  try {
    // Check if user already exists
    const existingUser = await userCollection.findOne({ email: user.email })

    if (existingUser) {
      console.log("Existing user found:", existingUser)

      // If it's a partial record (only email and lastActive), update it
      if (!existingUser.name && !existingUser.phone) {
        console.log("Updating partial user record with complete information")

        const totalUsers = await userCollection.estimatedDocumentCount()
        const role = totalUsers === 1 ? "admin" : "user"

        const updatedUser = {
          name: user.name,
          email: user.email,
          phone: user.phone,
          telegram: user.telegram,
          referral: user.referral,
          password: user.password,
          createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
          role,
          imageUrl: "https://cdn-icons-png.freepik.com/512/3607/3607444.png",
          lastActive: Date.now(),
          activityLogs: [
            {
              action: "registration_completed",
              timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
              ip: clientIp,
            },
          ],
        }

        const result = await userCollection.updateOne({ email: user.email }, { $set: updatedUser })

        console.log("User registration completed:", result)
        return res.send({
          success: true,
          message: "User registration completed",
          user: updatedUser,
        })
      } else {
        console.log("Complete user already exists")
        return res.status(400).send({
          success: false,
          message: "User already exists with this email",
        })
      }
    }

    // No existing user, create new one
    const totalUsers = await userCollection.estimatedDocumentCount()
    const role = totalUsers === 0 ? "admin" : "user"

    const newUser = {
      name: user.name,
      email: user.email,
      telegram: user.telegram,
      referral: user.referral,
      password: user.password,
      phone: user.phone,
      createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      role,
      imageUrl: "https://i.ibb.co/4Vg7qxJ/4042356.png",
      lastActive: Date.now(),
      activityLogs: [
        {
          action: "user_registered",
          timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
          ip: clientIp,
        },
      ],
    }

    const result = await userCollection.insertOne(newUser)
    console.log("New user created successfully:", result.insertedId)

    res.send({
      success: true,
      insertedId: result.insertedId,
      user: newUser,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error.code === 11000) {
      return res.status(400).send({
        success: false,
        message: "User already exists with this email",
      })
    }

    res.status(500).send({
      success: false,
      message: "Internal server error during registration",
    })
  }
}


const loginUser = async (req, res) => {
  const { email } = req.body

  try {
    // Find user by email
    const user = await userCollection.findOne({ email })

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found with this email",
      })
    }

    // Update last active and add login log
    const loginLog = {
      action: "user_login",
      timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
      ip: req.ip || req.connection.remoteAddress,
    }

    await userCollection.updateOne(
      { email },
      {
        $set: { lastActive: Date.now() },
        $push: { activityLogs: loginLog },
      },
    )

    // Return user data (excluding sensitive info)
    const { _id, activityLogs, ...userData } = user

    res.send({
      success: true,
      message: "Login successful",
      user: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).send({
      success: false,
      message: "Internal server error during login",
    })
  }
}

const getUserRole = async (req, res) => {
  const email = req.params.email
  try {
    const user = await userCollection.findOne({ email })
    if (!user) {
      return res.status(404).json({ role: "user" })
    }
    res.json({ role: user.role })
  } catch (error) {
    console.error("Error fetching user role:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

const getAllUsers = async (req, res) => {
  const page = Number.parseInt(req.query.page) || 1
  const limit = Number.parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  try {
    const total = await userCollection.countDocuments()
    const users = await userCollection.find().skip(skip).limit(limit).toArray()

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" })
  }
}

const deleteUser = async (req, res) => {
  const id = req.params.id

  try {
    const user = await userCollection.findOne({ _id: new ObjectId(id) })

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Delete from Firebase (by email)
    try {
      const firebaseUser = await admin.auth().getUserByEmail(user.email)
      await admin.auth().deleteUser(firebaseUser.uid)
    } catch (firebaseError) {
      console.log("Firebase user not found or already deleted")
    }

    // Delete from MongoDB
    await userCollection.deleteOne({ _id: new ObjectId(id) })

    res.send({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).send({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    })
  }
}

const updateUserProfile = async (req, res) => {
  const { email } = req.params
  const updatedData = req.body

  try {
    const user = await userCollection.findOne({ email })
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" })
    }

    if (updatedData.email && updatedData.email !== email) {
      return res.status(400).send({ success: false, message: "Email cannot be changed" })
    }

    updatedData.lastActive = Date.now()
    const updateLog = {
      action: updatedData.action,
      timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
      ip: req.ip || req.connection.remoteAddress,
    }

    const result = await userCollection.updateOne(
      { email },
      {
        $set: updatedData,
        $push: {
          activityLogs: updateLog,
        },
      },
    )

    if (result.modifiedCount > 0) {
      res.send({ success: true, message: "User profile updated successfully" })
    } else {
      res.send({ success: false, message: "No changes were made" })
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).send({ success: false, message: "Internal Server Error" })
  }
}

const getUserByEmail = async (req, res) => {
  const { email } = req.params
  try {
    const user = await userCollection.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ message: "Server error" })
  }
}

const logActivity = async (req, res) => {
  const { email, action, details } = req.body

  try {
    if (!email || !action) {
      return res.status(400).send({
        success: false,
        message: "Email and action are required",
      })
    }

    // Find user to verify they exist
    const user = await userCollection.findOne({ email })
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      })
    }

    // Create activity log entry
    const activityLog = {
      userId: user._id,
      email: user.email,
      action,
      details: details || {},
      timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent") || "Unknown",
    }

    // Insert into activity logs collection
    const result = await activityLogsCollection.insertOne(activityLog)

    // Also update user's activity logs array
    await userCollection.updateOne(
      { email },
      {
        $set: { lastActive: Date.now() },
        $push: {
          activityLogs: {
            action,
            timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
            ip: req.ip || req.connection.remoteAddress,
          },
        },
      },
    )

    res.send({
      success: true,
      message: "Activity logged successfully",
      logId: result.insertedId,
    })
  } catch (error) {
    console.error("Activity logging error:", error)
    res.status(500).send({
      success: false,
      message: "Internal server error during activity logging",
    })
  }
}

const getUserActivityLogs = async (req, res) => {
  const { email } = req.params

  try {
    // Find user to verify they exist
    const user = await userCollection.findOne({ email })
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      })
    }

    // Get activity logs from user's activityLogs array (most recent first)
    const userActivityLogs = user.activityLogs || []

    // Sort by timestamp (most recent first)
    const sortedLogs = userActivityLogs.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

    // Limit to last 50 activities
    const recentLogs = sortedLogs.slice(0, 50)

    res.send({
      success: true,
      data: recentLogs,
      total: recentLogs.length,
      message: "Activity logs retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    res.status(500).send({
      success: false,
      message: "Internal server error while fetching activity logs",
    })
  }
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserRole,
  getUserByEmail,
  updateUserProfile,
  deleteUser,
  logActivity,
  getUserActivityLogs,
}
