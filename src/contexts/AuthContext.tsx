// contexts/AuthContext.tsx - GÜVENLİ VERSİYON
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // ✅ Kullanıcı profili güvenli şekilde getir
  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      console.log('👤 Kullanıcı profili getiriliyor:', user.email);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('📊 Firestore\'dan gelen veri:', data);
          // ✅ Veri doğrulama
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || data.displayName || '',
          role: data.role === 'admin' ? 'admin' : 'user', // Güvenli rol kontrolü
          emailVerified: user.emailVerified,
          createdAt: data.createdAt
        };
        
        console.log('✅ İşlenmiş profil:', profile);
        return profile;
      } else {
        console.warn('⚠️ Kullanıcı profili Firestore\'da bulunamadı:', user.uid);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Kullanıcı profili getirme hatası:', error);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user);
      setUserProfile(profile);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      if (user) {
        // ✅ Email doğrulama kontrolü
        if (!user.emailVerified) {
          console.warn('Email doğrulanmamış');
        }
        
        setUser(user);
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);  // ✅ Admin kontrolü için debug log ekle
  const isAdmin = userProfile?.role === 'admin';
  console.log('🔍 Admin kontrolü:', {
    userEmail: user?.email,
    userProfileExists: !!userProfile,
    role: userProfile?.role,
    isAdmin
  });

  const value = {
    user,
    userProfile,
    loading,
    isAdmin,
    logout,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};