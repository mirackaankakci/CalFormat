import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, ShoppingBag, Truck, AlertCircle } from 'lucide-react';

const RefundPolicy: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-gray-900">TÜKETİCİ HAKLARI – CAYMA – İPTAL İADE KOŞULLARI</h1>
            <p className="text-gray-600 mt-2">Son Güncelleme: 12 Haziran 2025</p>
          </div>
          
          <div className="p-8">
            <div className="prose max-w-none text-gray-700">
              <h2 className="text-2xl font-bold mt-4 mb-4">GENEL:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Kullanmakta olduğunuz web sitesi üzerinden elektronik ortamda sipariş verdiğiniz takdirde, 
                  size sunulan ön bilgilendirme formunu ve mesafeli satış sözleşmesini kabul etmiş sayılırsınız.
                </li>
                <li>
                  Alıcılar, satın aldıkları ürünün satış ve teslimi ile ilgili olarak 6502 sayılı 
                  Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği (RG:27.11.2014/29188) 
                  hükümleri ile yürürlükteki diğer yasalara tabidir.
                </li>
                <li>
                  Ürün sevkiyat masrafı olan kargo ücretleri alıcılar tarafından ödenecektir.
                </li>
                <li>
                  Satın alınan her bir ürün, 30 günlük yasal süreyi aşmamak kaydı ile alıcının gösterdiği 
                  adresteki kişi ve/veya kuruluşa teslim edilir. Bu süre içinde ürün teslim edilmez ise, 
                  Alıcılar sözleşmeyi sona erdirebilir.
                </li>
                <li>
                  Satın alınan ürün, eksiksiz ve siparişte belirtilen niteliklere uygun ve varsa garanti 
                  belgesi, kullanım klavuzu gibi belgelerle teslim edilmek zorundadır.
                </li>
                <li>
                  Satın alınan ürünün satılmasının imkansızlaşması durumunda, satıcı bu durumu öğrendiğinden 
                  itibaren 3 gün içinde yazılı olarak alıcıya bu durumu bildirmek zorundadır. 14 gün 
                  içinde de toplam bedel Alıcı'ya iade edilmek zorundadır.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">SATIN ALINAN ÜRÜN BEDELİ ÖDENMEZ İSE:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Alıcı, satın aldığı ürün bedelini ödemez veya banka kayıtlarında iptal ederse, 
                  Satıcının ürünü teslim yükümlülüğü sona erer.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">KREDİ KARTININ YETKİSİZ KULLANIMI İLE YAPILAN ALIŞVERİŞLER:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Ürün teslim edildikten sonra, alıcının ödeme yaptığı kredi kartının yetkisiz kişiler 
                  tarafından haksız olarak kullanıldığı tespit edilirse ve satılan ürün bedeli ilgili 
                  banka veya finans kuruluşu tarafından Satıcı'ya ödenmez ise, Alıcı, sözleşme 
                  konusu ürünü 3 gün içerisinde nakliye gideri SATICI'ya ait olacak şekilde SATICI'ya 
                  iade etmek zorundadır.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">ÖNGÖRÜLEMEYEN SEBEPLERLE ÜRÜN SÜRESİNDE TESLİM EDİLEMEZ İSE:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Satıcı'nın öngöremeyeceği mücbir sebepler oluşursa ve ürün süresinde teslim 
                  edilemez ise, durum Alıcı'ya bildirilir. Alıcı, siparişin iptalini, ürünün 
                  benzeri ile değiştirilmesini veya engel ortadan kalkana dek teslimatın 
                  ertelenmesini talep edebilir. Alıcı siparişi iptal ederse; ödemeyi nakit 
                  ile yapmış ise iptalinden itibaren 14 gün içinde kendisine nakden bu ücret 
                  ödenir. Alıcı, ödemeyi kredi kartı ile yapmış ise ve iptal ederse, bu 
                  iptalden itibaren yine 14 gün içinde ürün bedeli bankaya iade edilir, 
                  ancak bankanın alıcının hesabına 2-3 hafta içerisinde aktarması olasıdır.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">ALICININ ÜRÜNÜ KONTROL ETME YÜKÜMLÜLÜĞÜ:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Alıcı, sözleşme konusu mal/hizmeti teslim almadan önce muayene edecek; ezik, 
                  kırık, ambalajı yırtılmış vb. hasarlı ve ayıplı mal/hizmeti kargo şirketinden 
                  teslim almayacaktır. Teslim alınan mal/hizmetin hasarsız ve sağlam olduğu 
                  kabul edilecektir. ALICI, Teslimden sonra mal/hizmeti özenle korunmak zorundadır. 
                  Cayma hakkı kullanılacaksa mal/hizmet kullanılmamalıdır. Ürünle birlikte 
                  Fatura da iade edilmelidir.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">CAYMA HAKKI:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  ALICI; satın aldığı ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa 
                  teslim tarihinden itibaren 14 (on dört) gün içerisinde, SATICI'ya aşağıdaki 
                  iletişim bilgileri üzerinden bildirmek şartıyla hiçbir hukuki ve cezai sorumluluk 
                  üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden 
                  cayma hakkını kullanabilir.
                </li>
              </ol>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold">SATICININ CAYMA HAKKI BİLDİRİMİ YAPILACAK İLETİŞİM BİLGİLERİ:</h3>
                <p><strong>ŞİRKET ADI/UNVANI:</strong> Uniqcal İletişim Hizmetleri</p>
                <p><strong>ADRES:</strong> Fatih Sultan Mehmet Cad, Kavacık, Şht. Teğmen Ali Yılmaz Sk. No:14, Kat:3, 34810 Beykoz/İstanbul</p>
                <p><strong>EPOSTA:</strong> info@uniqcal.com.tr</p>
                <p><strong>TEL:</strong> +90850 288 78 78</p>
              </div>

              <h2 className="text-2xl font-bold mt-8 mb-4">CAYMA HAKKININ SÜRESİ:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Alıcı, satın aldığı eğer bir hizmet ise, bu 14 günlük süre sözleşmenin 
                  imzalandığı tarihten itibaren başlar. Cayma hakkı süresi sona ermeden 
                  önce, tüketicinin onayı ile hizmetin ifasına başlanan hizmet 
                  sözleşmelerinde cayma hakkı kullanılamaz.
                </li>
                <li>
                  Cayma hakkının kullanımından kaynaklanan masraflar SATICI' ya aittir.
                </li>
                <li>
                  Cayma hakkının kullanılması için 14 (ondört) günlük süre içinde SATICI' ya 
                  iadeli taahhütlü posta, faks veya eposta ile yazılı bildirimde bulunulması 
                  ve ürünün işbu sözleşmede düzenlenen "Cayma Hakkı Kullanılamayacak Ürünler" 
                  hükümleri çerçevesinde kullanılmamış olması şarttır.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">CAYMA HAKKININ KULLANIMI:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  3. kişiye veya ALICI' ya teslim edilen ürünün faturası, (İade edilmek istenen 
                  ürünün faturası kurumsal ise, iade ederken kurumun düzenlemiş olduğu iade 
                  faturası ile birlikte gönderilmesi gerekmektedir. Faturası kurumlar adına 
                  düzenlenen sipariş iadeleri İADE FATURASI kesilmediği takdirde tamamlanamayacaktır.)
                </li>
                <li>
                  İade formu, İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları 
                  ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">İADE KOŞULLARI:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  SATICI, cayma bildiriminin kendisine ulaşmasından itibaren en geç 10 günlük 
                  süre içerisinde toplam bedeli ve ALICI'yı borç altına sokan belgeleri ALICI' ya 
                  iade etmek ve 20 günlük süre içerisinde malı iade almakla yükümlüdür.
                </li>
                <li>
                  ALICI' nın kusurundan kaynaklanan bir nedenle malın değerinde bir azalma 
                  olursa veya iade imkânsızlaşırsa ALICI kusuru oranında SATICI' nın zararlarını 
                  tazmin etmekle yükümlüdür. Ancak cayma hakkı süresi içinde malın veya ürünün 
                  usulüne uygun kullanılması sebebiyle meydana gelen değişiklik ve bozulmalardan 
                  ALICI sorumlu değildir.
                </li>
                <li>
                  Cayma hakkının kullanılması nedeniyle SATICI tarafından düzenlenen kampanya 
                  limit tutarının altına düşülmesi halinde kampanya kapsamında faydalanılan 
                  indirim miktarı iptal edilir.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER:</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  ALICI'nın isteği veya açıkça kişisel ihtiyaçları doğrultusunda hazırlanan ve 
                  geri gönderilmeye müsait olmayan, iç giyim alt parçaları, mayo ve bikini altları, 
                  makyaj malzemeleri, tek kullanımlık ürünler, çabuk bozulma tehlikesi olan veya 
                  son kullanma tarihi geçme ihtimali olan mallar, ALICI'ya teslim edilmesinin 
                  ardından ALICI tarafından ambalajı açıldığı takdirde iade edilmesi sağlık ve 
                  hijyen açısından uygun olmayan ürünler, teslim edildikten sonra başka ürünlerle 
                  karışan ve doğası gereği ayrıştırılması mümkün olmayan ürünler, Abonelik sözleşmesi 
                  kapsamında sağlananlar dışında, gazete ve dergi gibi süreli yayınlara ilişkin mallar, 
                  Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen 
                  gayrimaddi mallar, ile ses veya görüntü kayıtlarının, kitap, dijital içerik, yazılım 
                  programlarının, veri kaydedebilme ve veri depolama cihazlarının, bilgisayar sarf 
                  malzemelerinin, ambalajının ALICI tarafından açılmış olması halinde iadesi Yönetmelik 
                  gereği mümkün değildir. Ayrıca Cayma hakkı süresi sona ermeden önce, tüketicinin onayı 
                  ile ifasına başlanan hizmetlere ilişkin cayma hakkının kullanılması da Yönetmelik 
                  gereği mümkün değildir.
                </li>
                <li>
                  Kozmetik ve kişisel bakım ürünleri, iç giyim ürünleri, mayo, bikini, kitap, 
                  kopyalanabilir yazılım ve programlar, DVD, VCD, CD ve kasetler ile kırtasiye 
                  sarf malzemeleri (toner, kartuş, şerit vb.) iade edilebilmesi için ambalajlarının 
                  açılmamış, denenmemiş, bozulmamış ve kullanılmamış olmaları gerekir.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">TEMERRÜT HALİ VE HUKUKİ SONUÇLARI</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  ALICI, ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düştüğü takdirde, 
                  kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini 
                  ve bankaya karşı sorumlu olacağını kabul, beyan ve taahhüt eder. Bu durumda ilgili 
                  banka hukuki yollara başvurabilir; doğacak masrafları ve vekâlet ücretini ALICI'dan 
                  talep edebilir ve her koşulda ALICI'nın borcundan dolayı temerrüde düşmesi halinde, 
                  ALICI, borcun gecikmeli ifasından dolayı SATICI'nın uğradığı zarar ve ziyanını 
                  ödeyeceğini kabul eder.
                </li>
              </ol>

              <h2 className="text-2xl font-bold mt-8 mb-4">ÖDEME VE TESLİMAT</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Banka Havalesi veya EFT (Elektronik Fon Transferi) yaparak, banka hesaplarımızdan 
                  herhangi birine yapabilirsiniz.
                </li>
                <li>
                  Sitemiz üzerinden kredi kartlarınız ile, Her türlü kredi kartınıza online tek 
                  ödeme ya da online taksit imkânlarından yararlanabilirsiniz. Online ödemelerinizde 
                  siparişiniz sonunda kredi kartınızdan tutar çekim işlemi gerçekleşecektir.
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold mb-4">İade Sürecinde Yardıma mı İhtiyacınız Var?</h3>
          <p className="text-gray-600 mb-6">
            İade ve değişim sürecinde herhangi bir sorunuz olursa müşteri hizmetlerimizle iletişime geçebilirsiniz.
            Size yardımcı olmaktan memnuniyet duyarız.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <a 
              href="mailto:info@uniqcal.com.tr" 
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#ee7f1a] to-[#d62d27] text-white px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300"
            >
              <RefreshCcw className="w-5 h-5" />
              İade Talebi Oluştur
            </a>
            <a 
              href="tel:+908502887878" 
              className="flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-full hover:bg-gray-50 transition-all duration-300"
            >
              <AlertCircle className="w-5 h-5 text-[#ee7f1a]" />
              Destek Hattı: 0850 288 78 78
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-[#ee7f1a]" />
            </div>
            <h3 className="text-lg font-medium mb-2">14 Gün İade Garantisi</h3>
            <p className="text-gray-600 text-sm">
              Satın aldığınız ürünleri 14 gün içerisinde koşulsuz iade edebilirsiniz.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-[#ee7f1a]" />
            </div>
            <h3 className="text-lg font-medium mb-2">Ücretsiz Kargo</h3>
            <p className="text-gray-600 text-sm">
              İade kargo ücretleri firmamız tarafından karşılanmaktadır.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCcw className="w-6 h-6 text-[#ee7f1a]" />
            </div>
            <h3 className="text-lg font-medium mb-2">Hızlı İade Süreci</h3>
            <p className="text-gray-600 text-sm">
              İade işlemleriniz en geç 10 iş günü içerisinde tamamlanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;