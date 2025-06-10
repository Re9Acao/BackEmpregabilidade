import { FirebaseApp } from "firebase/app";
import { Firestore, doc, getDoc } from "firebase/firestore";
import { Auth, GoogleAuthProvider, OAuthProvider, User } from "firebase/auth";

declare const app: FirebaseApp;
declare const db: Firestore;
declare const auth: Auth;
declare const googleProvider: GoogleAuthProvider;
declare const linkedinProvider: OAuthProvider;

declare function checkUserExists(
  email: string,
  collectionName?: string
): Promise<boolean>;
declare function signInWithGoogle(): Promise<User>;
declare function getUserName(
  uid: string,
  collectionName?: string
): Promise<string>;

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
