import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  setCloudSyncStatus: (status: 'synced' | 'syncing' | 'offline' | 'error') => void;
  lastSyncedAt: Date | null;
  setLastSyncedAt: (date: Date | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        setCloudSyncStatus('synced');
      } else {
        setUser(null);
        setLoading(false);
        setCloudSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setCloudSyncStatus('syncing');
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      setCloudSyncStatus('synced');
      setLastSyncedAt(new Date());
      return { success: true };
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setCloudSyncStatus('error');
      return { success: false, error: err.message || 'Google sign in failed' };
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setCloudSyncStatus('syncing');
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
      setCloudSyncStatus('synced');
      setLastSyncedAt(new Date());
      return { success: true };
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setCloudSyncStatus('error');
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      setCloudSyncStatus('syncing');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
      setCloudSyncStatus('synced');
      setLastSyncedAt(new Date());
      return { success: true };
    } catch (err: any) {
      console.error('Email signup error:', err);
      setCloudSyncStatus('error');
      return { success: false, error: err.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // It will trigger onAuthStateChanged which will signInAnonymously
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAnonymous: !!user?.isAnonymous,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        cloudSyncStatus,
        setCloudSyncStatus,
        lastSyncedAt,
        setLastSyncedAt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
