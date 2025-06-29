import React from 'react';
import { ShoppingCart, ChevronDown, Shield, Plus, Users, FileText, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { items } = useCart();
  const { user, userProfile, isAdmin, logout } = useAuth();
  
  // Sepetteki toplam ürün miktarını hesapla
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src='/logo.png' width="200px" alt="NaturClean Logo" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Durum Bilgileri */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Stokta
              </span>
              <span>Ücretsiz Kargo</span>
            </div>

            {/* Blog Linki */}
            <Link 
              to="/blogs" 
              className="hidden md:block text-gray-700 hover:text-[#ee7f1a] transition-colors duration-300 font-medium"
            >
              Blog
            </Link>

            {/* Admin Panel - Sadece Admin Kullanıcılar */}
            {isAdmin && (
              <div className="relative group">
                <button className="text-gray-700 hover:text-[#ee7f1a] transition-colors duration-300 flex items-center gap-1 font-medium">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="py-2">
                    {/* Admin Panel Başlığı */}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                      Admin Panel
                    </div>
                    
                    {/* Blog Yönetimi */}
                    <Link
                      to="/admin/blog/create"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-[#ee7f1a] transition-colors duration-300"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yeni Blog Ekle</span>
                    </Link>
                    
                    <Link
                      to="/blogs"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-[#ee7f1a] transition-colors duration-300"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Blog Yönetimi</span>
                    </Link>                    {/* Kullanıcı Yönetimi */}
                    <Link
                      to="/admin/users"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-[#ee7f1a] transition-colors duration-300"
                    >
                      <Users className="w-4 h-4" />
                      <span>Kullanıcı Yönetimi</span>
                    </Link>

                    {/* Debug Panel */}
                    <Link
                      to="/admin/debug"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-[#ee7f1a] transition-colors duration-300"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Debug Panel</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Kullanıcı Menüsü */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-[#ee7f1a] transition-colors duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {userProfile?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">
                      {userProfile?.displayName || 'Kullanıcı'}
                    </div>
                    {isAdmin && (
                      <div className="text-xs text-[#ee7f1a] font-semibold">Admin</div>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="py-2">
                    {/* Kullanıcı Bilgileri */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isAdmin ? 'Admin Kullanıcı' : 'Normal Kullanıcı'}
                      </div>
                    </div>
                    
                    {/* Çıkış Yap */}
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Giriş Yap Butonu */
<div className="hidden md:block"></div>
            )}

            {/* Sepet */}
            <Link 
              to="/cart" 
              className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 relative"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Sepet</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[#d62d27] w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shadow-md">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;