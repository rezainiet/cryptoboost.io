const express = require("express")
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserRole,
  updateUserProfile,
  getUserByEmail,
  deleteUser,
  logActivity, // Added logActivity import
} = require("../Controllers/userController")
const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/all", getAllUsers)
router.get("/role/:email", getUserRole)
router.delete("/delete/:id", deleteUser)
router.patch("/update/:email", updateUserProfile)
router.get("/:email", getUserByEmail)
router.post("/activity-log", logActivity) // Added activity log route

module.exports = router
