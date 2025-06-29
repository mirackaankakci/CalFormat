import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import FeaturesSection from './components/sections/FeaturesSection';
import VideoSection from './components/sections/VideoSection';
import ProductDetailsSection from './components/sections/ProductDetailsSection';
import ReviewsSection from './components/sections/ReviewsSection';
import CTASection from './components/sections/CTASection';
import BlogPreviewSection from './components/sections/BlogPreviewSection'; // ✅ Ekleyin
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
import { BlogProvider } from './contexts/BlogContext';
import { AuthProvider } from './contexts/AuthContext';
import { IkasProvider } from './contexts/IkasContext';
import SEO from './components/common/SEO';
import useSEO from './hooks/useSEO';
import BlogList from './components/pages/BlogList';
import BlogDetail from './components/pages/BlogDetail';
import BlogCreate from './components/pages/BlogCreate';
import BlogEdit from './components/pages/BlogEdit';
import Login from './components/pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUsers from './components/pages/AdminUsers';
import AdminDashboard from './components/pages/AdminDashboard';
import Register from './components/pages/Register';
import Profile from './components/pages/Profile';
import Unauthorized from './components/pages/Unauthorized';
import VerifyEmail from './components/pages/VerifyEmail';
import AdminDebug from './components/pages/AdminDebug';

// ✅ Blog migration script'i - geliştirme için
import addSlugsToExistingBlogs from './scripts/addSlugsToBlogs';

// ✅ Migration script'i global olarak erişilebilir yap
if (typeof window !== 'undefined') {
  (window as any).addSlugsToExistingBlogs = addSlugsToExistingBlogs;
}


// Ana sayfa bileşeni
const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Ana sayfa için gelişmiş JSON-LD yapılandırılmış veri
  const homeStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.calformat.com.tr/#organization",
        "name": "CalFormat",
        "url": "https://www.calformat.com.tr",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.calformat.com.tr/logo.png",
          "width": 300,
          "height": 100
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+90-XXX-XXX-XXXX",
          "contactType": "customer service",
          "availableLanguage": "Turkish"
        },
        "sameAs": [
          "https://www.facebook.com/calformat",
          "https://www.instagram.com/calformat",
          "https://twitter.com/calformat"
        ]
      },
      {
        "@type": "Product",
        "@id": "https://www.calformat.com.tr/#product",
        "name": "CalFormat Meyve Sebze Temizleme Tozu",
        "image": [
          "https://www.calformat.com.tr/calformat.webp",
          "https://www.calformat.com.tr/product-gallery-1.jpg",
          "https://www.calformat.com.tr/product-gallery-2.jpg"
        ],
        "description": "Meyve ve sebzelerdeki pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizleyen %100 doğal temizleme tozu. Ailenizin sağlığını korur, doğal beslenmenizi destekler.",
        "brand": {
          "@type": "Brand",
          "name": "CalFormat"
        },
        "manufacturer": {
          "@id": "https://www.calformat.com.tr/#organization"
        },
        "category": "Doğal Temizlik Ürünleri",
        "offers": {
          "@type": "Offer",
          "url": "https://www.calformat.com.tr",
          "priceCurrency": "TRY",
          "price": "299.90",
          "priceValidUntil": "2025-12-31",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@id": "https://www.calformat.com.tr/#organization"
          },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": "0",
              "currency": "TRY"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": {
                "@type": "QuantitativeValue",
                "minValue": 1,
                "maxValue": 2,
                "unitCode": "DAY"
              },
              "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": 1,
                "maxValue": 3,
                "unitCode": "DAY"
              }
            }
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": "2847"
        },
        "features": [
          "%100 Doğal İçerik",
          "Pestisit Temizleyici",
          "Balmumu Çözücü",
          "Mikrop Öldürücü",
          "Kolay Kullanım"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.calformat.com.tr/#website",
        "url": "https://www.calformat.com.tr",
        "name": "CalFormat",
        "description": "Doğal meyve sebze temizleme çözümleri",
        "publisher": {
          "@id": "https://www.calformat.com.tr/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.calformat.com.tr/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <>
      <SEO 
        title="Ana Sayfa"
        description="CalFormat ile meyve ve sebzelerinizdeki pestisit, balmumu ve zararlı kalıntıları %100 doğal yöntemlerle temizleyin. Ailenizin sağlığını koruyun, doğal beslenmenizi destekleyin. Ücretsiz kargo!"
        keywords="meyve sebze temizleme tozu, pestisit temizleyici, doğal temizlik, organik temizleyici, balmumu çözücü, zirai ilaç temizleyici, CalFormat, meyve sebze hijyen, doğal ürün, pestisit arındırıcısı"
        structuredData={homeStructuredData}
        canonicalUrl="https://www.calformat.com.tr"
        ogTitle="CalFormat - %100 Doğal Meyve Sebze Temizleme Tozu"
        ogDescription="Pestisit, balmumu ve zararlı kalıntıları etkili şekilde temizleyin. Doğal, güvenli ve aileniz için ideal!"
        ogImage="https://www.calformat.com.tr/calformat-og.jpg"
        twitterTitle="CalFormat - Doğal Meyve Sebze Temizleyici"
        twitterDescription="🌿 %100 doğal ✨ Etkili temizlik 🛡️ Aileniz için güvenli"
      />
      <FloatingElements />
      <HeroSection isVisible={isVisible} />
      <FeaturesSection />
      <VideoSection />
         <CTASection />
      <ProductDetailsSection />
      <BlogPreviewSection /> {/* ✅ Blog preview section'ı ekleyin */}
   
      <ReviewsSection />
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
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route 
            path="/admin/blog/edit/:id" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <BlogEdit />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/blog/create" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <BlogCreate />
              </ProtectedRoute>
            } 
          />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/distance-sales-agreement" element={<DistanceSalesAgreement />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/admin-login" element={<Login />} />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          
          {/* Debug route - geliştirme için */}
          <Route path="/admin/debug" element={<AdminDebug />} />
          
          {/* Public routes */}
          <Route path="/register" element={<Register />} />
          
          {/* ✅ Protected admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* ✅ Protected user routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Error routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

        </Routes>
        <Footer />
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
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
              <BlogProvider>
                <IkasProvider>
                  <AppContent />
                </IkasProvider>
              </BlogProvider>
            </ReviewProvider>
          </CartProvider>
        </BrowserRouter>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;