const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://cryptoboost:kgrGHxwQs6GZvS5p@cluster0.luptoyb.mongodb.net/`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const connectDB = async () => {
  await client.connect();
  console.log("✅ MongoDB connected successfully.");
};

const getUserCollection = () => {
  return client.db("userCollection").collection("users");
};
const getActivityLogs = () => {
  return client.db("userCollection").collection("activity_logs");
};
const getOrdersCollection = () => {
  return client.db("userCollection").collection("orders");
};
const getCountersCollection = () => {
  return client.db("userCollection").collection("counters");
};
module.exports = {
  connectDB,
  getUserCollection,
  getActivityLogs,
};

module.exports = { connectDB, getUserCollection, getActivityLogs, getOrdersCollection, getCountersCollection };
