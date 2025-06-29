// Mevcut bloglara slug ekleme scripti
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateSlug, Blog } from '../services/blogService';

const addSlugsToExistingBlogs = async () => {
  console.log('🔄 Mevcut bloglara slug ekleme işlemi başlıyor...');
  
  try {
    // Tüm blogları getir
    const blogsSnapshot = await getDocs(collection(db, 'blogs'));
    const blogs = blogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Blog & { id: string })[];
    
    console.log(`📝 ${blogs.length} blog bulundu.`);
    
    let updatedCount = 0;
    
    for (const blog of blogs) {
      // Eğer slug yoksa ekle
      if (!blog.slug && blog.title) {
        const slug = generateSlug(blog.title);
        
        // Aynı slug'ın var olup olmadığını kontrol et
        const existingBlog = blogs.find(b => b.slug === slug && b.id !== blog.id);
        const finalSlug = existingBlog ? `${slug}-${blog.id}` : slug;
        
        // Blog'u güncelle
        await updateDoc(doc(db, 'blogs', blog.id), {
          slug: finalSlug
        });
        
        console.log(`✅ Blog güncellendi: "${blog.title}" -> "${finalSlug}"`);
        updatedCount++;
      } else if (blog.slug) {
        console.log(`⏭️ Blog zaten slug'a sahip: "${blog.title}" -> "${blog.slug}"`);
      }
    }
    
    console.log(`🎉 İşlem tamamlandı! ${updatedCount} blog güncellendi.`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
};

// Script'i çalıştır
if (typeof window !== 'undefined') {
  // Browser'da çalışıyorsa console'dan çalıştırılabilir
  (window as any).addSlugsToExistingBlogs = addSlugsToExistingBlogs;
  console.log('🚀 Migration script yüklendi. Çalıştırmak için: addSlugsToExistingBlogs()');
}

export default addSlugsToExistingBlogs;
