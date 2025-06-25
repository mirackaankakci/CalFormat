// services/githubImageService.ts - GÜVENLİ VERSİYON


// Token kontrolü ekleyin
if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('GitHub konfigürasyonu eksik!');
  throw new Error('GitHub ayarları yapılandırılmamış');
}

export interface GitHubUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export const uploadToGitHub = async (file: File): Promise<string> => {
  // ✅ Gelişmiş dosya validasyonu
  const maxSize = 10 * 1024 * 1024; // 10MB (daha güvenli limit)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Dosya boyutu
  if (file.size > maxSize) {
    throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
  }
  
  if (file.size < 1024) { // 1KB'dan küçük
    throw new Error('Dosya çok küçük, geçerli bir resim değil');
  }
  
  // MIME type kontrolü
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Sadece JPEG, PNG ve WebP formatları desteklenir');
  }
  
  // Dosya uzantısı kontrolü
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Geçersiz dosya uzantısı');
  }
  
  // ✅ Dosya adı güvenliği
  const sanitizeFileName = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Özel karakterleri kaldır
      .replace(/\.+/g, '.') // Çoklu noktaları tek yap
      .replace(/^\./, '') // Başlangıçtaki noktayı kaldır
      .substring(0, 100); // Max 100 karakter
  };

  // ✅ Magic number kontrolü (dosya header kontrolü)
  const checkFileSignature = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer.slice(0, 4));
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        
        // JPEG: FFD8FF, PNG: 89504E47, WebP: 52494646
        const validSignatures = ['ffd8ff', '89504e47', '52494646'];
        const isValid = validSignatures.some(sig => hex.startsWith(sig));
        resolve(isValid);
      };
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  // Dosya signature kontrolü
  const isValidImage = await checkFileSignature(file);
  if (!isValidImage) {
    throw new Error('Geçersiz resim dosyası');
  }

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GitHub konfigürasyonu eksik');
  }

  try {
    const base64Content = await fileToBase64(file);
    
    // ✅ Güvenli dosya adı
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `blog-${timestamp}-${randomId}-${sanitizedName}`;
    const filePath = `images/blogs/${fileName}`;

    console.log('GitHub\'a güvenli resim yükleniyor:', fileName);

    // ✅ Request timeout ekle
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye timeout

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CalFormat-App/1.0'
        },
        body: JSON.stringify({
          message: `Add blog image: ${fileName}`,
          content: base64Content.split(',')[1],
          branch: GITHUB_BRANCH,
          committer: {
            name: 'CalFormat Bot',
            email: 'bot@calformat.com'
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // ✅ Detaylı hata loglama
      const errorData = await response.json().catch(() => ({}));
      console.error('GitHub API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 401) {
        throw new Error('GitHub token geçersiz');
      } else if (response.status === 403) {
        throw new Error('GitHub API rate limit aşıldı');
      } else if (response.status === 404) {
        throw new Error('GitHub repository bulunamadı');
      } else if (response.status === 422) {
        throw new Error('Dosya zaten mevcut veya geçersiz');
      }
      
      throw new Error(`GitHub upload hatası: ${response.status}`);
    }

    const data = await response.json();
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@${GITHUB_BRANCH}/${filePath}`;
    
    console.log('Güvenli GitHub upload başarılı:', cdnUrl);
    return cdnUrl;
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout - Dosya çok büyük veya bağlantı yavaş');
      }
      throw error;
    }
    throw new Error('Bilinmeyen upload hatası');
  }
};

// Dosyayı Base64'e çevirme fonksiyonu
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Dosya okunamadı'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };
    
    reader.readAsDataURL(file);
  });
};

// GitHub'tan dosya silme
export const deleteFromGitHub = async (filePath: string): Promise<void> => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GitHub konfigürasyonu eksik');
  }

  try {
    // Önce dosyanın SHA'sını al
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CalFormat-App'
        }
      }
    );

    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        console.warn('Dosya zaten mevcut değil:', filePath);
        return;
      }
      throw new Error(`Dosya bilgisi alınamadı: ${getResponse.status}`);
    }

    const fileData = await getResponse.json();
    
    // Dosyayı sil
    const deleteResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'CalFormat-App'
        },
        body: JSON.stringify({
          message: `Delete blog image: ${filePath}`,
          sha: fileData.sha,
          branch: GITHUB_BRANCH
        })
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Dosya silinemedi: ${deleteResponse.status}`);
    }

    console.log('GitHub\'tan dosya silindi:', filePath);
    
  } catch (error) {
    console.error('GitHub delete error:', error);
    throw new Error('Dosya silinirken hata oluştu');
  }
};

// GitHub repository durumunu kontrol et
export const checkGitHubConnection = async (): Promise<boolean> => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.warn('GitHub konfigürasyonu eksik');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CalFormat-App'
        }
      }
    );

    return response.ok;
  } catch (error) {
    console.error('GitHub connection check failed:', error);
    return false;
  }
};