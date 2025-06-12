import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  structuredData?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  canonicalUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  noIndex = false,
  structuredData
}) => {
  // Site adı
  const siteName = "CalFormat | Doğal Meyve Sebze Temizleme Tozu";
  
  // Varsayılan değerler
  const metaTitle = title ? `${title} | CalFormat` : siteName;
  const metaDescription = description || "CalFormat, meyve ve sebzelerdeki zirai ilaç kalıntılarını ve mikroorganizmaları temizleyen doğal bir temizleme tozudur. %100 doğal içerikler ile ailenizin sağlığını korur.";
  const metaKeywords = keywords || "meyve sebze temizleme tozu, doğal temizleyici, zirai ilaç temizleyici, organik temizleyici";
  const metaOgTitle = ogTitle || metaTitle;
  const metaOgDescription = ogDescription || metaDescription;
  const metaOgImage = ogImage || "https://www.calformat.com.tr/og-image.jpg"; // Varsayılan OG görseli
  const metaOgUrl = ogUrl || "https://www.calformat.com.tr";
  const metaTwitterTitle = twitterTitle || metaOgTitle;
  const metaTwitterDescription = twitterDescription || metaOgDescription;
  const metaTwitterImage = twitterImage || metaOgImage;
  const metaCanonicalUrl = canonicalUrl || metaOgUrl;

  return (
    <Helmet>
      {/* Temel meta etiketleri */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={metaKeywords} />}
      <link rel="canonical" href={metaCanonicalUrl} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaOgUrl} />
      <meta property="og:title" content={metaOgTitle} />
      <meta property="og:description" content={metaOgDescription} />
      <meta property="og:image" content={metaOgImage} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={metaOgUrl} />
      <meta name="twitter:title" content={metaTwitterTitle} />
      <meta name="twitter:description" content={metaTwitterDescription} />
      <meta name="twitter:image" content={metaTwitterImage} />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Yapılandırılmış veri (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;