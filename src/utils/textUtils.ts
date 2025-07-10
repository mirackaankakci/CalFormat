/**
 * HTML etiketlerini ve gereksiz karakterleri temizler
 * @param htmlString - Temizlenecek HTML string
 * @returns Temizlenmiş string
 */
export const cleanHtmlText = (htmlString: string): string => {
  if (!htmlString || typeof htmlString !== 'string') {
    return '';
  }

  return htmlString
    // HTML etiketlerini kaldır
    .replace(/<[^>]*>/g, ' ')
    // HTML entities'leri normal karakterlere çevir
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    // Çoklu boşlukları tek boşlukla değiştir
    .replace(/\s+/g, ' ')
    // Başında ve sonundaki boşlukları kaldır
    .trim();
};

/**
 * Metni belirli kelime sayısında keser
 * @param text - Kesilecek metin
 * @param wordLimit - Maksimum kelime sayısı
 * @returns Kesilmiş metin
 */
export const truncateText = (text: string, wordLimit: number = 30): string => {
  if (!text) return '';
  
  const words = text.split(' ');
  if (words.length <= wordLimit) {
    return text;
  }
  
  return words.slice(0, wordLimit).join(' ') + '...';
};

/**
 * HTML string'i temizler ve belirli kelime sayısında keser
 * @param htmlString - Temizlenecek HTML string
 * @param wordLimit - Maksimum kelime sayısı
 * @returns Temizlenmiş ve kesilmiş metin
 */
export const cleanAndTruncateHtml = (htmlString: string, wordLimit: number = 30): string => {
  const cleanText = cleanHtmlText(htmlString);
  return truncateText(cleanText, wordLimit);
};
