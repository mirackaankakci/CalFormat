import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Sabit rota meta verileri
const routes = {
  '/': {
    title: 'Ana Sayfa',
    description: 'CalFormat ile meyve ve sebzelerinizdeki pestisit, balmumu ve zararlı kalıntıları %100 doğal yöntemlerle temizleyin. Ailenizin sağlığını koruyun!',
    keywords: 'meyve sebze temizleme tozu, pestisit temizleyici, doğal temizlik, organik temizleyici, balmumu çözücü, pestisit kalıntısı, meyve sebze hijyen, pestisit arındırıcısı, CalFormat, doğal ürün',
    canonical: 'https://www.calformat.com',
    ogImage: 'https://www.calformat.com/calformat-og.jpg',
  },
  '/blogs': {
    title: 'Blog Yazıları',
    description: 'Sağlıklı yaşam, doğal beslenme ve meyve-sebze temizliği hakkında uzman görüşleri ve faydalı bilgiler.',
    keywords: 'CalFormat blog, sağlıklı yaşam, doğal beslenme, meyve sebze temizliği, pestisit temizleme, organik yaşam',
    canonical: 'https://www.calformat.com/blogs',
    ogImage: 'https://www.calformat.com/blog-og.jpg',
  },
  '/contact': {
    title: 'İletişim',
    description: 'CalFormat ile iletişime geçin. Sorularınız, önerileriniz veya siparişleriniz için bize ulaşabilirsiniz. Müşteri memnuniyeti önceliğimizdir.',
    keywords: 'CalFormat iletişim, müşteri hizmetleri, iletişim formu, adres, telefon, email, destek',
    canonical: 'https://www.calformat.com/contact',
    ogImage: 'https://www.calformat.com/contact-og.jpg',
  },
  '/faq': {
    title: 'Sık Sorulan Sorular',
    description: 'CalFormat ürünleri, kullanım şekli, ödeme ve kargo hakkında sık sorulan sorular ve detaylı yanıtları.',
    keywords: 'CalFormat sss, sık sorulan sorular, yardım merkezi, ürün kullanımı, kargo, ödeme, iade',
    canonical: 'https://www.calformat.com/faq',
    ogImage: 'https://www.calformat.com/faq-og.jpg',
  },
  '/refund-policy': {
    title: 'İade ve Değişim Politikası',
    description: 'CalFormat ürünleri için iade ve değişim koşulları, süreçleri ve haklarınız hakkında detaylı bilgiler.',
    keywords: 'iade politikası, değişim koşulları, ürün iadesi, para iadesi, garanti, müşteri hakları',
    canonical: 'https://www.calformat.com/refund-policy',
    ogImage: 'https://www.calformat.com/refund-og.jpg',
  },
  '/privacy-policy': {
    title: 'Gizlilik Politikası',
    description: 'CalFormat olarak kişisel verilerinizin korunmasına önem veriyoruz. KVKK uyumlu gizlilik politikamız hakkında bilgi alın.',
    keywords: 'gizlilik politikası, kişisel veri koruma, KVKK, çerez politikası, veri güvenliği, gizlilik',
    canonical: 'https://www.calformat.com/privacy-policy',
    ogImage: 'https://www.calformat.com/privacy-og.jpg',
  },
  '/distance-sales-agreement': {
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'CalFormat mesafeli satış sözleşmesi koşulları, şartları ve yasal yükümlülükler.',
    keywords: 'mesafeli satış sözleşmesi, online alışveriş sözleşmesi, yasal koşullar, e-ticaret',
    canonical: 'https://www.calformat.com/distance-sales-agreement',
    ogImage: 'https://www.calformat.com/agreement-og.jpg',
  },
  '/cart': {
    title: 'Alışveriş Sepetim',
    description: 'CalFormat alışveriş sepetinizi görüntüleyin ve siparişinizi tamamlayın.',
    canonical: 'https://www.calformat.com/cart',
    noIndex: true,  },
  '/checkout': {
    title: 'Güvenli Ödeme',
    description: '256-bit SSL şifrelemeli güvenli ödeme sayfası.',
    canonical: 'https://www.calformat.com/checkout',
    noIndex: true,
  },
};

// Varsayılan meta veriler
const defaultMeta = {
  title: 'CalFormat | Doğal Meyve Sebze Temizleme Tozu',
  description: 'CalFormat, meyve ve sebzelerdeki pestisit, balmumu ve zararlı kalıntıları %100 doğal yöntemlerle temizleyen etkili bir çözümdür.',
  keywords: 'meyve sebze temizleme tozu, pestisit temizleyici, doğal temizlik, organik temizleyici, balmumu çözücü',
  canonical: 'https://www.calformat.com',
  ogImage: 'https://www.calformat.com/calformat-og.jpg',
};

const useSEO = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Mevcut sayfaya göre meta verileri al
    const route = routes[location.pathname as keyof typeof routes] || defaultMeta;
    
    // Title güncelle
    document.title = route.title ? `${route.title} | CalFormat` : defaultMeta.title;
    
    // Meta açıklama ve anahtar kelimeleri güncelle
    const updateMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };
      updateMetaTag('description', route.description || defaultMeta.description);
    if ('keywords' in route && route.keywords) {
      updateMetaTag('keywords', route.keywords);
    } else if (defaultMeta.keywords) {
      updateMetaTag('keywords', defaultMeta.keywords);
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
    const updateOGTag = (property: string, content: string) => {
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
    
    const ogImage = ('ogImage' in route && route.ogImage) ? route.ogImage : defaultMeta.ogImage;
    updateOGTag('og:image', ogImage);
    updateOGTag('og:type', 'website');
    updateOGTag('og:site_name', 'CalFormat');
    
    // Twitter kartı meta etiketleri
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', route.title ? `${route.title} | CalFormat` : defaultMeta.title);
    updateMetaTag('twitter:description', route.description || defaultMeta.description);
    updateMetaTag('twitter:image', ogImage);
    
    // Robots meta etiketini güncelle
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.setAttribute('name', 'robots');
      document.head.appendChild(robotsTag);
    }
    const robotsContent = ('noIndex' in route && route.noIndex) ? 'noindex, nofollow' : 'index, follow';
    robotsTag.setAttribute('content', robotsContent);
    
  }, [location.pathname]);

  return null;
};

export default useSEO;
