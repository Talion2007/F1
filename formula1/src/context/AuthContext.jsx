/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser, // <-- IMPORTANT: deleteUser imported
  updateProfile
} from 'firebase/auth';
// REMOVED/COMMENTED OUT: Firestore imports if you are NOT using Firestore
// import { doc, deleteDoc } from 'firebase/firestore';
import { auth } from '../firebase/firebaseConfig'; // Ensure 'auth' is imported correctly

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, name, imageFile) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const profileUpdates = { displayName: name };
      // If you're handling imageFile for photoURL, ensure logic is here and Firebase Storage is set up
      await updateProfile(user, profileUpdates);
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // --- THIS IS THE KEY FUNCTION FOR DELETING THE ACCOUNT ---
  const deleteAccount = async () => {
    if (!currentUser) {
      throw new Error("No user is logged in to delete.");
    }

    try {
      // If you ARE using Firestore for user data, UNCOMMENT AND ADJUST THIS BLOCK:
      /*
      // Delete user document from Firestore (if applicable)
      if (db) { // Ensure 'db' is imported from firebaseConfig if used
        const userDocRef = doc(db, "users", currentUser.uid);
        await deleteDoc(userDocRef);
        console.log("User document deleted from Firestore.");
      }
      */

      // Delete user from Firebase Authentication
      await deleteUser(currentUser);
      console.log("Firebase Auth user deleted.");
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("Please re-authenticate to delete your account. Log out and log back in, then try again.");
      }
      throw error;
    }
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    deleteAccount // <-- Make sure it's included here
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}