const { getFormSubmissionCollection } = require("../config/db");
const { ObjectId } = require("mongodb");

// Submit a new form (already done)
const submitForm = async (req, res) => {
    try {
        const data = req.body;

        if (
            !data.firstName ||
            !data.lastName ||
            !data.email ||
            !data.phone ||
            !data.investmentAmount ||
            !data.preferredCrypto ||
            typeof data.consent !== "boolean"
        ) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const collection = await getFormSubmissionCollection();

        const newSubmission = {
            ...data,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(newSubmission);

        res.status(201).json({
            success: true,
            message: "Form submitted successfully",
            submissionId: result.insertedId,
        });
    } catch (error) {
        console.error("Error submitting form:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Get all submissions (with pagination + status filter)
const getSubmissions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;

        const collection = await getFormSubmissionCollection();

        const query = {};
        if (status && status !== "all") {
            query.status = status;
        }

        const total = await collection.countDocuments(query);
        const submissions = await collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        res.status(200).json({
            success: true,
            data: {
                submissions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Update submission status
const updateSubmissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "contacted", "ignored"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status" });
        }

        const collection = await getFormSubmissionCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: "Submission not found" });
        }

        res.status(200).json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating submission:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = {
    submitForm,
    getSubmissions,
    updateSubmissionStatus,
};
