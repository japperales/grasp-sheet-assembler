import firebase from "firebase";

const firebaseConfig = {
    apiKey: "AIzaSyBBpssbuYv4mOdoiEPj1ttEeunSZzAnfdo",
    authDomain: "vroomfirebase.firebaseapp.com",
    databaseURL: "https://vroomfirebase.firebaseio.com",
    projectId: "vroomfirebase",
    storageBucket: "vroomfirebase.appspot.com",
    messagingSenderId: "688676467237",
    appId: "1:688676467237:web:72f407ab4aba62526f05cc"
};

firebase.initializeApp(firebaseConfig);
export default firebase
