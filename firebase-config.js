// ใช้ Firebase config ที่คุณให้มา
const firebaseConfig = {
  apiKey: "AIzaSyDGYuI3yxJbUTc6T_0pm6WiEKZul11tXS0",
  authDomain: "suchartwork-1487382986748.firebaseapp.com",
  databaseURL: "https://suchartwork-1487382986748.firebaseio.com",
  projectId: "suchartwork-1487382986748",
  storageBucket: "suchartwork-1487382986748.firebasestorage.app",
  messagingSenderId: "353884592527",
  appId: "1:353884592527:web:3a5c090f8d1dde3deb13fa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
