// components/ProtectedRoute.tsx - YENİ GÜVENLİK BİLEŞENİ
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireEmailVerification = true 
}) => {
  const { user, userProfile, loading, isAdmin } = useAuth();

  // Loading durumu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#ee7f1a]"></div>
      </div>
    );
  }

  // ✅ Giriş kontrolü
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // ✅ Email doğrulama kontrolü
  if (requireEmailVerification && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // ✅ Admin yetkisi kontrolü
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Kullanıcı profili kontrolü
  if (!userProfile) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;