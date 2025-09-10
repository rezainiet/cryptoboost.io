const express = require("express");
const router = express.Router();

const formController = require("../Controllers/formController");

// Public - Create form submission request
router.post("/submit", formController.submitForm);

// Admin - Get all form submissions (with pagination & filter)
router.get("/admin/form-submissions", formController.getSubmissions);

// Admin - Update form submission status
router.patch("/admin/form-submissions/:id", formController.updateSubmissionStatus);

module.exports = router;
