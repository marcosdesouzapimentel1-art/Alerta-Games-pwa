import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  signOut,
  onAuthStateChanged,
  User,
  NextOrObserver,
  Unsubscribe,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getDocument, setDocument, updateDocument } from './firestore';
import { UserProfile, GamerInterest } from '../types';

const googleProvider = new GoogleAuthProvider();

/**
 * Ensure user document exists in Firestore /users/{uid}
 */
export const syncUserProfile = async (user: User, customDisplayName?: string): Promise<UserProfile> => {
  try {
    const existing = await getDocument<UserProfile>('users', user.uid);

    if (existing) {
      // If user profile exists, update displayName or photoURL if changed, keep existing role (defaulting to 'user' if undefined)
      const updatedProfile: UserProfile = {
        ...existing,
        uid: user.uid,
        email: user.email || existing.email || '',
        displayName: customDisplayName || user.displayName || existing.displayName || 'Gamer',
        photoURL: user.photoURL || existing.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
        role: existing.role || 'user',
        gamePreferences: existing.gamePreferences || ['PlayStation', 'PC', 'GTA 6', 'Steam', 'Game Pass'],
        favoriteCategories: existing.favoriteCategories || ['Todas'],
        // Compatibility properties
        name: customDisplayName || user.displayName || existing.displayName || 'Gamer',
        gamerTag: existing.gamerTag || `Gamer#${user.uid.slice(0, 4)}`,
        avatarUrl: user.photoURL || existing.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
        xpLevel: existing.xpLevel || 1,
        title: existing.title || 'Iniciante Gamer',
        joinedDate: existing.joinedDate || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      };
      await setDocument('users', user.uid, updatedProfile, true);
      return updatedProfile;
    }

    // Create new profile - ALWAYS role: 'user'
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: customDisplayName || user.displayName || 'Gamer Alerta',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gamePreferences: ['PlayStation', 'PC', 'GTA 6', 'Steam', 'Game Pass'],
      favoriteCategories: ['Todas'],
      name: customDisplayName || user.displayName || 'Gamer Alerta',
      gamerTag: `Gamer#${Math.floor(1000 + Math.random() * 9000)}`,
      avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      xpLevel: 1,
      title: 'Iniciante Gamer',
      joinedDate: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    };

    await setDocument('users', user.uid, newProfile, false);
    return newProfile;
  } catch (error) {
    console.error('Error syncing user profile:', error);
    // Fallback profile if offline
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: customDisplayName || user.displayName || 'Gamer',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      role: 'user',
      createdAt: new Date().toISOString(),
      gamePreferences: ['PlayStation', 'PC', 'GTA 6', 'Steam', 'Game Pass'],
      favoriteCategories: ['Todas'],
      name: customDisplayName || user.displayName || 'Gamer',
      gamerTag: 'GamerAlert#2026',
      avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      xpLevel: 1,
      title: 'Iniciante Gamer',
      joinedDate: 'Hoje',
    };
  }
};

/**
 * Sign in using Google OAuth Popup
 */
export const signInWithGoogle = async (): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(result.user);
    return { user: result.user, profile };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign in anonymously for temporary session access
 */
export const signInAnonymouslyUser = async (): Promise<User> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

/**
 * Register a new user with Email, Password and Name
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result.user) {
      await updateFirebaseProfile(result.user, { displayName });
    }
    const profile = await syncUserProfile(result.user, displayName);
    return { user: result.user, profile };
  } catch (error) {
    console.error('Error creating user with email:', error);
    throw error;
  }
};

/**
 * Sign in an existing user with Email and Password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await syncUserProfile(result.user);
    return { user: result.user, profile };
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Update user game preferences ("Meus Interesses")
 */
export const updateUserInterestsInFirestore = async (
  uid: string,
  gamePreferences: GamerInterest[]
): Promise<void> => {
  try {
    await updateDocument('users', uid, { gamePreferences });
  } catch (error) {
    console.error('Error updating interests in Firestore:', error);
    throw error;
  }
};

/**
 * Update user profile (Name, Photo, etc.)
 */
export const updateUserProfileData = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    await updateDocument('users', uid, data);
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    throw error;
  }
};

/**
 * Sign out current authenticated user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out user:', error);
    throw error;
  }
};

/**
 * Subscribe to Firebase auth state changes
 */
export const subscribeToAuthChanges = (callback: NextOrObserver<User | null>): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Update user role in Firestore (e.g. 'user' or 'admin')
 */
export const setUserRoleInFirestore = async (uid: string, role: 'user' | 'admin'): Promise<void> => {
  try {
    await updateDocument('users', uid, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
