import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  signInWithGoogle as firebaseGoogleSignIn,
  signUpWithEmail as firebaseSignUpWithEmail,
  signInWithEmail as firebaseSignInWithEmail,
  sendPasswordReset as firebaseSendPasswordReset,
  signOutUser as firebaseSignOutUser,
  subscribeToAuthChanges,
  syncUserProfile,
  updateUserInterestsInFirestore,
  updateUserProfileData,
} from '../services/auth';
import { UserProfile, GamerInterest } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateInterests: (interests: GamerInterest[]) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setUserRole: (role: 'user' | 'admin') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);

          // Runtime Authentication Audit Log
          const isAdminCalculated = profile?.role === 'admin';
          const reason = profile?.role === 'admin'
            ? 'O campo userProfile.role no documento Firestore é igual a "admin".'
            : `O campo userProfile.role no documento Firestore é "${profile?.role || 'user'}" (diferente de "admin").`;

          console.group('🔍 AUDITORIA DE AUTENTICAÇÃO EM TEMPO DE EXECUÇÃO');
          console.log('1. UID do usuário autenticado:', currentUser.uid);
          console.log('2. E-mail do usuário:', currentUser.email || '(sem e-mail)');
          console.log('3. Caminho completo do documento Firestore:', `users/${currentUser.uid}`);
          console.log('4. Conteúdo completo do documento:', profile);
          console.log('5. Valor exato de userProfile.role:', profile?.role);
          console.log('6. Valor exato de isAdmin:', isAdminCalculated);
          console.log('7. Motivo de isAdmin:', reason);
          console.groupEnd();
        } catch (error) {
          console.error('Failed to sync profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profile = await syncUserProfile(user);
      setUserProfile(profile);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const res = await firebaseGoogleSignIn();
      setUser(res.user);
      setUserProfile(res.profile);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await firebaseSignInWithEmail(email, pass);
      setUser(res.user);
      setUserProfile(res.profile);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const res = await firebaseSignUpWithEmail(email, pass, name);
      setUser(res.user);
      setUserProfile(res.profile);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await firebaseSendPasswordReset(email);
  };

  const logout = async () => {
    await firebaseSignOutUser();
    setUser(null);
    setUserProfile(null);
  };

  const updateInterests = async (interests: GamerInterest[]) => {
    if (!user) return;
    await updateUserInterestsInFirestore(user.uid, interests);
    setUserProfile((prev) => prev ? { ...prev, gamePreferences: interests } : null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfileData(user.uid, data);
    setUserProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  const isAdmin = userProfile?.role === 'admin';

  const setUserRole = async (role: 'user' | 'admin') => {
    if (!user) return;
    await updateUserProfileData(user.uid, { role });
    setUserProfile((prev) => prev ? { ...prev, role } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        updateInterests,
        updateProfile,
        setUserRole,
        refreshProfile,
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
