import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Search } from 'lucide-react';
import SEO from '../common/SEO';

// SSS kategorileri ve soruları
const faqData = [
  {
    category: "Ürün Bilgileri",
    questions: [
      {
        question: "CalFormat ürünlerinin içeriğinde neler bulunmaktadır?",
        answer: "CalFormat, içerisinde doğal bileşenler bulunan bir meyve sebze temizleme tozudur. İçeriğinde sodyum bikarbonat, sitrik asit ve doğal mineraller bulunur. Kimyasal kalıntı ve zararlı maddeleri etkin bir şekilde temizler."
      },
      {
        question: "Ürünleriniz için güvenlik sertifikaları var mı?",
        answer: "Evet, tüm ürünlerimiz gerekli güvenlik ve kalite testlerinden geçmiş olup Sağlık Bakanlığı onaylıdır. ISO 9001 ve TSE belgelerine sahiptir. Ürünümüz laboratuvar testlerinden geçmiş ve güvenli olduğu kanıtlanmıştır."
      },
      {
        question: "CalFormat ürünleri organik midir?",
        answer: "CalFormat ürünleri tamamen doğal bileşenlerden oluşmaktadır, ancak resmi olarak organik sertifikasyona sahip değildir. Ürünlerimizde zararlı kimyasallar, yapay tatlandırıcılar veya koruyucular kullanılmamaktadır."
      },
      {
        question: "Raf ömrü ne kadardır?",
        answer: "CalFormat ürünleri, açılmamış ambalajında, doğrudan güneş ışığından uzak, serin ve kuru bir ortamda saklandığında üretim tarihinden itibaren 24 ay boyunca kullanılabilir. Ambalaj üzerindeki son kullanma tarihini kontrol etmenizi öneririz."
      },
      {
        question: "CalFormat ürünü alerjik reaksiyona neden olur mu?",
        answer: "CalFormat'ın içeriğinde alerjik reaksiyona neden olabilecek bilinen bir madde bulunmamaktadır. Ancak, herhangi bir ürüne karşı hassasiyeti olan kişilerin kullanmadan önce içerik listesini kontrol etmelerini ve gerekirse bir doktora danışmalarını öneririz."
      }
    ]
  },
  {
    category: "Sipariş ve Ödeme",
    questions: [
      {
        question: "Sipariş verdikten sonra ne kadar sürede elime ulaşır?",
        answer: "Siparişleriniz, ödeme onayından sonra genellikle 1-3 iş günü içerisinde kargoya verilir ve bulunduğunuz bölgeye göre 1-4 iş günü içerisinde teslim edilir. Toplamda maksimum 7 iş günü içerisinde ürününüz elinize ulaşmış olacaktır."
      },
      {
        question: "Minimum sipariş tutarı var mı?",
        answer: "Sitemizde minimum sipariş tutarı bulunmamaktadır. Dilediğiniz miktarda sipariş verebilirsiniz. Ancak 150 TL üzeri siparişlerde kargo ücretsizdir."
      },
      {
        question: "Hangi ödeme yöntemlerini kullanabilirim?",
        answer: "Web sitemiz üzerinden kredi kartı, banka kartı, havale/EFT yöntemlerinden birini seçerek ödeme yapabilirsiniz. Kredi kartı ile ödemelerinizde tek çekim veya taksit seçeneklerinden yararlanabilirsiniz. Ayrıca kapıda ödeme imkanımız da bulunmaktadır."
      },
      {
        question: "Siparişimi nasıl takip edebilirim?",
        answer: "Siparişiniz kargoya verildikten sonra size e-posta ile kargo takip numarası gönderilecektir. Bu numara ile kargo firmasının web sitesi üzerinden siparişinizi takip edebilirsiniz. Ayrıca hesabım bölümünden de sipariş durumunu kontrol edebilirsiniz."
      },
      {
        question: "Siparişimi iptal edebilir miyim?",
        answer: "Siparişiniz kargoya verilmeden önce iptal işlemi yapabilirsiniz. Bunun için müşteri hizmetlerimizle iletişime geçmeniz yeterlidir. Ancak kargoya verilmiş siparişler için ürünü teslim aldıktan sonra iade prosedürünü uygulamanız gerekmektedir."
      }
    ]
  },
  {
    category: "Kullanım",
    questions: [
      {
        question: "CalFormat nasıl kullanılır?",
        answer: "1 litre suya 1 kapak (yaklaşık 5 gr) CalFormat ekleyip karıştırın. Hazırladığınız solüsyonda meyve ve sebzeleri 10-15 dakika bekletin. Ardından bol su ile durulayıp tüketebilirsiniz. Ayrıca direkt olarak meyve ve sebzelerin üzerine de serpebilirsiniz. Daha sonra iyice durulayınız."
      },
      {
        question: "CalFormat ile hangi gıdaları temizleyebilirim?",
        answer: "CalFormat ile tüm meyve ve sebzeleri etkili bir şekilde temizleyebilirsiniz. Özellikle kabuklu meyveler, yapraklı yeşillikler, üzüm, çilek gibi yüzeyinde ilaç kalıntısı barındırabilecek gıdaların temizliğinde oldukça etkilidir."
      },
      {
        question: "CalFormat zararlı mikroorganizmaları yok eder mi?",
        answer: "Evet, CalFormat formülü zararlı bakterilerin birçoğunu ve mikroorganizmaları etkili bir şekilde temizler. Laboratuvar testleri ürünümüzün meyve ve sebzeler üzerindeki zararlı mikroorganizmaları %99.9 oranında azalttığını göstermiştir."
      },
      {
        question: "CalFormat pestisitleri tamamen temizler mi?",
        answer: "CalFormat, meyve ve sebzeler üzerindeki pestisitlerin (tarım ilaçları) büyük bir kısmını etkili bir şekilde temizler. Yapılan testler, doğru kullanımda pestisit kalıntılarını %90'a varan oranlarda azalttığını göstermiştir."
      },
      {
        question: "CalFormat bebek mamaları için kullanılabilir mi?",
        answer: "CalFormat tamamen doğal içerikli olsa da, bebek mamaları için kullanmadan önce pediatrinize danışmanızı öneririz. Genel olarak, bebek gıdalarında kullanılacak meyve ve sebzelerin temizliğinde kullanılabilir, ancak ekstra durulama yapmaya özen göstermelisiniz."
      }
    ]
  },
  {
    category: "İade ve Değişim",
    questions: [
      {
        question: "İade koşullarınız nelerdir?",
        answer: "Satın aldığınız ürünleri, teslim tarihinden itibaren 14 gün içerisinde herhangi bir gerekçe göstermeksizin iade edebilirsiniz. İade etmek istediğiniz ürünlerin ambalajının açılmamış, bozulmamış ve ürünün kullanılmamış olması gerekmektedir."
      },
      {
        question: "Hasarlı ürün teslim aldım, ne yapmalıyım?",
        answer: "Kargo teslimatı sırasında ürünün hasarlı olduğunu fark ederseniz, kargo görevlisi yanındayken tutanak tutturmanız gerekmektedir. Eğer teslimattan sonra fark ettiyseniz, 24 saat içerisinde müşteri hizmetlerimizle iletişime geçmeniz durumunda ürün değişimi sağlanacaktır."
      },
      {
        question: "İade kargo ücretini kim karşılıyor?",
        answer: "Ürün bizim hatamızdan kaynaklı bir sorun (hasarlı, yanlış ürün vb.) nedeniyle iade ediliyorsa, kargo ücreti tarafımızca karşılanır. Ancak müşteri kaynaklı iadelerde (fikir değişikliği vb.), kargo ücreti müşteriye aittir."
      },
      {
        question: "İade ettiğim ürünün ücreti ne zaman hesabıma yansır?",
        answer: "İade ettiğiniz ürün depolarımıza ulaştıktan ve kontrolü yapıldıktan sonra, genellikle 3 iş günü içerisinde iade işlemi başlatılır. Kredi kartı ile yapılan alışverişlerde, bankanızın işlem sürecine bağlı olarak 7-20 iş günü içerisinde hesabınıza yansır."
      },
      {
        question: "Hediye olarak gönderilen ürünleri iade edebilir miyim?",
        answer: "Evet, hediye olarak gönderilen ürünler de standart iade politikamız kapsamındadır. Hediyeyi alan kişi, faturayı ibraz etmek koşuluyla ürünü 14 gün içerisinde iade edebilir. İade bedeli hediyeyi gönderen kişinin hesabına iade edilir."
      }
    ]
  },
  {
    category: "İletişim ve Destek",
    questions: [
      {
        question: "Müşteri hizmetlerine nasıl ulaşabilirim?",
        answer: "Müşteri hizmetlerimize +90 850 288 78 78 numaralı telefondan, info@uniqcal.com.tr e-posta adresinden veya web sitemizdeki canlı destek hattından ulaşabilirsiniz. Müşteri hizmetlerimiz hafta içi 09:00-18:00 saatleri arasında hizmet vermektedir."
      },
      {
        question: "Şikayet ve önerilerimi nasıl iletebilirim?",
        answer: "Şikayet ve önerilerinizi web sitemizdeki iletişim formundan, info@uniqcal.com.tr e-posta adresinden veya +90 850 288 78 78 numaralı telefondan iletebilirsiniz. Tüm şikayet ve önerileriniz bizim için değerlidir ve en kısa sürede değerlendirilecektir."
      },
      {
        question: "Toptan alım yapmak istiyorum, kimle iletişime geçebilirim?",
        answer: "Toptan alım talepleriniz için kurumsal@uniqcal.com.tr adresine e-posta gönderebilir veya +90 850 288 78 78 numaralı telefondan satış departmanımıza ulaşabilirsiniz. Size özel fiyat teklifleri için yetkililerimiz sizinle iletişime geçecektir."
      },
      {
        question: "Sosyal medya hesaplarınız var mı?",
        answer: "Evet, bizi Facebook, Instagram, Twitter ve YouTube platformlarında @uniqcal kullanıcı adıyla takip edebilirsiniz. Sosyal medya hesaplarımızdan güncel kampanyalar, ürün bilgileri ve sağlıklı yaşam önerileri paylaşmaktayız."
      }
    ]
  }
];

const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Tüm soruları düzleştir
  const allQuestions = faqData.flatMap(category => 
    category.questions.map(q => ({
      ...q,
      category: category.category
    }))
  );
  
  // Arama fonksiyonu
  const filteredQuestions = searchTerm 
    ? allQuestions.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Soru-cevap toggle fonksiyonu
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Kategori seçme fonksiyonu
  const handleCategoryClick = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
    setSearchTerm('');
  };

  // Her kategori için benzersiz bir id oluşturma
  const createQuestionId = (categoryIndex: number, questionIndex: number, question: string) => {
    return `faq-${categoryIndex}-${questionIndex}-${question.slice(0, 10).replace(/\s+/g, '-').toLowerCase()}`;
  };

  // SSS için JSON-LD yapılandırılmış veri
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.flatMap(category => 
      category.questions.map(q => ({
        "@type": "Question",
        "name": q.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.answer
        }
      }))
    )
  };

  return (
    <>
      <SEO 
        title="Sık Sorulan Sorular" 
        description="CalFormat ürünleri ve hizmetleri hakkında sık sorulan sorular ve yanıtları."
        keywords="CalFormat faq, sık sorulan sorular, yardım, destek"
        structuredData={faqStructuredData}
        canonicalUrl="https://www.calformat.com.tr/faq"
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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Sık Sorulan Sorular</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Ürünlerimiz ve hizmetlerimiz hakkında merak ettiklerinizi bu sayfada bulabilirsiniz.
              Aradığınız cevabı bulamazsanız, bizimle iletişime geçmekten çekinmeyin.
            </p>
          </div>

          {/* Arama kutusu */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Sorunuzu arayın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ee7f1a] focus:border-[#ee7f1a] transition-colors"
              />
            </div>
            
            {/* Arama sonuçları */}
            {searchTerm && (
              <div className="mt-6">
                <h2 className="font-medium text-lg text-gray-700 mb-4">
                  "{searchTerm}" için arama sonuçları ({filteredQuestions.length})
                </h2>
                
                {filteredQuestions.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                    <p className="text-gray-600">Aramanızla eşleşen bir sonuç bulunamadı.</p>
                    <p className="text-gray-600 mt-2">
                      Farklı anahtar kelimeler deneyebilir veya{' '}
                      <Link to="/contact" className="text-[#ee7f1a] font-medium hover:text-[#d62d27] hover:underline">
                        bizimle iletişime geçebilirsiniz
                      </Link>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q, index) => {
                      const questionId = `search-result-${index}`;
                      return (
                        <div key={questionId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            className="w-full text-left px-6 py-4 flex justify-between items-start"
                            onClick={() => toggleQuestion(questionId)}
                            aria-expanded={expandedQuestions[questionId] ? "true" : "false"}
                          >
                            <div>
                              <h3 className="font-medium text-gray-900">{q.question}</h3>
                              <p className="text-sm text-[#ee7f1a] mt-1">{q.category}</p>
                            </div>
                            {expandedQuestions[questionId] ? 
                              <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" /> : 
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                            }
                          </button>
                          
                          {expandedQuestions[questionId] && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                              <p className="text-gray-700">{q.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kategoriler ve sorular */}
          {!searchTerm && (
            <div className="grid md:grid-cols-12 gap-8">
              {/* Kategori menüsü */}
              <div className="md:col-span-3">
                <div className="sticky top-6">
                  <h2 className="text-xl font-bold mb-4">Kategoriler</h2>
                  <ul className="space-y-2">
                    {faqData.map((category, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleCategoryClick(category.category)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeCategory === category.category
                              ? "bg-[#ee7f1a] text-white font-medium"
                              : "bg-white hover:bg-orange-50 text-gray-700"
                          }`}
                        >
                          {category.category}
                          <span className="ml-2 text-sm">
                            ({category.questions.length})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white">
                    <h3 className="font-semibold mb-2">Hala sorunuz mu var?</h3>
                    <p className="text-sm mb-4 text-white">
                      Aradığınız cevabı bulamadıysanız, müşteri temsilcilerimiz size yardımcı olmaktan mutluluk duyacaktır.
                    </p>
                    <Link 
                      to="/contact" 
                      className="block w-full text-center bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Bizimle İletişime Geçin
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Sağ taraftaki soru-cevap alanı */}
              <div className="md:col-span-9">
                {activeCategory ? (
                  // Seçilen kategori soruları
                  <div>
                    <h2 className="text-2xl font-bold mb-6">{activeCategory}</h2>
                    <div className="space-y-4">
                      {faqData
                        .find(category => category.category === activeCategory)
                        ?.questions.map((q, qIndex) => {
                          const categoryIndex = faqData.findIndex(c => c.category === activeCategory);
                          const questionId = createQuestionId(categoryIndex, qIndex, q.question);
                          return (
                            <div key={questionId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                              <button
                                className="w-full text-left px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleQuestion(questionId)}
                                aria-expanded={expandedQuestions[questionId] ? "true" : "false"}
                              >
                                <h3 className="font-medium text-gray-900">{q.question}</h3>
                                {expandedQuestions[questionId] ? 
                                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" /> : 
                                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                }
                              </button>
                              
                              {expandedQuestions[questionId] && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                  <p className="text-gray-700">{q.answer}</p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                ) : (
                  // Kategori seçilmediğinde tüm kategorileri göster
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Tüm Kategoriler</h2>
                    <div className="space-y-12">
                      {faqData.map((category, categoryIndex) => (
                        <div key={categoryIndex}>
                          <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
                            {category.category}
                          </h3>
                          <div className="space-y-4">
                            {category.questions.slice(0, 3).map((q, qIndex) => {
                              const questionId = createQuestionId(categoryIndex, qIndex, q.question);
                              return (
                                <div key={questionId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                  <button
                                    className="w-full text-left px-6 py-4 flex justify-between items-center"
                                    onClick={() => toggleQuestion(questionId)}
                                    aria-expanded={expandedQuestions[questionId] ? "true" : "false"}
                                  >
                                    <h4 className="font-medium text-gray-900">{q.question}</h4>
                                    {expandedQuestions[questionId] ? 
                                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" /> : 
                                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                    }
                                  </button>
                                  
                                  {expandedQuestions[questionId] && (
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                      <p className="text-gray-700">{q.answer}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {category.questions.length > 3 && (
                              <div className="mt-4 text-center">
                                <button
                                  onClick={() => handleCategoryClick(category.category)}
                                  className="inline-flex items-center text-[#ee7f1a] font-medium hover:text-[#d62d27]"
                                >
                                  {category.category} kategorisinin tüm sorularını görüntüle
                                  <ChevronDown className="w-4 h-4 ml-1" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* İletişim CTA */}
          <div className="mt-16 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] rounded-3xl overflow-hidden shadow-xl">
            <div className="max-w-4xl mx-auto px-8 py-12 text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Hâlâ sorularınız mı var?</h2>
              <p className="text-lg mb-8 opacity-90">
                Müşteri hizmetleri ekibimiz tüm sorularınıza yanıt vermek için hazır.
                Dilediğiniz iletişim kanalından bize ulaşabilirsiniz.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/contact" 
                  className="bg-white text-[#d62d27] font-medium px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  İletişim Formu
                </Link>
                <a 
                  href="tel:+908502887878" 
                  className="bg-transparent border border-white text-white font-medium px-6 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  +90 850 288 78 78
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;