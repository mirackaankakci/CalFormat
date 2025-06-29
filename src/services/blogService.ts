import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase'; // ✅ auth'u da import edin
import { uploadToGitHub, deleteFromGitHub } from './githubImageService';

export interface Blog {
  id?: string;
  title: string;
  slug: string; // ✅ URL slug alanı eklendi
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  createdAt: any;
  updatedAt: any;  published: boolean;
}

// ✅ Slug oluşturma fonksiyonu
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '');
};

// ✅ Admin kontrol fonksiyonunu ekleyin
const checkAdminPermission = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    console.log('Kullanıcı giriş yapmamış');
    return false;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin';
      console.log('Admin kontrolü:', user.email, 'Role:', userData?.role, 'isAdmin:', isAdmin);
      return isAdmin;
    } else {
      console.log('Kullanıcı profili bulunamadı');
      return false;
    }
  } catch (error) {
    console.error('Admin kontrolü hatası:', error);
    return false;
  }
};

export const addBlog = async (blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'slug'>) => {
  // ✅ Admin kontrolü ekleyin
  const isAdmin = await checkAdminPermission();
  if (!isAdmin) {
    throw new Error('Blog oluşturma yetkisine sahip değilsiniz');
  }

  try {
    console.log('Blog ekleniyor:', blogData);
    
    // ✅ Slug otomatik oluştur
    const slug = generateSlug(blogData.title);
    console.log('Oluşturulan slug:', slug);
    
    const docRef = await addDoc(collection(db, 'blogs'), {
      ...blogData,
      slug, // ✅ Slug'ı da ekle
      authorId: auth.currentUser?.uid, // ✅ Yazar ID'si ekleyin
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Blog başarıyla eklendi, ID:', docRef.id, 'Slug:', slug);
    return docRef.id;
  } catch (error) {
    console.error('Blog ekleme hatası:', error);
    throw error;
  }
};

export const getBlogs = async (): Promise<Blog[]> => {
  try {
    console.log('Bloglar getiriliyor...');
    
    const q = query(
      collection(db, 'blogs'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const blogs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Blog[];
    
    console.log('Bloglar getirildi:', blogs.length, 'adet');
    return blogs;
  } catch (error) {
    console.error('Blog getirme hatası:', error);
    throw error;
  }
};

export const getBlog = async (id: string): Promise<Blog | null> => {
  try {
    const docRef = doc(db, 'blogs', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const blogData = { id: docSnap.id, ...docSnap.data() } as Blog;
      
      // ✅ Yayınlanmamış blog için admin kontrolü
      if (!blogData.published) {
        const isAdmin = await checkAdminPermission();
        if (!isAdmin) {
          throw new Error('Bu blog\'a erişim yetkiniz yok');
        }
      }
      
      return blogData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Blog getirme hatası:', error);
    throw error;
  }
};

// ✅ Slug'a göre blog bulma fonksiyonu
export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  try {
    console.log('Blog slug ile aranıyor:', slug);
    
    const q = query(
      collection(db, 'blogs'),
      where('slug', '==', slug)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Blog bulunamadı:', slug);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const blogData = { id: doc.id, ...doc.data() } as Blog;
    
    // ✅ Yayınlanmamış blog için admin kontrolü
    if (!blogData.published) {
      const isAdmin = await checkAdminPermission();
      if (!isAdmin) {
        throw new Error('Bu blog\'a erişim yetkiniz yok');
      }
    }
    
    console.log('Blog slug ile bulundu:', blogData.title);
    return blogData;
  } catch (error) {
    console.error('Blog slug ile getirme hatası:', error);
    throw error;
  }
};

export const updateBlog = async (id: string, blogData: Partial<Blog>) => {
  // ✅ Admin kontrolü ekleyin
  const isAdmin = await checkAdminPermission();
  if (!isAdmin) {
    throw new Error('Blog güncelleme yetkisine sahip değilsiniz');
  }

  try {
    const docRef = doc(db, 'blogs', id);
    
    // ✅ Eğer title güncellendiyse slug'ı da güncelle
    const updateData: any = {
      ...blogData,
      updatedAt: serverTimestamp()
    };
    
    if (blogData.title) {
      updateData.slug = generateSlug(blogData.title);
      console.log('Yeni slug oluşturuldu:', updateData.slug);
    }
    
    await updateDoc(docRef, updateData);
    console.log('Blog güncellendi:', id);
  } catch (error) {
    console.error('Blog güncelleme hatası:', error);
    throw error;
  }
};

export const deleteBlog = async (id: string): Promise<void> => {
  // ✅ Admin kontrolü (zaten var)
  const isAdmin = await checkAdminPermission();
  if (!isAdmin) {
    throw new Error('Blog silme yetkisine sahip değilsiniz');
  }
  
  try {
    // Önce blog'u al
    const blog = await getBlog(id);
    
    // GitHub'taki resmi sil (varsa)
    if (blog?.image && blog.image.includes('cdn.jsdelivr.net')) {
      try {
        // URL'den dosya yolunu çıkar
        const urlParts = blog.image.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `images/blogs/${fileName}`;
        
        await deleteFromGitHub(filePath);
        console.log('GitHub\'tan resim silindi:', filePath);
      } catch (imgError) {
        console.warn('GitHub resim silinirken hata (devam ediliyor):', imgError);
      }
    }
    
    // Blog'u Firestore'dan sil
    await deleteDoc(doc(db, 'blogs', id));
    console.log('Blog silindi:', id);
  } catch (error) {
    console.error('Blog silme hatası:', error);
    throw error;
  }
};

// ✅ Resim upload fonksiyonu ekleyin
export const createBlogWithImage = async (
  blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>, 
  imageFile?: File
): Promise<string> => {
  // Admin kontrolü
  const isAdmin = await checkAdminPermission();
  if (!isAdmin) {
    throw new Error('Blog oluşturma yetkisine sahip değilsiniz');
  }
  
  try {
    let imageUrl = '/calformat.webp'; // Varsayılan resim

    // Resim varsa GitHub'a yükle
    if (imageFile) {
      console.log('Resim GitHub\'a yükleniyor...');
      imageUrl = await uploadToGitHub(imageFile);
      console.log('Resim başarıyla yüklendi:', imageUrl);
    }

    // Blog verisini hazırla
    const finalBlogData = {
      ...blogData,
      image: imageUrl,
      authorId: auth.currentUser?.uid
    };

    // Blog'u kaydet
    return await addBlog(finalBlogData);
    
  } catch (error) {
    console.error('Blog ve resim oluşturma hatası:', error);
    throw error;
  }
};

// ✅ Blog güncelleme resimle
export const updateBlogWithImage = async (
  id: string, 
  blogData: Partial<Blog>, 
  imageFile?: File
): Promise<void> => {
  // Admin kontrolü
  const isAdmin = await checkAdminPermission();
  if (!isAdmin) {
    throw new Error('Blog güncelleme yetkisine sahip değilsiniz');
  }
  
  try {
    const updateData = { ...blogData };

    // Yeni resim varsa GitHub'a yükle
    if (imageFile) {
      console.log('Yeni resim GitHub\'a yükleniyor...');
      updateData.image = await uploadToGitHub(imageFile);
      console.log('Yeni resim başarıyla yüklendi:', updateData.image);
    }

    // Blog'u güncelle
    await updateBlog(id, updateData);
    
  } catch (error) {
    console.error('Blog ve resim güncelleme hatası:', error);
    throw error;
  }
};