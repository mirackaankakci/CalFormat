import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
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
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import RefundPolicy from './components/pages/RefundPolicy';
import DistanceSalesAgreement from './components/pages/DistanceSalesAgreement';
import Contact from './components/pages/Contact';
import FAQ from './components/pages/FAQ';
import { CartProvider } from './contexts/CartContext';
import { ReviewProvider } from './contexts/ReviewContext';
import SEO from './components/common/SEO';
import useSEO from './hooks/useSEO'; // Normal import

// Ana sayfa bileşeni
const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Ana sayfa için JSON-LD yapılandırılmış veri
  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "CalFormat Meyve Sebze Temizleme Tozu",
    "image": "https://www.calformat.com.tr/product-image.jpg",
    "description": "Meyve ve sebzelerdeki zirai ilaç kalıntılarını ve mikroorganizmaları temizleyen doğal bir temizleme tozu.",
    "brand": {
      "@type": "Brand",
      "name": "CalFormat"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://www.calformat.com.tr",
      "priceCurrency": "TRY",
      "price": "149.90",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <>
      <SEO 
        title="Ana Sayfa"
        description="CalFormat ile meyve ve sebzelerinizdeki zirai ilaç kalıntılarını ve mikroorganizmaları doğal yollarla temizleyin. %100 doğal içerikli temizleme tozu."
        keywords="meyve sebze temizleme tozu, zirai ilaç temizleyici, doğal temizlik, organik temizleyici"
        structuredData={homeStructuredData}
      />
      <FloatingElements />
      <HeroSection isVisible={isVisible} />
      <FeaturesSection />
      <ProductDetailsSection />
      <ReviewsSection />
      <CTASection />
    </>
  );
};

// AppContent bileşeni - Router içinde olacak
const AppContent = () => {
  // Düzgün şekilde hook kullanma
  useSEO();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/distance-sales-agreement" element={<DistanceSalesAgreement />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        {/* Temel meta etiketleri */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ee7f1a" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon ve touch icon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </Helmet>
      
      <BrowserRouter>
        <CartProvider>
          <ReviewProvider>
            <AppContent />
          </ReviewProvider>
        </CartProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;