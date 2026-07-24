import {
  setDocument,
  deleteDocument,
  getCollection,
  subscribeToCollection,
} from './firestore';
import { where } from 'firebase/firestore';
import { FirestoreFavorite, FavoriteType } from '../types';

export const saveFavoriteInFirestore = async (
  userId: string,
  type: FavoriteType,
  itemId: string,
  title: string,
  image?: string,
  extraData?: any,
  url?: string
): Promise<void> => {
  const docId = `${userId}_${itemId}`;
  const favoriteData: FirestoreFavorite = {
    id: docId,
    userId,
    type,
    itemId,
    title,
    image: image || '',
    url: url || '',
    createdAt: new Date().toISOString(),
    extraData: extraData || null,
  };

  await setDocument('favorites', docId, favoriteData, true);
};

export const removeFavoriteFromFirestore = async (
  userId: string,
  itemId: string
): Promise<void> => {
  const docId = `${userId}_${itemId}`;
  await deleteDocument('favorites', docId);
};

export const getUserFavorites = async (userId: string): Promise<FirestoreFavorite[]> => {
  try {
    return await getCollection<FirestoreFavorite>('favorites', where('userId', '==', userId));
  } catch (error) {
    console.error('Error fetching user favorites from Firestore:', error);
    return [];
  }
};

export const subscribeUserFavorites = (
  userId: string,
  callback: (favorites: FirestoreFavorite[]) => void
) => {
  return subscribeToCollection<FirestoreFavorite>(
    'favorites',
    callback,
    where('userId', '==', userId)
  );
};
