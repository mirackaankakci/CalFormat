import React, { useState } from 'react';
import { Play, ExternalLink, Youtube } from 'lucide-react';

const VideoSection: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  
  // YouTube video ID'nizi buraya ekleyin
  const youtubeVideoId = "z2U1c_YjL3g"; // Örnek: "dQw4w9WgXcQ"
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;

  const handlePlayVideo = () => {
    setShowVideo(true);
  };

  const handleOpenYoutube = () => {
    window.open(youtubeUrl, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-24 h-24 bg-[#ee7f1a]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-[#d62d27]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            CalFormat'ı <span className="text-[#ee7f1a]">Keşfedin</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Meyve ve sebzelerinizi nasıl temizlediğimizi, doğal içeriklerimizi ve 
            etkili sonuçlarımızı videomuzda görün.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black group">
            
            {!showVideo ? (
              // Video Thumbnail
              <div className="relative aspect-video">
                <img
                  src={thumbnailUrl}
                  alt="CalFormat Video"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback image if YouTube thumbnail fails
                    e.currentTarget.src = "/calformat.webp";
                  }}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <button
                    onClick={handlePlayVideo}
                    className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full transition-all duration-300 transform hover:scale-110 shadow-xl group/play"
                  >
                    <Play className="w-12 h-12 ml-1 group-hover/play:scale-110 transition-transform duration-300" />
                  </button>
                </div>

                {/* YouTube Badge */}
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </div>

                {/* External Link Button */}
                <button
                  onClick={handleOpenYoutube}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // YouTube Embed
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                  title="CalFormat Video"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>

          {/* Video Actions */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handlePlayVideo}
              className="bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-xl hover:from-[#d62d27] hover:to-[#ee7f1a] transition-all duration-300 transform hover:scale-105 font-semibold flex items-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5" />
              Videoyu İzle
            </button>
            
            <button
              onClick={handleOpenYoutube}
              className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:border-red-600 hover:text-red-600 transition-all duration-300 transform hover:scale-105 font-semibold flex items-center gap-2 shadow-lg"
            >
              <Youtube className="w-5 h-5" />
              YouTube'da Aç
            </button>
          </div>

          {/* Video Description Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                title: "Doğal İçerik",
                description: "100% doğal malzemelerle üretilen formülümüz",
                icon: "🌿"
              },
              {
                title: "Etkili Temizlik",
                description: "Pestisit ve kimyasal kalıntıları etkili şekilde temizler",
                icon: "✨"
              },
              {
                title: "Güvenli Kullanım",
                description: "Ailece güvenle kullanabileceğiniz doğal çözüm",
                icon: "🛡️"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default VideoSection;