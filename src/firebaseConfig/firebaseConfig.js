import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC5kZ7RKFUuoB-y-VXfvGiQrymVlbf_pgY",
  authDomain: "re9rh-14223.firebaseapp.com",
  projectId: "re9rh-14223",
  storageBucket: "re9rh-14223.appspot.com",
  messagingSenderId: "626130663716",
  appId: "1:626130663716:web:0bb94169478d9322565bb1",
  measurementId: "G-CZS92VEBZR",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const linkedinProvider = new OAuthProvider("linkedin.com");

async function checkUserExists(email, collectionName = "Empresas") {
  try {
    const usersRef = collection(db, collectionName);
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(
      `Erro ao verificar usuário na coleção ${collectionName}:`,
      error
    );
    return false;
  }
}

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const exists = await checkUserExists(user.email);
    if (!exists) {
      await auth.signOut();
      throw new Error("Usuário não encontrado no banco de dados.");
    }
    return user;
  } catch (error) {
    console.error("Erro ao logar com Google:", error);
    throw error;
  }
}

async function getUserName(uid, collectionName = "Empresas") {
  try {
    const userDoc = await getDoc(doc(db, collectionName, uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.name; // Use "name" aqui
    } else {
      console.log(
        `Documento do usuário não encontrado na coleção ${collectionName}!`
      );
      return "Usuário";
    }
  } catch (error) {
    console.error(
      `Erro ao buscar nome do usuário na coleção ${collectionName}:`,
      error
    );
    return "Usuário";
  }
}

export {
  app,
  db,
  auth,
  googleProvider,
  linkedinProvider,
  doc,
  getDoc,
  checkUserExists,
  signInWithGoogle,
  getUserName,
};
