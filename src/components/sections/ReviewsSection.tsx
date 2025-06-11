import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import SectionTitle from '../ui/SectionTitle';
import { reviews } from '../../data/reviews';

const ReviewsSection: React.FC = () => {
  const [currentReview, setCurrentReview] = useState(0);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          badge="Müşteri Deneyimleri"
          title="Müşteri Yorumları"
          description="Binlerce mutlu müşterimizin deneyimleri"
        />
        
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-8 rounded-3xl border border-orange-100/50 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ee7f1a]/5 to-[#e5b818]/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ee7f1a] to-[#d62d27] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {reviews[currentReview].avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{reviews[currentReview].name}</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{reviews[currentReview].date}</span>
                      <span className="text-sm text-[#ee7f1a] font-medium">{reviews[currentReview].location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={prevReview}
                    className="p-3 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-[#ee7f1a] hover:to-[#d62d27] hover:text-white transition-all duration-300 transform hover:scale-110"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextReview}
                    className="p-3 rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-[#ee7f1a] hover:to-[#d62d27] hover:text-white transition-all duration-300 transform hover:scale-110"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-lg text-gray-700 italic leading-relaxed">"{reviews[currentReview].comment}"</p>
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-3">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 transform hover:scale-125 ${
                  index === currentReview 
                    ? 'bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] shadow-lg' 
                    : 'bg-orange-200 hover:bg-orange-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;