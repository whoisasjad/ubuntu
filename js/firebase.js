// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUO2ajkrvo0Xsr-YAAbu_Q1fVP8QHYeco",
  authDomain: "sustaini-verse.firebaseapp.com",
  projectId: "sustaini-verse",
  storageBucket: "sustaini-verse.firebasestorage.app",
  messagingSenderId: "953852877465",
  appId: "1:953852877465:web:9bc5a257d9591734e53608"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();