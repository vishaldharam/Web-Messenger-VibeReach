// Import the functions you need from the SDKs you need

import 'firebase/app'
import 'firebase/auth'

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA21YeyHo1E0QDPPE_pBNiaXcRcfA9djB4",
  authDomain: "chat-app-63cc1.firebaseapp.com",
  projectId: "chat-app-63cc1",
  storageBucket: "chat-app-63cc1.appspot.com",
  messagingSenderId: "672033901430",
  appId: "1:672033901430:web:51ac950208e600cb410857"
};
// Initialize Firebase
export const app = initializeApp(firebaseConfig);

