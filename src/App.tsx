import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import FeaturesSection from './components/sections/FeaturesSection';
import ProductDetailsSection from './components/sections/ProductDetailsSection';
import ReviewsSection from './components/sections/ReviewsSection';
import CTASection from './components/sections/CTASection';
import FloatingElements from './components/ui/FloatingElements';

function App() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <FloatingElements />
      <Header />
      <HeroSection isVisible={isVisible} />
      <FeaturesSection />
      <ProductDetailsSection />
      <ReviewsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default App;