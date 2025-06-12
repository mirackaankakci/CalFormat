import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Sabit rota meta verileri
const routes = {
  '/': {
    title: 'Ana Sayfa',
    description: 'CalFormat ile meyve ve sebzelerinizdeki zirai ilaç kalıntılarını ve mikroorganizmaları doğal yollarla temizleyin.',
    keywords: 'meyve sebze temizleme tozu, zirai ilaç temizleyici, doğal temizlik, organik temizleyici, pestisit temizleme, pestisit kalıntısı, meyve sebze hijyen,pestisit arındırıcısı',
    canonical: 'https://www.calformat.com.tr',
    ogImage: 'https://www.calformat.com.tr/images/home-og.jpg',
  },
  '/contact': {
    title: 'İletişim',
    description: 'CalFormat ile iletişime geçin. Sorularınız, önerileriniz veya siparişleriniz için bize ulaşabilirsiniz.',
    keywords: 'CalFormat iletişim, müşteri hiz, iletişim formu, adres, ',
    canonical: 'https://www.calformat.com.tr/contact',
    ogImage: 'https://www.calformat.com.tr/images/contact-og.jpg',
  },
  '/faq': {
    title: 'Sık Sorulan Sorular',
    description: 'CalFormat ürünleri ve hizmetleri hakkında sık sorulan sorular ve yanıtları.',
    keywords: 'CalFormat sss, sık sorulan sorular, yardım merkezi, ürün kullanımı',
    canonical: 'https://www.calformat.com.tr/faq',
    ogImage: 'https://www.calformat.com.tr/images/faq-og.jpg',
  },
  '/refund-policy': {
    title: 'İade ve Değişim Politikası',
    description: 'CalFormat ürünleri için iade ve değişim koşulları hakkında detaylı bilgiler.',
    keywords: 'iade politikası, değişim koşulları, ürün iadesi, para iade',
    canonical: 'https://www.calformat.com.tr/refund-policy',
    ogImage: 'https://www.calformat.com.tr/images/refund-og.jpg',
  },
  '/privacy-policy': {
    title: 'Gizlilik Politikası',
    description: 'CalFormat olarak kişisel verilerinizin korunmasına önem veriyoruz. Gizlilik politikamız hakkında bilgi alın.',
    keywords: 'gizlilik politikası, kişisel veri koruma, çerez politikası, veri güvenliği',
    canonical: 'https://www.calformat.com.tr/privacy-policy',
    ogImage: 'https://www.calformat.com.tr/images/privacy-og.jpg',
  },
  '/distance-sales-agreement': {
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'CalFormat mesafeli satış sözleşmesi koşulları ve şartları.',
    keywords: 'mesafeli satış sözleşmesi, online alışveriş sözleşmesi, yasal koşullar',
    canonical: 'https://www.calformat.com.tr/distance-sales-agreement',
    ogImage: 'https://www.calformat.com.tr/images/agreement-og.jpg',
  },
  '/cart': {
    title: 'Sepetim',
    description: 'CalFormat alışveriş sepetiniz.',
    canonical: 'https://www.calformat.com.tr/cart',
    noIndex: true,
  },
  '/checkout': {
    title: 'Ödeme',
    description: 'Güvenli ödeme sayfası.',
    canonical: 'https://www.calformat.com.tr/checkout',
    noIndex: true,
  },
};

// Varsayılan meta veriler
const defaultMeta = {
  title: 'CalFormat | Doğal Meyve Sebze Temizleme Tozu',
  description: 'CalFormat, meyve ve sebzelerdeki zirai ilaç kalıntılarını ve mikroorganizmaları temizleyen doğal bir temizleme tozudur.',
  keywords: 'meyve sebze temizleme tozu, doğal temizleyici, zirai ilaç temizleyici, organik temizleyici',
  canonical: 'https://www.calformat.com.tr',
  ogImage: 'https://www.calformat.com.tr/images/default-og.jpg',
};

const useSEO = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Mevcut sayfaya göre meta verileri al
    const route = routes[location.pathname] || defaultMeta;
    
    // Title güncelle
    document.title = route.title ? `${route.title} | CalFormat` : defaultMeta.title;
    
    // Meta açıklama ve anahtar kelimeleri güncelle
    const updateMetaTag = (name, content) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };
    
    updateMetaTag('description', route.description || defaultMeta.description);
    if (route.keywords || defaultMeta.keywords) {
      updateMetaTag('keywords', route.keywords || defaultMeta.keywords);
    }
    
    // Canonical link güncelle
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', route.canonical || defaultMeta.canonical);
    
    // Open Graph meta etiketleri
    const updateOGTag = (property, content) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };
    
    updateOGTag('og:title', route.title ? `${route.title} | CalFormat` : defaultMeta.title);
    updateOGTag('og:description', route.description || defaultMeta.description);
    updateOGTag('og:url', route.canonical || defaultMeta.canonical);
    updateOGTag('og:image', route.ogImage || defaultMeta.ogImage);
    updateOGTag('og:type', 'website');
    updateOGTag('og:site_name', 'CalFormat');
    
    // Twitter kartı meta etiketleri
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', route.title ? `${route.title} | CalFormat` : defaultMeta.title);
    updateMetaTag('twitter:description', route.description || defaultMeta.description);
    updateMetaTag('twitter:image', route.ogImage || defaultMeta.ogImage);
    
    // Robots meta etiketini güncelle
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.setAttribute('name', 'robots');
      document.head.appendChild(robotsTag);
    }
    robotsTag.setAttribute('content', route.noIndex ? 'noindex, nofollow' : 'index, follow');
    
  }, [location.pathname]);

  return null;
};

export default useSEO;