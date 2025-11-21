'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setUser(firebaseUser);
              setUserData(data);
              
              console.log('✅ User connecté:', {
                email: firebaseUser.email,
                role: data.role,
                mosquees: data.mosquees
              });
            } else {
              console.warn('⚠️ Document user introuvable dans Firestore');
              setUser(firebaseUser);
              setUserData(null);
            }
          } catch (err) {
            console.error('❌ Erreur chargement userData:', err);
            setUser(firebaseUser);
            setUserData(null);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('Auth error:', error);
        setError(error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Firebase init error:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  if (error) {
    return <div>Erreur Firebase: {error.message}</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      loading, 
      signIn, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}