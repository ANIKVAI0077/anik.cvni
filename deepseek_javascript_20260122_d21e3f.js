// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7-4v0NZuFQz-kg3qidn_4HglfR3tXy84",
    authDomain: "shimu-digital-studio.firebaseapp.com",
    projectId: "shimu-digital-studio",
    storageBucket: "shimu-digital-studio.appspot.com",
    messagingSenderId: "852545253639",
    appId: "1:852545253639:web:5f06b13f22d09eaa072384"
};

// Initialize Firebase
let db, storage;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}