import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC3xNyLa9yeKs3dzbKMp6Fc8cgXzveaM1s",
  authDomain: "robe-di-casa.firebaseapp.com",
  projectId: "robe-di-casa",
  storageBucket: "robe-di-casa.firebasestorage.app",
  messagingSenderId: "772759417309",
  appId: "1:772759417309:web:353018b91f5cc4da340634"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)