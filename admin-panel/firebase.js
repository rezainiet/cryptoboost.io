// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDyYqMuKgCOEPMfXfcpmjn3YcTv09pVqKc",
    authDomain: "cryptoboost-778d7.firebaseapp.com",
    projectId: "cryptoboost-778d7",
    storageBucket: "cryptoboost-778d7.firebasestorage.app",
    messagingSenderId: "730926969265",
    appId: "1:730926969265:web:a83598f7a2f019eb41cd90",
    measurementId: "G-Z16W241B76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);