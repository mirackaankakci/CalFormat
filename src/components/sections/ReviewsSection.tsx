import React, { useState } from 'react';
import ReviewList from '../reviews/ReviewList';
import ReviewForm from '../reviews/ReviewForm';

const ReviewsSection: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="reviews">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900">Müşteri Deneyimleri</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Müşterilerimizin NaturClean Meyve & Sebze Temizleme Tozu hakkındaki görüşlerini okuyun ve kendi deneyiminizi paylaşın.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <ReviewList productId={1} />
          </div>
          
          <div>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                <h2 className="text-xl font-semibold text-gray-900">Deneyiminizi Paylaşın</h2>
              </div>
              
              <div className="p-6">
                {showForm ? (
                  <ReviewForm 
                    productId={1} 
                    onSuccess={() => setShowForm(false)}
                  />
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-6">
                      Bu ürünü kullandınız mı? Deneyiminizi diğer müşterilerle paylaşın ve ürünümüzü geliştirmemize yardımcı olun!
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Değerlendirme Yaz
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-100/50 to-yellow-100/50 p-6 rounded-3xl">
              <h3 className="font-semibold text-lg mb-3">Neden Değerlendirme Yapmak Önemli?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ee7f1a] mt-1.5"></span>
                  <span>Diğer müşterilere yardımcı olursunuz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ee7f1a] mt-1.5"></span>
                  <span>Ürünlerimizi geliştirmemize katkı sağlarsınız</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ee7f1a] mt-1.5"></span>
                  <span>Deneyiminizi paylaşarak topluluğumuza katılırsınız</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;