// src/context/MosqueeContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ROLES } from '@/lib/roles';

const MosqueeContext = createContext({});

export const useMosquee = () => useContext(MosqueeContext);

export function MosqueeProvider({ children }) {
  const { user, userData } = useAuth();
  const [mosqueeActive, setMosqueeActive] = useState(null);
  const [mosqueesAccessibles, setMosqueesAccessibles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      chargerMosqueesAccessibles();
    } else {
      setMosqueesAccessibles([]);
      setMosqueeActive(null);
      setLoading(false);
    }
  }, [userData]);

  const chargerMosqueesAccessibles = async () => {
    try {
      // 🔥 NOUVEAU : Si super_admin, charger TOUTES les mosquées
      if (userData.role === ROLES.SUPER_ADMIN) {
        console.log('🌍 Super Admin détecté - Chargement de toutes les mosquées');
        
        const q = query(collection(db, 'mosquees'), orderBy('nom'));
        const querySnapshot = await getDocs(q);
        const toutesLesMosquees = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMosqueesAccessibles(toutesLesMosquees);
        
        // Option par défaut : Vue globale
        if (userData.mosqueeActive) {
          setMosqueeActive(userData.mosqueeActive);
        } else {
          setMosqueeActive('ALL'); // Vue globale par défaut
        }
        
        setLoading(false);
        return;
      }

      // Pour les autres rôles (admin_mosquee, benevole)
      if (userData && userData.mosquees && userData.mosquees.length > 0) {
        // Charger les détails de chaque mosquée
        const mosqueesPromises = userData.mosquees.map(async (mosqueeId) => {
          const mosqueeDoc = await getDoc(doc(db, 'mosquees', mosqueeId));
          if (mosqueeDoc.exists()) {
            return { id: mosqueeDoc.id, ...mosqueeDoc.data() };
          }
          return null;
        });
        
        const mosquees = (await Promise.all(mosqueesPromises)).filter(m => m !== null);
        setMosqueesAccessibles(mosquees);
        
        // Définir la mosquée active
        if (userData.mosqueeActive && mosquees.find(m => m.id === userData.mosqueeActive)) {
          setMosqueeActive(userData.mosqueeActive);
        } else if (mosquees.length > 0) {
          setMosqueeActive(mosquees[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur chargement mosquées:', error);
    } finally {
      setLoading(false);
    }
  };

  const changerMosqueeActive = async (mosqueeId) => {
    setMosqueeActive(mosqueeId);
    
    // Sauvegarder dans Firestore
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          mosqueeActive: mosqueeId
        });
        console.log(`✅ Mosquée active changée: ${mosqueeId}`);
      } catch (error) {
        console.error('Erreur sauvegarde mosquée active:', error);
      }
    }
  };

  // 🔥 NOUVEAU : Helper pour obtenir l'objet mosquée complet
  const getMosqueeActiveData = () => {
    if (!mosqueeActive) return null;
    
    // Si c'est la vue globale
    if (mosqueeActive === 'ALL') {
      return {
        id: 'ALL',
        nom: 'Vue Globale',
        ville: 'Toutes les mosquées',
        role: userData?.role
      };
    }
    
    // Sinon, récupérer les données de la mosquée
    const mosquee = mosqueesAccessibles.find(m => m.id === mosqueeActive);
    return mosquee ? { ...mosquee, role: userData?.role } : null;
  };

  return (
    <MosqueeContext.Provider value={{ 
      mosqueeActive, 
      setMosqueeActive: changerMosqueeActive,
      mosqueesAccessibles,
      loading,
      userRole: userData?.role,
      getMosqueeActiveData, // 🔥 NOUVEAU
      isSuperAdmin: userData?.role === ROLES.SUPER_ADMIN // 🔥 NOUVEAU
    }}>
      {children}
    </MosqueeContext.Provider>
  );
}