import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DistanceSalesAgreement: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-[#ee7f1a] font-medium hover:text-[#d62d27] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Ana Sayfaya Dön
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="px-8 py-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
            <h1 className="text-3xl font-bold text-gray-900">MESAFELİ SATIŞ SÖZLEŞMESİ</h1>
            <p className="text-gray-600 mt-2">Son Güncelleme: 12 Haziran 2025</p>
          </div>
          
          <div className="p-8">
            <div className="prose max-w-none text-gray-700">
              <h2 className="text-2xl font-bold mt-4 mb-4">1. TARAFLAR</h2>
              <p>
                İşbu Sözleşme aşağıdaki taraflar arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde imzalanmıştır.
              </p>
              <p>
                <strong>A. 'ALICI';</strong> (sözleşmede bundan sonra "ALICI" olarak anılacaktır)<br />
                AD- SOYAD:<br />
                ADRES:
              </p>
              <p>
                <strong>B. 'SATICI';</strong> (sözleşmede bundan sonra "SATICI" olarak anılacaktır)<br />
                AD- SOYAD: Uniqcal İletişim Hizmetleri<br />
                ADRES: Fatih Sultan Mehmet Cad, Kavacık, Şht. Teğmen Ali Yılmaz Sk. No:14, Kat:3, 34810 Beykoz/İstanbul
              </p>
              <p>
                İş bu sözleşmeyi kabul etmekle ALICI, sözleşme konusu siparişi onayladığı takdirde sipariş konusu bedeli ve varsa kargo ücreti, vergi gibi belirtilen ek ücretleri ödeme yükümlülüğü altına gireceğini ve bu konuda bilgilendirildiğini peşinen kabul eder.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">2. TANIMLAR</h2>
              <p>
                İşbu sözleşmenin uygulanmasında ve yorumlanmasında aşağıda yazılı terimler karşılarındaki yazılı açıklamaları ifade edeceklerdir.
              </p>
              <p>
                <strong>BAKAN:</strong> Gümrük ve Ticaret Bakanı'nı,<br />
                <strong>BAKANLIK:</strong> Gümrük ve Ticaret Bakanlığı'nı,<br />
                <strong>KANUN:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun'u,<br />
                <strong>YÖNETMELİK:</strong> Mesafeli Sözleşmeler Yönetmeliği'ni (RG:27.11.2014/29188)<br />
                <strong>HİZMET:</strong> Bir ücret veya menfaat karşılığında yapılan ya da yapılması taahhüt edilen mal sağlama dışındaki her türlü tüketici işleminin konusunu,<br />
                <strong>SATICI:</strong> Ticari veya mesleki faaliyetleri kapsamında tüketiciye mal sunan veya mal sunan adına veya hesabına hareket eden şirketi,<br />
                <strong>ALICI:</strong> Bir mal veya hizmeti ticari veya mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek ya da tüzel kişiyi,<br />
                <strong>SİTE:</strong> SATICI'ya ait internet sitesini,<br />
                <strong>SİPARİŞ VEREN:</strong> Bir mal veya hizmeti SATICI'ya ait internet sitesi üzerinden talep eden gerçek ya da tüzel kişiyi,<br />
                <strong>TARAFLAR:</strong> SATICI ve ALICI'yı,<br />
                <strong>SÖZLEŞME:</strong> SATICI ve ALICI arasında akdedilen işbu sözleşmeyi,<br />
                <strong>MAL:</strong> Alışverişe konu olan taşınır eşyayı ve elektronik ortamda kullanılmak üzere hazırlanan yazılım, ses, görüntü ve benzeri gayri maddi malları ifade eder.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">3. KONU</h2>
              <p>
                İşbu Sözleşme, ALICI'nın, SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
              </p>
              <p>
                Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">4. SATICI BİLGİLERİ</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <p><strong>Ünvanı:</strong> Uniqcal İletişim Hizmetleri</p>
                <p><strong>Adres:</strong> Fatih Sultan Mehmet Cad, Kavacık, Şht. Teğmen Ali Yılmaz Sk. No:14, Kat:3, 34810 Beykoz/İstanbul</p>
                <p><strong>Telefon:</strong> +90850 288 78 78</p>
                <p><strong>Eposta:</strong> info@uniqcal.com.tr</p>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4">5. ALICI BİLGİLERİ</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <p><strong>Teslim edilecek kişi:</strong> </p>
                <p><strong>Teslimat Adresi:</strong> </p>
                <p><strong>Telefon:</strong> </p>
                <p><strong>Eposta/kullanıcı adı:</strong> </p>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4">6. SİPARİŞ VEREN KİŞİ BİLGİLERİ</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <p><strong>Ad/Soyad/Unvan:</strong> </p>
                <p><strong>Adres:</strong> </p>
                <p><strong>Telefon:</strong> </p>
                <p><strong>Eposta/kullanıcı adı:</strong> </p>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4">7. SÖZLEŞME KONUSU ÜRÜN/ÜRÜNLER BİLGİLERİ</h2>
              <p>
                7.1. Malın /Ürün/Ürünlerin/ Hizmetin temel özelliklerini (türü, miktarı, marka/modeli, rengi, adedi) SATICI'ya ait internet sitesinde yayınlanmaktadır. Satıcı tarafından kampanya düzenlenmiş ise ilgili ürünün temel özelliklerini kampanya süresince inceleyebilirsiniz. Kampanya tarihine kadar geçerlidir.
              </p>
              <p>
                7.2. Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
              </p>
              <p>
                7.3. Sözleşme konusu mal ya da hizmetin tüm vergiler dâhil satış fiyatı aşağıda gösterilmiştir.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 py-2 px-4 text-left">Ürün Açıklaması</th>
                      <th className="border border-gray-300 py-2 px-4 text-left">Adet</th>
                      <th className="border border-gray-300 py-2 px-4 text-left">Birim Fiyatı</th>
                      <th className="border border-gray-300 py-2 px-4 text-left">Ara Toplam (KDV Dahil)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 py-2 px-4"></td>
                      <td className="border border-gray-300 py-2 px-4"></td>
                      <td className="border border-gray-300 py-2 px-4"></td>
                      <td className="border border-gray-300 py-2 px-4"></td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border border-gray-300 py-2 px-4 font-bold text-right">Kargo Tutarı:</td>
                      <td colSpan={2} className="border border-gray-300 py-2 px-4"></td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border border-gray-300 py-2 px-4 font-bold text-right">Toplam:</td>
                      <td colSpan={2} className="border border-gray-300 py-2 px-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6 mb-4">
                <p><strong>Ödeme Şekli ve Planı:</strong></p>
                <p><strong>Teslimat Adresi:</strong></p>
                <p><strong>Teslim Edilecek kişi:</strong></p>
                <p><strong>Fatura Adresi:</strong></p>
                <p><strong>Sipariş Tarihi:</strong></p>
                <p><strong>Teslimat tarihi:</strong></p>
                <p><strong>Teslim şekli:</strong></p>
              </div>

              <p>
                7.4. Ürün sevkiyat masrafı olan kargo ücreti ALICI tarafından ödenecektir.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">8. FATURA BİLGİLERİ</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <p><strong>Ad/Soyad/Unvan:</strong></p>
                <p><strong>Adres:</strong></p>
                <p><strong>Telefon:</strong></p>
                <p><strong>Eposta/kullanıcı adı:</strong></p>
                <p><strong>Fatura teslim:</strong>Fatura sipariş teslimatı sırasında fatura adresine sipariş ile birlikte teslim edilecektir.</p>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4">9. GENEL HÜKÜMLER</h2>
              <p>
                9.1. ALICI, SATICI'ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup, bilgi sahibi olduğunu, elektronik ortamda gerekli teyidi verdiğini kabul, beyan ve taahhüt eder. ALICI'nın; Ön Bilgilendirmeyi elektronik ortamda teyit etmesi, mesafeli satış sözleşmesinin kurulmasından evvel, SATICI tarafından ALICI' ya verilmesi gereken adresi, siparişi verilen ürünlere ait temel özellikleri, ürünlerin vergiler dâhil fiyatını, ödeme ve teslimat bilgilerini de doğru ve eksiksiz olarak edindiğini kabul, beyan ve taahhüt eder.
              </p>
              <p>
                9.2. Sözleşme konusu her bir ürün, 30 günlük yasal süreyi aşmamak kaydı ile ALICI' nın yerleşim yeri uzaklığına bağlı olarak internet sitesindeki ön bilgiler kısmında belirtilen süre zarfında ALICI veya ALICI'nın gösterdiği adresteki kişi ve/veya kuruluşa teslim edilir. Bu süre içinde ürünün ALICI'ya teslim edilememesi durumunda, ALICI'nın sözleşmeyi feshetme hakkı saklıdır.
              </p>
              <p>
                9.3. SATICI, Sözleşme konusu ürünü eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri, kullanım kılavuzları işin gereği olan bilgi ve belgeler ile teslim etmeyi, her türlü ayıptan arî olarak yasal mevzuat gereklerine göre sağlam, standartlara uygun bir şekilde işi doğruluk ve dürüstlük esasları dâhilinde ifa etmeyi, hizmet kalitesini koruyup yükseltmeyi, işin ifası sırasında gerekli dikkat ve özeni göstermeyi, ihtiyat ve öngörü ile hareket etmeyi kabul, beyan ve taahhüt eder.
              </p>
              <p>
                9.4. SATICI, sözleşmeden doğan ifa yükümlülüğünün süresi dolmadan ALICI'yı bilgilendirmek ve açıkça onayını almak suretiyle eşit kalite ve fiyatta farklı bir ürün tedarik edebilir.
              </p>
              <p>
                9.5. SATICI, sipariş konusu ürün veya hizmetin yerine getirilmesinin imkânsızlaşması halinde sözleşme konusu yükümlülüklerini yerine getiremezse, bu durumu, öğrendiği tarihten itibaren 3 gün içinde yazılı olarak tüketiciye bildireceğini, 14 günlük süre içinde toplam bedeli ALICI'ya iade edeceğini kabul, beyan ve taahhüt eder.
              </p>
              <p>
                9.6. ALICI, Sözleşme konusu ürünün teslimatı için işbu Sözleşme'yi elektronik ortamda teyit edeceğini, herhangi bir nedenle sözleşme konusu ürün bedelinin ödenmemesi ve/veya banka kayıtlarında iptal edilmesi halinde, SATICI'nın sözleşme konusu ürünü teslim yükümlülüğünün sona ereceğini kabul, beyan ve taahhüt eder.
              </p>
              <p>
                9.7. ALICI, Sözleşme konusu ürünün ALICI veya ALICI'nın gösterdiği adresteki kişi ve/veya kuruluşa tesliminden sonra ALICI'ya ait kredi kartının yetkisiz kişilerce haksız kullanılması sonucunda sözleşme konusu ürün bedelinin ilgili banka veya finans kuruluşu tarafından SATICI'ya ödenmemesi halinde, ALICI Sözleşme konusu ürünü 3 gün içerisinde nakliye gideri SATICI'ya ait olacak şekilde SATICI'ya iade edeceğini kabul, beyan ve taahhüt eder.
              </p>
              <p>
                9.8. SATICI, tarafların iradesi dışında gelişen, önceden öngörülemeyen ve tarafların borçlarını yerine getirmesini engelleyici ve/veya geciktirici hallerin oluşması gibi mücbir sebepler halleri nedeni ile sözleşme konusu ürünü süresi içinde teslim edemez ise, durumu ALICI'ya bildireceğini kabul, beyan ve taahhüt eder. ALICI da siparişin iptal edilmesini, sözleşme konusu ürünün varsa emsali ile değiştirilmesini ve/veya teslimat süresinin engelleyici durumun ortadan kalkmasına kadar ertelenmesini SATICI'dan talep etme hakkını haizdir. ALICI tarafından siparişin iptal edilmesi halinde ALICI'nın nakit ile yaptığı ödemelerde, ürün tutarı 14 gün içinde kendisine nakden ve defaten ödenir. ALICI'nın kredi kartı ile yaptığı ödemelerde ise, ürün tutarı, siparişin ALICI tarafından iptal edilmesinden sonra 14 gün içerisinde ilgili bankaya iade edilir. ALICI, SATICI tarafından kredi kartına iade edilen tutarın banka tarafından ALICI hesabına yansıtılmasına ilişkin ortalama sürecin 2 ile 3 haftayı bulabileceğini, bu tutarın bankaya iadesinden sonra ALICI'nın hesaplarına yansıması halinin tamamen banka işlem süreci ile ilgili olduğundan, ALICI, olası gecikmeler için SATICI'yı sorumlu tutamayacağını kabul, beyan ve taahhüt eder.
              </p>
              <p>
                9.9. SATICININ, ALICI tarafından siteye kayıt formunda belirtilen veya daha sonra kendisi tarafından güncellenen adresi, e-posta adresi, sabit ve mobil telefon hatları ve diğer iletişim bilgileri üzerinden mektup, e-posta, SMS, telefon görüşmesi ve diğer yollarla iletişim, pazarlama, bildirim ve diğer amaçlarla ALICI'ya ulaşma hakkı bulunmaktadır. ALICI, işbu sözleşmeyi kabul etmekle SATICI'nın kendisine yönelik yukarıda belirtilen iletişim faaliyetlerinde bulunabileceğini kabul ve beyan etmektedir.
              </p>
              <p>
                9.10. ALICI, sözleşme konusu mal/hizmeti teslim almadan önce muayene edecek; ezik, kırık, ambalajı yırtılmış vb. hasarlı ve ayıplı mal/hizmeti kargo şirketinden teslim almayacaktır. Teslim alınan mal/hizmetin hasarsız ve sağlam olduğu kabul edilecektir. Teslimden sonra mal/hizmetin özenle korunması borcu, ALICI'ya aittir. Cayma hakkı kullanılacaksa mal/hizmet kullanılmamalıdır. Fatura iade edilmelidir.
              </p>
              <p>
                9.11. ALICI ile sipariş esnasında kullanılan kredi kartı hamilinin aynı kişi olmaması veya ürünün ALICI'ya tesliminden evvel, siparişte kullanılan kredi kartına ilişkin güvenlik açığı tespit edilmesi halinde, SATICI, kredi kartı hamiline ilişkin kimlik ve iletişim bilgilerini, siparişte kullanılan kredi kartının bir önceki aya ait ekstresini yahut kart hamilinin bankasından kredi kartının kendisine ait olduğuna ilişkin yazıyı ibraz etmesini ALICI'dan talep edebilir. ALICI'nın talebe konu bilgi/belgeleri temin etmesine kadar geçecek sürede sipariş dondurulacak olup, mezkur taleplerin 24 saat içerisinde karşılanmaması halinde ise SATICI, siparişi iptal etme hakkını haizdir.
              </p>
              <p>
                9.12. ALICI, SATICI'ya ait internet sitesine üye olurken verdiği kişisel ve diğer sair bilgilerin gerçeğe uygun olduğunu, SATICI'nın bu bilgilerin gerçeğe aykırılığı nedeniyle uğrayacağı tüm zararları, SATICI'nın ilk bildirimi üzerine derhal, nakden ve defaten tazmin edeceğini beyan ve taahhüt eder.
              </p>
              <p>
                9.13. ALICI, SATICI'ya ait internet sitesini kullanırken yasal mevzuat hükümlerine riayet etmeyi ve bunları ihlal etmemeyi baştan kabul ve taahhüt eder. Aksi takdirde, doğacak tüm hukuki ve cezai yükümlülükler tamamen ve münhasıran ALICI'yı bağlayacaktır.
              </p>
              <p>
                9.14. ALICI, SATICI'ya ait internet sitesini hiçbir şekilde kamu düzenini bozucu, genel ahlaka aykırı, başkalarını rahatsız ve taciz edici şekilde, yasalara aykırı bir amaç için, başkalarının maddi ve manevi haklarına tecavüz edecek şekilde kullanamaz. Ayrıca, üye başkalarının hizmetleri kullanmasını önleyici veya zorlaştırıcı faaliyet (spam, virus, truva atı, vb.) işlemlerde bulunamaz.
              </p>
              <p>
                9.15. SATICI'ya ait internet sitesinin üzerinden, SATICI'nın kendi kontrolünde olmayan ve/veya başkaca üçüncü kişilerin sahip olduğu ve/veya işlettiği başka web sitelerine ve/veya başka içeriklere link verilebilir. Bu linkler ALICI'ya yönlenme kolaylığı sağlamak amacıyla konmuş olup herhangi bir web sitesini veya o siteyi işleten kişiyi desteklememekte ve Link verilen web sitesinin içerdiği bilgilere yönelik herhangi bir garanti niteliği taşımamaktadır.
              </p>
              <p>
                9.16. İşbu sözleşme içerisinde sayılan maddelerden bir ya da birkaçını ihlal eden üye işbu ihlal nedeniyle cezai ve hukuki olarak şahsen sorumlu olup, SATICI'yı bu ihlallerin hukuki ve cezai sonuçlarından ari tutacaktır. Ayrıca; işbu ihlal nedeniyle, olayın hukuk alanına intikal ettirilmesi halinde, SATICI'nın üyeye karşı üyelik sözleşmesine uyulmamasından dolayı tazminat talebinde bulunma hakkı saklıdır.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">10. CAYMA HAKKI</h2>
              <p>
                10.1. ALICI; mesafeli sözleşmenin mal satışına ilişkin olması durumunda, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (on dört) gün içerisinde, SATICI'ya bildirmek şartıyla hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkını kullanabilir. Hizmet sunumuna ilişkin mesafeli sözleşmelerde ise, bu süre sözleşmenin imzalandığı tarihten itibaren başlar. Cayma hakkı süresi sona ermeden önce, tüketicinin onayı ile hizmetin ifasına başlanan hizmet sözleşmelerinde cayma hakkı kullanılamaz. Cayma hakkının kullanımından kaynaklanan masraflar SATICI' ya aittir. ALICI, iş bu sözleşmeyi kabul etmekle, cayma hakkı konusunda bilgilendirildiğini peşinen kabul eder.
              </p>
              <p>
                10.2. Cayma hakkının kullanılması için 14 (ondört) günlük süre içinde SATICI' ya iadeli taahhütlü posta, faks veya eposta ile yazılı bildirimde bulunulması ve ürünün işbu sözleşmede düzenlenen "Cayma Hakkı Kullanılamayacak Ürünler" hükümleri çerçevesinde kullanılmamış olması şarttır. Bu hakkın kullanılması halinde,
              </p>
              <ol className="list-alpha">
                <li>
                  3. kişiye veya ALICI' ya teslim edilen ürünün faturası, (İade edilmek istenen ürünün faturası kurumsal ise, iade ederken kurumun düzenlemiş olduğu iade faturası ile birlikte gönderilmesi gerekmektedir. Faturası kurumlar adına düzenlenen sipariş iadeleri İADE FATURASI kesilmediği takdirde tamamlanamayacaktır.)
                </li>
                <li>
                  İade formu,
                </li>
                <li>
                  İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.
                </li>
                <li>
                  SATICI, cayma bildiriminin kendisine ulaşmasından itibaren en geç 10 günlük süre içerisinde toplam bedeli ve ALICI'yı borç altına sokan belgeleri ALICI' ya iade etmek ve 20 günlük süre içerisinde malı iade almakla yükümlüdür.
                </li>
                <li>
                  ALICI' nın kusurundan kaynaklanan bir nedenle malın değerinde bir azalma olursa veya iade imkânsızlaşırsa ALICI kusuru oranında SATICI' nın zararlarını tazmin etmekle yükümlüdür. Ancak cayma hakkı süresi içinde malın veya ürünün usulüne uygun kullanılması sebebiyle meydana gelen değişiklik ve bozulmalardan ALICI sorumlu değildir.
                </li>
                <li>
                  Cayma hakkının kullanılması nedeniyle SATICI tarafından düzenlenen kampanya limit tutarının altına düşülmesi halinde kampanya kapsamında faydalanılan indirim miktarı iptal edilir.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">11. CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER</h2>
              <p>
                ALICI'nın isteği veya açıkça kişisel ihtiyaçları doğrultusunda hazırlanan ve geri gönderilmeye müsait olmayan, iç giyim alt parçaları, mayo ve bikini altları, makyaj malzemeleri, tek kullanımlık ürünler, çabuk bozulma tehlikesi olan veya son kullanma tarihi geçme ihtimali olan mallar, ALICI'ya teslim edilmesinin ardından ALICI tarafından ambalajı açıldığı takdirde iade edilmesi sağlık ve hijyen açısından uygun olmayan ürünler, teslim edildikten sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler, Abonelik sözleşmesi kapsamında sağlananlar dışında, gazete ve dergi gibi süreli yayınlara ilişkin mallar, Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallar, ile ses veya görüntü kayıtlarının, kitap, dijital içerik, yazılım programlarının, veri kaydedebilme ve veri depolama cihazlarının, bilgisayar sarf malzemelerinin, ambalajının ALICI tarafından açılmış olması halinde iadesi Yönetmelik gereği mümkün değildir. Ayrıca Cayma hakkı süresi sona ermeden önce, tüketicinin onayı ile ifasına başlanan hizmetlere ilişkin cayma hakkının kullanılması da Yönetmelik gereği mümkün değildir.
              </p>
              <p>
                Kozmetik ve kişisel bakım ürünleri, iç giyim ürünleri, mayo, bikini, kitap, kopyalanabilir yazılım ve programlar, DVD, VCD, CD ve kasetler ile kırtasiye sarf malzemeleri (toner, kartuş, şerit vb.) iade edilebilmesi için ambalajlarının açılmamış, denenmemiş, bozulmamış ve kullanılmamış olmaları gerekir.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">12. TEMERRÜT HALİ VE HUKUKİ SONUÇLARI</h2>
              <p>
                ALICI, ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düştüğü takdirde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını kabul, beyan ve taahhüt eder. Bu durumda ilgili banka hukuki yollara başvurabilir; doğacak masrafları ve vekâlet ücretini ALICI'dan talep edebilir ve her koşulda ALICI'nın borcundan dolayı temerrüde düşmesi halinde, ALICI, borcun gecikmeli ifasından dolayı SATICI'nın uğradığı zarar ve ziyanını ödeyeceğini kabul, beyan ve taahhüt eder.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">13. YETKİLİ MAHKEME</h2>
              <p>
                İşbu sözleşmeden doğan uyuşmazlıklarda şikayet ve itirazlar, aşağıdaki kanunda belirtilen parasal sınırlar dâhilinde tüketicinin yerleşim yerinin bulunduğu veya tüketici işleminin yapıldığı yerdeki tüketici sorunları hakem heyetine veya tüketici mahkemesine yapılacaktır. Parasal sınıra ilişkin bilgiler aşağıdadır:
              </p>
              <p>
                28/05/2014 tarihinden itibaren geçerli olmak üzere:
              </p>
              <ol className="list-alpha">
                <li>
                  6502 sayılı Tüketicinin Korunması Hakkında Kanun'un 68. Maddesi gereği değeri 2.000,00 (ikibin) TL'nin altında olan uyuşmazlıklarda ilçe tüketici hakem heyetlerine,
                </li>
                <li>
                  Değeri 3.000,00(üçbin)TL' nin altında bulunan uyuşmazlıklarda il tüketici hakem heyetlerine,
                </li>
                <li>
                  Büyükşehir statüsünde bulunan illerde ise değeri 2.000,00 (ikibin) TL ile 3.000,00(üçbin)TL' arasındaki uyuşmazlıklarda il tüketici hakem heyetlerine başvuru yapılmaktadır.
                </li>
              </ol>
              <p>
                İşbu Sözleşme ticari amaçlarla yapılmaktadır.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4">14. YÜRÜRLÜK</h2>
              <p>
                ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş sayılır. SATICI, siparişin gerçekleşmesi öncesinde işbu sözleşmenin sitede ALICI tarafından okunup kabul edildiğine dair onay alacak şekilde gerekli yazılımsal düzenlemeleri yapmakla yükümlüdür.
              </p>

              <div className="flex flex-col md:flex-row justify-between mt-10 pt-6 border-t border-gray-200">
                <div className="mb-4 md:mb-0">
                  <p><strong>SATICI:</strong> Uniqcal İletişim Hizmetleri</p>
                </div>
                <div>
                  <p><strong>ALICI:</strong></p>
                  <p className="mt-4"><strong>TARİH:</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistanceSalesAgreement;