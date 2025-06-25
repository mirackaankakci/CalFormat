// utils/security.ts - YENİ GÜVENLİK UTİLLERİ
import DOMPurify from 'dompurify';

// ✅ HTML içerik temizleme
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['class'],
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
};

// ✅ Text içerik temizleme
export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

// ✅ URL doğrulama
export const isValidURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// ✅ Dosya adı güvenliği
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .substring(0, 100);
};

// ✅ Rate limiting
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number, private windowMs: number) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Eski girişimleri temizle
    const validAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
}

// Global rate limiter instance'ları
export const loginRateLimit = new RateLimiter(5, 15 * 60 * 1000); // 5 deneme / 15 dakika
export const blogCreateRateLimit = new RateLimiter(3, 60 * 1000); // 3 blog / dakika