const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json"); // Path to your Firebase private key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

