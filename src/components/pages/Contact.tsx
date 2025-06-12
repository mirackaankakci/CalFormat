import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Mail, Phone, Clock, Send, CheckCircle } from 'lucide-react';
import SEO from '../common/SEO';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Form validasyonu
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Lütfen tüm alanları doldurunuz.');
      setIsSubmitting(false);
      return;
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Burada API çağrısı yapılabilir
      // Şimdilik sadece bir simülasyon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError('Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO 
        title="İletişim" 
        description="CalFormat ile iletişime geçin. Sorularınız, önerileriniz veya siparişleriniz için bize ulaşabilirsiniz."
        keywords="CalFormat iletişim, müşteri hizmetleri, geri bildirim, yardım"
        canonicalUrl="https://www.calformat.com.tr/contact"
      />
      <div className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Ana Sayfaya Dön
            </Link>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Bizimle İletişime Geçin</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Sorularınız, önerileriniz veya işbirliği teklifleriniz için bize ulaşabilirsiniz. 
              Size en kısa sürede dönüş yapacağız.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center transform transition duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-[#ee7f1a]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Adresimiz</h3>
              <p className="text-gray-600">
                Fatih Sultan Mehmet Cad, Kavacık, <br />
                Şht. Teğmen Ali Yılmaz Sk. No:14, <br />
                Kat:3, 34810 Beykoz/İstanbul
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl text-center transform transition duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-[#ee7f1a]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">E-posta</h3>
              <p className="text-gray-600 mb-2">Müşteri Destek:</p>
              <a href="mailto:info@uniqcal.com.tr" className="text-[#ee7f1a] font-medium hover:text-[#d62d27] hover:underline">
                info@uniqcal.com.tr
              </a>
              <p className="text-gray-600 mt-3 mb-2">Kurumsal İletişim:</p>
              <a href="mailto:kurumsal@uniqcal.com.tr" className="text-[#ee7f1a] font-medium hover:text-[#d62d27] hover:underline">
                kurumsal@uniqcal.com.tr
              </a>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl text-center transform transition duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-[#ee7f1a]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Telefon</h3>
              <p className="text-gray-600 mb-2">Müşteri Hizmetleri:</p>
              <a href="tel:+908502887878" className="text-[#ee7f1a] font-medium hover:text-[#d62d27] hover:underline">
                +90 850 288 78 78
              </a>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <p className="text-gray-500 text-sm">Hafta içi / Cumartesi: 10:00 - 18:00</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold mb-6">İletişim Formu</h2>
              
              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Mesajınız Gönderildi!</h3>
                  <p className="text-green-600 mb-4">
                    İletişim talebiniz başarıyla alındı. En kısa sürede size dönüş yapacağız.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)} 
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
                  >
                    Yeni Mesaj Gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Adınız Soyadınız*
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Adınız ve soyadınız"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a] focus:ring-opacity-20 outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta Adresiniz*
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ornek@email.com"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a] focus:ring-opacity-20 outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Konu*
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a] focus:ring-opacity-20 outline-none transition-colors"
                      required
                    >
                      <option value="">Konu seçiniz</option>
                      <option value="Ürün Bilgisi">Ürün Bilgisi</option>
                      <option value="Sipariş Takibi">Sipariş Takibi</option>
                      <option value="İade ve Değişim">İade ve Değişim</option>
                      <option value="Şikayet">Şikayet</option>
                      <option value="Öneri">Öneri</option>
                      <option value="İş Birliği">İş Birliği</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Mesajınız*
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Mesajınızı buraya yazın..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#ee7f1a] focus:ring-2 focus:ring-[#ee7f1a] focus:ring-opacity-20 outline-none transition-colors"
                      required
                    ></textarea>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        <span>Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Mesajı Gönder</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            
            <div>
              <div className="bg-white p-8 rounded-3xl shadow-xl mb-8">
                <h2 className="text-2xl font-bold mb-6">SSS</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ürünleriniz için güvenlik sertifikaları var mı?
                    </h3>
                    <p className="text-gray-600">
                      Evet, tüm ürünlerimiz gerekli güvenlik ve kalite testlerinden geçmiş olup ilgili sertifikalara sahiptir.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Kargo teslimatı ne kadar sürer?
                    </h3>
                    <p className="text-gray-600">
                      Siparişleriniz, ödeme onayından sonra genellikle 1-3 iş günü içerisinde kargoya verilir ve bulunduğunuz bölgeye göre 1-4 iş günü içerisinde teslim edilir.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      İade koşullarınız nelerdir?
                    </h3>
                    <p className="text-gray-600">
                      14 gün içerisinde ürünleri herhangi bir gerekçe göstermeden iade edebilirsiniz. Detaylı bilgi için 
                      <Link to="/refund-policy" className="text-[#ee7f1a] hover:text-[#d62d27] hover:underline ml-1">
                        İade Politikamızı
                      </Link> inceleyebilirsiniz.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <Link to="/faq" className="inline-flex items-center text-[#ee7f1a] font-medium hover:text-[#d62d27]">
                    Tüm SSS'leri Görüntüle
                    <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] p-8 rounded-3xl shadow-xl text-white">
                <h2 className="text-2xl font-bold mb-4">Bizi Takip Edin</h2>
                <p className="mb-6">
                  Kampanyalar, yeni ürünler ve sağlıklı yaşam ipuçları için sosyal medya hesaplarımızı takip edebilirsiniz.
                </p>
                
                <div className="flex space-x-4 justify-center">
                  <a href="https://facebook.com/uniqcal" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/uniqcal" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://twitter.com/uniqcal" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="https://youtube.com/uniqcal" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="w-full h-96 rounded-3xl overflow-hidden shadow-xl">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3006.6519690917356!2d29.07629641224152!3d41.10286092117162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cacf8fa969c65d%3A0xd05f76dd13ec7af9!2sKavac%C4%B1k%2C%20FSM%20Cd.%2C%2034810%20Beykoz%2F%C4%B0stanbul!5e0!3m2!1sen!2str!4v1654782947153!5m2!1sen!2str" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
                title="Uniqcal İletişim Hizmetleri Konumu"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;