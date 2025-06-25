import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyPromptCount, setMonthlyPromptCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserData(user.uid);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentDate = new Date();
        const lastResetDate = userData.lastResetDate?.toDate() || new Date(0);
        
        // Reset monthly count if it's a new month
        if (currentDate.getMonth() !== lastResetDate.getMonth() || 
            currentDate.getFullYear() !== lastResetDate.getFullYear()) {
          await updateDoc(doc(db, 'users', uid), {
            monthlyPromptCount: 0,
            lastResetDate: currentDate
          });
          setMonthlyPromptCount(0);
        } else {
          setMonthlyPromptCount(userData.monthlyPromptCount || 0);
        }
      } else {
        // Create new user document
        await setDoc(doc(db, 'users', uid), {
          email: user?.email,
          monthlyPromptCount: 0,
          lastResetDate: new Date()
        });
        setMonthlyPromptCount(0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const incrementPromptCount = async () => {
    if (!user) return false;
    
    if (monthlyPromptCount >= 10) {
      return false; // Limit exceeded
    }

    try {
      const newCount = monthlyPromptCount + 1;
      await updateDoc(doc(db, 'users', user.uid), {
        monthlyPromptCount: newCount
      });
      setMonthlyPromptCount(newCount);
      return true;
    } catch (error) {
      console.error('Error incrementing prompt count:', error);
      return false;
    }
  };

  const canUsePrompt = monthlyPromptCount < 10;

  return {
    user,
    loading,
    monthlyPromptCount,
    canUsePrompt,
    signIn,
    signUp,
    logout,
    incrementPromptCount
  };
}