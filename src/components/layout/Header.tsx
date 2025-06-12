import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const Header: React.FC = () => {
  const { items } = useCart();
  
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
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Stokta
              </span>
              <span>Ücretsiz Kargo</span>
            </div>
            <Link to="/cart" className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 relative">
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