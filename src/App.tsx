import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import FeaturesSection from './components/sections/FeaturesSection';
import ProductDetailsSection from './components/sections/ProductDetailsSection';
import ReviewsSection from './components/sections/ReviewsSection';
import CTASection from './components/sections/CTASection';
import FloatingElements from './components/ui/FloatingElements';
import Cart from './components/pages/Cart';
import Checkout from './components/pages/Checkout';
import { CartProvider } from './contexts/CartContext';
import { ReviewProvider } from './contexts/ReviewContext';

// Ana sayfa bileşeni
const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <FloatingElements />
      <HeroSection isVisible={isVisible} />
      <FeaturesSection />
      <ProductDetailsSection />
      <ReviewsSection />
      <CTASection />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ReviewProvider>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
            <Footer />
          </div>
        </ReviewProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;