/* eslint-disable @typescript-eslint/no-explicit-any */
// Database utilities for Firestore

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, getDocs, where, deleteDoc } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Date;
  lastLoginAt: Date;
  userId: string;
  username?: string; // Optional username for profile URL
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  brand: string;
  category: string | null;
  description: string | null;
  ingredients: string[] | null;
  imageUrl: string | null;
  purchaseDate: Date | null;
  expiryDate: Date | null;
  price: number | null;
  size: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'finished';
  wouldRepurchase: boolean;
}

export interface RoutineStep {
  productId: string;
  order: number;
  notes?: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  type: 'morning' | 'evening' | 'weekly' | 'custom';
  description?: string;
  steps: RoutineStep[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface RoutineCompletion {
  id: string;
  userId: string;
  routineId: string;
  type: 'morning' | 'evening' | 'weekly' | 'custom';
  date: Date;
  completedSteps: Array<{
    productId: string;
    completed: boolean;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get a user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Create a new user profile in Firestore
 */
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, user);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update an existing user profile in Firestore
 */
export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Check if a username is available
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    // In a real app, you would query Firestore to check if the username exists
    // This would typically involve a query to check if any user has this username
    console.log(`Checking if username ${username} is available`);
    return true;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

/**
 * Add a new product to Firestore
 */
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const productsRef = doc(collection(db, 'products'));
    
    // Create the product data with required fields
    const productData = {
      ...product,
      id: productsRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: product.status || 'active',
      wouldRepurchase: product.status === 'finished' ? (product.wouldRepurchase || false) : false,
      // Ensure optional fields are null instead of undefined
      category: product.category || null,
      description: product.description || null,
      ingredients: product.ingredients || null,
      imageUrl: product.imageUrl || null,
      purchaseDate: product.purchaseDate || null,
      expiryDate: product.expiryDate || null,
      price: product.price || null,
      size: product.size || null,
      rating: product.rating || null,
      notes: product.notes || null,
    };
    
    await setDoc(productsRef, productData);
    return productsRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

/**
 * Get all products for a user
 */
export const getUserProducts = async (userId: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  } catch (error) {
    console.error('Error getting user products:', error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId: string, data: Partial<Product>): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Add a new routine to Firestore
 */
export const addRoutine = async (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const routinesRef = doc(collection(db, 'routines'));
    
    const routineData = {
      ...routine,
      id: routinesRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    
    await setDoc(routinesRef, routineData);
    return routinesRef.id;
  } catch (error) {
    console.error('Error adding routine:', error);
    throw error;
  }
};

/**
 * Get all routines for a user
 */
export const getUserRoutines = async (userId: string): Promise<Routine[]> => {
  try {
    const routinesRef = collection(db, 'routines');
    const q = query(routinesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Routine;
    });
  } catch (error) {
    console.error('Error getting user routines:', error);
    throw error;
  }
};

/**
 * Update an existing routine
 */
export const updateRoutine = async (routineId: string, data: Partial<Routine>): Promise<void> => {
  try {
    const routineRef = doc(db, 'routines', routineId);
    await updateDoc(routineRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating routine:', error);
    throw error;
  }
};

/**
 * Delete a routine
 */
export const deleteRoutine = async (routineId: string): Promise<void> => {
  try {
    const routineRef = doc(db, 'routines', routineId);
    await deleteDoc(routineRef);
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
};

/**
 * Add a new routine completion record
 */
export const addRoutineCompletion = async (completion: Omit<RoutineCompletion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const completionsRef = doc(collection(db, 'routineCompletions'));
    
    const completionData = {
      ...completion,
      id: completionsRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(completionsRef, completionData);
    return completionsRef.id;
  } catch (error) {
    console.error('Error adding routine completion:', error);
    throw error;
  }
};

/**
 * Get routine completions for a specific date range
 */
export const getRoutineCompletions = async (userId: string, startDate: Date, endDate: Date): Promise<RoutineCompletion[]> => {
  try {
    const completionsRef = collection(db, 'routineCompletions');
    const q = query(
      completionsRef,
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as RoutineCompletion;
    });
  } catch (error) {
    console.error('Error getting routine completions:', error);
    throw error;
  }
};

/**
 * Update a routine completion record
 */
export const updateRoutineCompletion = async (completionId: string, data: Partial<RoutineCompletion>): Promise<void> => {
  try {
    const completionRef = doc(db, 'routineCompletions', completionId);
    await updateDoc(completionRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating routine completion:', error);
    throw error;
  }
};

