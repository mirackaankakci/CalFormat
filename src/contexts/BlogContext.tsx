import React, { createContext, useContext, useState, useEffect } from 'react';
import { Blog, getBlogs } from '../services/blogService';

interface BlogContextType {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
  refreshBlogs: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Bloglar yenileniyor...');
      
      const blogsData = await getBlogs();
      setBlogs(blogsData);
      
      console.log('Bloglar başarıyla yüklendi:', blogsData.length, 'adet');
    } catch (err) {
      const errorMessage = 'Bloglar yüklenirken hata oluştu';
      setError(errorMessage);
      console.error('Blog yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBlogs();
  }, []);

  return (
    <BlogContext.Provider value={{ blogs, loading, error, refreshBlogs }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};