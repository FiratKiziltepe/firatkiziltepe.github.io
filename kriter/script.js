// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const clearSearchBtn = document.getElementById('clearSearch');
const navLinks = document.querySelectorAll('.nav-link');

// Search functionality
let searchData = [];
let currentSearchTerm = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeNavigation();
    initializeSmoothScrolling();
    addCompleteContent();
    addMobileMenuToggle();
    addBackToTop();
});

// Add mobile menu toggle
function addMobileMenuToggle() {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    });
    document.body.appendChild(toggleBtn);
}

// Add complete content to HTML
function addCompleteContent() {
    const content = document.querySelector('.content');
    
    // Add remaining sections
    const remainingSections = `
        <!-- 2. Bilimsel Olarak Yeterliği -->
        <section id="bilimsel" class="content-section">
            <h2 class="section-title">2. BİLİMSEL OLARAK YETERLİĞİ</h2>
            <p class="section-intro">Bu bölümde ders kitapları ve eğitim araçları ile bunlara ait elektronik içeriklerin bilimsel yeterlik yönünden incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">2.1. Bilimsellik</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik bilimsellik ilkesi gözetilerek oluşturulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik geçerli, güvenilir, güncel ve objektif kaynaklara dayandırılmalı; kavram yanılgısı, hatalı genelleme, tutarsızlık ve çelişkiye yol açabilecek bilgi ve ifade tarzı barındırmamalıdır.</li>
                            <li>Görüş ve kanaat niteliğinde olan bilgilerin kullanılması durumunda bilginin kaynağı belirtilmeli ve bunlara kaynakçada yer verilmelidir.</li>
                            <li>Bilimsel ve genel kabul görmüş çeviriler tercih edilmelidir.</li>
                            <li>Kavram, terim, sembol, tercüme, sesletim vb. unsurların kullanımında, kitap genelinde ve takım hâlindeki kitaplar (ders kitabı, öğrenci çalışma kitabı, öğretmen kılavuz kitabı) arasında tutarlılık olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte bilgi hatası bulunmamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Konu anlatımı, tanım, açıklama, örnek, gösterim, etkinlik, deney, şema, grafik, tablo, terim, sembol, kısaltma vb. içerikler hata içermemelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.1.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte bilgi eksikliği bulunmamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Konu anlatımı, tanım, açıklama, örnek, gösterim, etkinlik, deney, şema, grafik, tablo, terim, sembol, kısaltma vb. içerikler eksiklik içermemelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.2. Metin ve Görsel Uyumu</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Metin ile görsel uyumlu olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Metin içeren görsellerdeki (tablo, konuşma balonu, bilgi görseli vb.) bilgiler metin ile çelişmemelidir.</li>
                            <li>Metinde atıf yapılan görsellere eksiksiz bir biçimde ve metinle aynı veya karşılıklı sayfada yer verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.2.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Açıklama gerektiren görsele ait alt yazıda hata ve eksiklik bulunmamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Görselin açıklama gerektirip gerektirmediği ve içerikle olan ilişkisi göz önünde bulundurulmalı, açıklama ve numaralandırma bu doğrultuda yapılmalıdır.</li>
                            <li>Numaralandırmalar her ünite/tema/öğrenme alanının sıralamasına uygun olacak şekilde yeniden başlamalıdır.</li>
                            <li>Açıklama gerektiren görsele ait alt yazı; görselde anlatılmak istenen olay, duygu, durum vb. hususları yansıtıcı nitelikte, kısa ve öz olmalıdır.</li>
                            <li>Görsele eklenen alt yazı ile görsel uyumlu olmalıdır.</li>
                            <li>Görselde verilen eserlerin ismi, biliniyorsa sanatçısı ve dönemi, bulunduğu ve sergilendiği yer görsel alt yazısında belirtilmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.3. Kavram ve Terimlerin Kullanımı</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.3.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Alana ve konunun özelliğine uygun kavram ve terimler kullanılmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Alana özgü özel isim, terim, simge, noktalama işareti, birim, sembol, sabit vb. yazımında varsa Kurulca uygun görülen ve yayımlanan yazım kılavuzu/kılavuzları esas alınmalıdır.</li>
                            <li>Yazım kılavuzunda/kılavuzlarında yer almayanların yazımında ise sırasıyla ilgili dersin öğretim programı, TDK Bilim ve Sanat Terimleri Ana Sözlüğü, ilgili bilim dalının alanda kabul görmüş sözlükleri ve Uluslararası Birim Sistemi (SI) esas alınmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.4. Orijinal Metinler</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.4.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte kullanılan alıntı, eserin orijinaline uygun olarak verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Metin/eserde öğrenci seviyesi ve ders işleniş süresi göz önünde bulundurularak kısaltma yapılabilir. Bu durum metnin/eserin altında belirtilmelidir.</li>
                            <li>Kısaltma yapılırken eserin orijinalinden uzaklaşmamaya ve bağlamdan kopmamaya dikkat edilmelidir.</li>
                            <li>Yazarın üslubundan ya da Türkçenin dönemsel özelliklerinden kaynaklı yazım ve noktalama farklılıkları hata olarak nitelendirilip düzeltilmemelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.5. Yazar Biyografileri</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.5.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Metinleri kullanılan yazar ve şairlerin biyografilerinin verilişinde sınıf seviyesi göz önünde bulundurulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İlkokul Türkçe ders kitaplarında, metinleri bulunan yazar ve şairlerin biyografilerine yer verilmemelidir.</li>
                            <li>Ortaokul Türkçe ve Türk dili ve edebiyatı ders kitaplarında Türk ve dünya edebiyatından şair ve yazarların metinleri kullanıldığında biyografi verilmesi durumunda, sanatçıların edebî yönü ve eserlerini öne çıkaran biyografilerine yer verilmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.6. Standart Bölümler</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.6.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ders kitabı ve eğitim aracında tüm sayfalar, ders kitabına ve eğitim aracına ait ekler ve standart bölümler (kapak sayfası içindekiler, organizasyon şeması, sözlük, kaynakça, cevap anahtarı, görsel ve genel ağ kaynakçası) eksiksiz ve sıralı bir biçimde yer almalıdır.</p>
                        <ul class="criterion-details">
                            <li>İlkokul birinci sınıf seviyesine ait ders kitapları ve eğitim araçlarında cevap anahtarı kullanmayı gerektirmeyecek düzeyde etkinlikler yer aldığından standart bölümlerden biri olan "Cevap Anahtarı" bölümüne yer verilmeyebilir.</li>
                            <li>Ders kitabı ve eğitim aracının standart bölümleri sırayla Kapak Sayfası, kitabın başlangıcında İçindekiler, Kitap Tanıtım Şeması (Organizasyon Şeması); kitabın sonunda Sözlük, Kaynakça, Cevap Anahtarı, Görsel Kaynakça, Genel Ağ Kaynakçası şeklinde verilmelidir.</li>
                            <li>Türkçe 5, 6, 7 ve 8. sınıflarda "Sözlük" bölümüne yer verilmemelidir.</li>
                            <li>Ders kitabı ve eğitim aracının "Cevap Anahtarı, Görsel Kaynakça ve Genel Ağ Kaynakçası" bölümleri elektronik ortamda verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.6.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ders kitabı ve eğitim aracının kullanımına kılavuzluk eden bölümlerde kullanılan simgelerin tamamı (ikon, sembol, vinyet vb.) temsil ettiği işleve uygun olmalıdır.</p>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.7. Güvenlik</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.7.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik güvenlik bakımından gerekli uyarı ve tedbirlere uygun şekilde düzenlenmelidir.</p>
                        <ul class="criterion-details">
                            <li>Güvenlik tedbirlerinin alınmasını gerektiren içeriklerde güvenlik kurallarına aykırı ögeler bulunmamalıdır.</li>
                            <li>Deney, etkinlik ve uygulamalarda gerekli durumlarda güvenlik uyarı ve sembollerine yer verilmelidir.</li>
                            <li>Laboratuvar tanıtımı, güvenlik sembolü ile kuralları ders kitabı ve eğitim aracının başlangıcında, ünite/tema/öğrenme alanlarına giriş yapılmadan verilmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.8. Sözlük</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.8.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Sözlük belirli ilkeler doğrultusunda, standarda bağlı kalınarak oluşturulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Sözlük bölümü TDK sözlükleri referans alınarak sözlük hazırlama ilkelerine uygun şekilde hazırlanmalıdır.</li>
                            <li>İçerikte kullanılan ve anlamda kilit rol oynayan sözcük, sözcük grubu, kavram ve terimlerin metindeki anlamları; ders ve konunun niteliğine uygun olarak öncelikle güncel TDK sözlüklerine göre verilmelidir.</li>
                            <li>TDK sözlüklerinde yer almayan kelimeler için alanda kabul görmüş sözlükler ilgili kaynakçada yer verilmek kaydıyla kullanılabilir.</li>
                            <li>İlkokul kitaplarında yer alan sözlüklerde sözcük, kavram ve terimlerin anlamları verilirken öğrencilerin gelişim düzeyine uygun, açık ve anlaşılır olacak şekilde ve bağlamdan kopmadan düzenleme yapılabilir.</li>
                            <li>Sözlük bölümünde sözcüklerin anlamları, öğrencilerin sınıf seviyelerine ve içerik açıklamalarına uygun olmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">2.9. Kaynak Gösterimi</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.9.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Kaynakça belirli ilkeler doğrultusunda, belli bir standarda bağlı kalınarak oluşturulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Kaynakçada kullanılan atıf sistemi tutarlı ve bütünlük arz edecek şekilde olmalı ve metin içi ile sayfa altı dipnot gösteriminde de ilgili atıf sisteminin yazı stili bütünlük arz edecek şekilde kullanılmalıdır.</li>
                            <li>Kullanılan atıf sisteminin adı kaynakçanın sonunda belirtilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">2.9.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Alınan bilginin kaynağı belirli ilkeler doğrultusunda, tam ve doğru olarak belirtilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Verilen kaynak, dipnot ve alıntılarda hata veya eksiklik bulunmamalıdır.</li>
                            <li>Kaynakçada verilen her kaynağın içerikte bir karşılığı olmalıdır.</li>
                            <li>Ders kitabı ve eğitim araçlarında yer verilen basın veya genel ağdan alıntılanan içeriklerin kaynağının verilmesinde ilgili içeriklerin altında yalnızca "Genel ağdan/Basından alınmıştır." ifadesi kullanılmalıdır.</li>
                            <li>Alıntı metinlerin başlıklarında geçen özel isimlerin okunuşu dipnot ile verilmelidir.</li>
                            <li>Genel Ağ Kaynakçası'nda verilen kaynaklar görünen hâlleriyle kontrol edilmek üzere tam bağlantı adresi ve erişim tarihiyle (atıf sisteminde yer almasa bile) verilmelidir.</li>
                            <li>Genel Ağ Kaynakçası ve Görsel Kaynakça bölümlerinde bilgisi verilen alıntı kaynağı veya sayfada yer alan görsel, kullanıldığı sayfa numaraları ile eşleştirilerek verilmelidir.</li>
                            <li>Orijinal metinlerde yazarın üslubundan ya da Türkçenin dönemsel özelliklerinden kaynaklı yazım ve noktalama farklılıklarına yönelik açıklama dipnot şeklinde verilmelidir.</li>
                            <li>Güvenli hizmet kapsamına uygun internet siteleri dışında herhangi bir site genel ağ kaynağı olarak kullanılmamalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 3. Eğitim ve Öğretim Programının Amaç ve Kapsamına Uygunluğu -->
        <section id="program-amac" class="content-section">
            <h2 class="section-title">3. EĞİTİM VE ÖĞRETİM PROGRAMININ AMAÇ VE KAPSAMINA UYGUNLUĞU</h2>
            <p class="section-intro">Bu bölümde ders kitapları ve eğitim araçları ile bunlara ait elektronik içeriklerin eğitim ve öğretim programının amaç ve kapsamına uygunluğu yönünden incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">3.1. İçeriğin Kapsamı ve Öğrenme Çıktılarına Uygunluğu</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ders kitabı ve eğitim aracı ilgili ünite/tema/öğrenme alanının içerik çerçevesini karşılamalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, eğitim öğretim programlarının öğrenme-öğretme yaşantıları bölümlerinde yer alan ön değerlendirme süreci bölümlerini karşılamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ön değerlendirme sürecine ilişkin bölümler ilgili olduğu temel kabuller dikkate alınarak yapılandırılmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.1.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, öğretim programlarının öğrenme-öğretme yaşantıları bölümlerinde yer alan köprü kurma bölümlerini karşılamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Köprü kurma sürecine ilişkin bölümler ilgili olduğu temel kabuller ve öğrenme çıktıları dikkate alınarak yapılandırılmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.1.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, tüm öğrenme çıktıları ile öğrenme çıktılarının süreç bileşenlerini karşılamalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik, öğrenme çıktıları ile öğrenme çıktılarının süreç bileşenlerinin sınırladığı çerçevede eksiksiz olarak verilmelidir.</li>
                            <li>Öğrenme-öğretme uygulamaları bölümlerinde "...istenebilir, verilebilir, vb." şeklinde biten, öğrenme çıktısına ilişkin konunun ve sınıfın şartları göz önünde bulundurularak yazılmış örnek öğretim yöntemlerine içerikte yer verilmeyebilir. Ancak böyle bir durumda içerikte ilgili örnek öğretim yöntemlerini karşılayacak farklı öğretim yöntemlerine yer verilmelidir.</li>
                            <li>İçerik, alan becerilerini ve kavramsal becerileri geliştirmeye yönlendirmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">3.2. İçeriğin Yapısı</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik anlaşılır olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Tanım, açıklama, örnek, gösterim, etkinlik, deney ve simülasyon gibi içerikler tartışmaya yol açmayacak şekilde net olmalıdır.</li>
                            <li>İçerik bir öğrencinin başkasının yardımı olmadan, okuyarak anlayabileceği ve öğrenebileceği yapıda sunulmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.2.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik konu alanının özelliğine uygun olarak bütünsel bir yapıda verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>İçeriği oluşturan tüm birimler (ünite, tema, öğrenme alanı, bölüm, başlık, alt başlık vb.) birbirleri arasında ve kendi içinde tutarlılığa sahip olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.2.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik ilgili yaş ve sınıf seviyesine uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik (etkinlik, kavram, terim, örnek, formül, anlatım dili, görsel ögeler vb.) öğrencinin hazır bulunuşluk düzeyine ve sınıf seviyesine uygun olarak hazırlanmalıdır.</li>
                            <li>İçerikte gereksiz ve seviye üstü ayrıntılardan kaçınılmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">3.3. Öğrenme Alanı/Ünite/Temaların Dengeli Dağılımı</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.3.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçeriğin dağılımı ünite/tema/öğrenme alanı ve hedeflenen süre bazında dengeli olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ders işlenişinde konular arasında hacim bakımından eğitim öğretim programına uygun bir denge gözetilmelidir.</li>
                            <li>İçerik ilgili ünite/tema/öğrenme alanına ayrılan kısım ve haftalık ders saati göz önüne alındığında hedeflenen sürede tamamlanabilir nitelikte olmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">3.4. Öğretme ve Öğrenme Süreci</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.4.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, ilgili eğitim öğretim programının öğrenme-öğretme uygulamaları kapsamındaki eğitim ve öğretim ilkeleri dikkate alınarak oluşturulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Yazılı ve görsel tüm unsurlarda aynı amaca hizmet eden gereksiz tekrarlardan kaçınılmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.4.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik öğrencilerin farklı öğrenme stratejileri ve stillerini kullanmasına imkân tanımalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik öğrencinin bağımsız ve iş birlikli öğrenmesini destekleyecek biçimde zenginleştirilmelidir.</li>
                            <li>İçerik öğrencileri farklı kaynaklardan araştırma ve inceleme yapmaya yönlendirmelidir.</li>
                            <li>İçerik öğrencinin dikkatini çekip öğrencide merak uyandıracak nitelikte verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.4.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Strateji, yöntem ve teknik seçimi dersin niteliğine ve eğitim öğretim programına uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Yöntem ve teknikler öğrencinin sosyal-duygusal öğrenme ve okuryazarlık becerilerini geliştirmesine imkân vermelidir.</li>
                            <li>Yöntem ve teknikler, öğretim programlarının "Erdem-Değer-Eylem Çerçevesi"ne uygun olarak öğrencinin sahip olduğu değerlerin gelişimine ve değerleri içselleştirmesine katkıda bulunmalıdır.</li>
                            <li>Yöntem ve teknikler alan ve kavramsal becerilerin geliştirilmesine imkân verecek bir yapıda olmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">3.5. Öğrenci Çalışma Kitabı ve Öğretmen Kılavuz Kitabı</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.5.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Öğrenci çalışma kitabı hazırlanırken ders kitabının ve eğitim aracının nitelikleri ile hazırlanma usullerinin yanı sıra Yönetmelik'in ilgili maddesi ve açıklamaları göz önünde bulundurulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Öğrencilerin bilgi, beceri, tutum, değer ve okuryazarlıklarını geliştirmelerine yardımcı olacak çeşitli ünite/tema/öğrenme alanı, konu, örnek ve alıştırmalarla ilgili kaynaklara yer verilmelidir.</li>
                            <li>Dersin özelliğine göre inceleme, gezi, gözlem, deney ve uygulamalarla ilgili yapılacak ön hazırlıklara, alınacak sağlık ve güvenlik tedbirlerine, izlenecek iş ve işlem basamaklarına, zaman ve malzeme tasarrufu bakımından uyarı ve bilgilere yer verilmelidir.</li>
                            <li>Kitabı oluşturan unsurların ders kitabı ve eğitim aracı ile bütünleştirilmesi hâlinde öğrenci çalışma kitabı ders kitabı ile birlikte de hazırlanabilir. Bu şekilde hazırlanan kitapların kapak ve iç kapağında "Ders Kitabı ve Öğrenci Çalışma Kitabı" ibaresi yer almalıdır.</li>
                            <li>Dersin özelliğine göre bazı ünite/tema/öğrenme alanı veya konularda kullanılmak üzere öğrencinin ilgisini çekecek örneklere, eğitim ve öğretimi destekleyici çeşitli elektronik eğitim içeriklerine yer verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">3.5.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Öğretmen kılavuz kitabında ders kitabının ve eğitim aracının nitelikleri ile hazırlanma usullerinin yanı sıra Yönetmelik'in ilgili maddesi ve açıklamaları göz önünde bulundurulmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik çerçevesinin işlenişinde ulaşılmak istenen öğrenme çıktıları belirtilmelidir.</li>
                            <li>Bilgi, beceri, tutum, değer ve okuryazarlıkların öğrencilere kazandırılmasında kullanılabilecek araç ve gereçlerle birlikte strateji, öğretim yöntem ve teknikleri belirtilmelidir.</li>
                            <li>İçerik çerçevesinin işleniş planına, öğretmenin konu ile ilgili yapacağı ön hazırlıklara, ünite/tema/öğrenme alanına ait bilgi, beceriler ve bu becerilerin süreç bileşenleri kapsamında temel kabuller dikkate alınarak ön değerlendirme ve köprü kurma süreçlerine yer verilmelidir.</li>
                            <li>Öğrenme-öğretme süreciyle ilişkilendirilen sosyal-duygusal öğrenme ve okuryazarlık becerileri ile değerler kapsamında öğrenme-öğretme yaşantılarının hayata geçirildiği uygulamalara yer verilmelidir.</li>
                            <li>Öğrencileri araştırmaya, günlük yaşamda karşılaşılan çeşitli sorunlara çözüm üretmeye yöneltecek proje ve benzeri örnek çalışmalara yer verilmelidir.</li>
                            <li>İşlenişin sonunda, gerekli görülen kavramlarla ilgili sözlük ve kaynakça bulunmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 4. Eğitim ve Öğretim Programının Bütünleşik Yapısına Uygunluğu -->
        <section id="program-yapi" class="content-section">
            <h2 class="section-title">4. EĞİTİM VE ÖĞRETİM PROGRAMININ BÜTÜNLEŞİK YAPISINA UYGUNLUĞU</h2>
            <p class="section-intro">Bu bölümde ders kitapları ve eğitim araçları ile bunlara ait elektronik içeriklerin eğitim ve öğretim programının bütünleşik yapısına uygunluğu yönünden incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">4.1. İçeriğin Eğitim Öğretim Programının Programlar Arası Bileşenlere Uygunluğu</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">4.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, ilgili ünite/tema/öğrenme alanının öğrenme-öğretme uygulamaları bölümlerinde öngörülen sosyal-duygusal öğrenme becerilerini destekleyecek şekilde hazırlanmalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">4.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, ilgili ünite/tema/öğrenme alanının öğrenme-öğretme uygulamaları bölümlerinde öngörülen değerleri "Erdem-Değer-Eylem Çerçevesi"ne uygun ve destekleyecek şekilde hazırlanmalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">4.1.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, ilgili ünite/tema/öğrenme alanının öğrenme-öğretme uygulamaları bölümlerinde öngörülen sistem okuryazarlığını destekleyecek şekilde hazırlanmalıdır.</p>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">4.2. İçeriğin Eğitim Öğretim Programının Bütüncül Eğitim Yaklaşımına Uygunluğu</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">4.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik, ilgili ünite/tema/öğrenme alanının öğrenme-öğretme uygulamaları bölümlerinde öngörülen eğilimleri destekleyecek şekilde hazırlanmalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">4.2.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İlgili ünite/tema/öğrenme alanının beceriler arası ilişkiler bölümünde gösterilen beceriler, öğrenme-öğretme uygulamaları bölümünde öngörüldüğü biçimde öğrenme çıktısıyla ilişkilendirilerek verilmelidir.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">4.2.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte eğitim öğretim programında yer verilen disiplinler arası ilişkiler ilgili ünite/tema/öğrenme alanı ile anlamlı bir bütünlük oluşturacak biçimde ilişkilendirilerek verilmelidir.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 5. Ölçme ve Değerlendirme Sürecinin Uygunluğu -->
        <section id="olcme" class="content-section">
            <h2 class="section-title">5. ÖLÇME VE DEĞERLENDİRME SÜRECİNİN UYGUNLUĞU</h2>
            <p class="section-intro">Bu bölümde ders kitapları ve eğitim araçları ile bunlara ait elektronik içeriklerin ölçme ve değerlendirme sürecinin uygunluğu yönünden incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">5.1. Temel İlkeler ve Mevzuata Uygunluk</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte yer alan etkinlikler, örnek soru ve çözümleri, performans görevleri, araştırma soruları, uygulamalar, ölçme ve değerlendirmeye yönelik sorular hatalı ve eksik olmamalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ölçme ve değerlendirme bölümünde yer alan her türlü madde ve etkinlik ölçme ve değerlendirme ilkelerine ve ilgili mevzuata uygun olarak hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ölçme ve değerlendirme etkinliklerinde yönergeler açık ve anlaşılır olmalıdır. Yönergelerde gereksiz bilgiye yer verilmemelidir.</li>
                            <li>Hazırlanan tüm madde türlerinin kurgusu, kökü ve öncülleri açık, anlaşılır ve tam olmalıdır.</li>
                            <li>Ölçme ve değerlendirme bölümünde çoktan seçmeli ve doğru yanlış türü maddelerin kullanılması durumunda cevapların bir örüntü oluşturmamasına dikkat edilmelidir.</li>
                            <li>Ölçme ve değerlendirme bölümünde çoktan seçmeli madde türü kullanılması durumunda seçeneklerin uzunluklarının birbirine yakın olmasına özen gösterilmelidir.</li>
                            <li>Ölçme ve değerlendirme bölümünde çoktan seçmeli madde türü kullanılması durumunda seçenekler sayısal değerlerden oluşuyorsa küçükten büyüğe veya büyükten küçüğe doğru sıralanmalıdır.</li>
                            <li>Ölçme ve değerlendirme bölümünde çoktan seçmeli madde türü kullanılması durumunda hepsi, hiçbiri, tümü gibi seçenekler verilmemelidir.</li>
                            <li>Ölçme ve değerlendirme bölümünde eşleştirme madde türü kullanılması durumunda öncüller ve yanıtların eşit sayıda olmamasına dikkat edilmelidir.</li>
                            <li>Ölçme ve değerlendirme bölümünde yer alan maddelerden birinin seçeneği başka bir maddenin doğru yanıtı için ipucu oluşturmamalıdır.</li>
                            <li>Hazırlanan madde türlerinde olumsuz soru ifadeleri dikkat çekici şekilde vurgulanmalıdır.</li>
                            <li>Maddeye ait bilgi veya beceriler, öğrencilerin neyi öğrenmesi gerektiği ile doğrudan ilişkili olmalıdır.</li>
                            <li>Hazırlanan madde türlerinde madde ile ilgili olmayan gereksiz görsellere yer verilmemelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.1.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Cevap anahtarı eksik veya hatalı olmamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ünite/tema/öğrenme alanı ve konu sonlarında kullanılan ölçme ve değerlendirme etkinliklerindeki açık uçlu sorular hariç tüm soruların cevapları hatasız olarak cevap anahtarında yer almalı, cevaplar sorularla aynı sayfada verilmemelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.1.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ölçme ve değerlendirmeye yönelik etkinlikler öğrencinin seviyesine uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ölçme ve değerlendirmeye yönelik etkinlikler basitten karmaşığa, kolaydan zora olacak şekilde sıralanmalıdır.</li>
                            <li>Ölçme ve değerlendirmeye yönelik etkinlikler ilgi çekici, yakın ve uzak çevrede karşılaşılan durumlar göz önünde bulundurularak tasarlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.1.5.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Türkçe ve yabancı dil derslerine yönelik temel dil becerilerini destekleyici ölçme ve değerlendirme etkinlikleri hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Hazırlanan ölçme ve değerlendirme etkinlikleri ilgili ünite/tema/öğrenme alanındaki dil becerilerini destekleyici nitelikte olmalıdır.</li>
                            <li>İlkokul ders kitaplarında Türkçenin doğru ve güzel kullanımını geliştirmek amacıyla dinleme, konuşma, okuma ve yazma becerilerinin izlenmesi ve geliştirilmesine yönelik ölçme araçları kullanılmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">5.2. Ölçme ve Değerlendirme Sürecinin Eğitim Öğretim Programına Uygunluğu</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte kullanılan ölçme ve değerlendirme etkinliklerinin planlanmasında ilgili ünite/tema/öğrenme alanının öğrenme kanıtları bölümleri ve öğrenme-öğretme uygulamaları bölümleri esas alınmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ölçme ve değerlendirmeye yönelik etkinlikler, öğrenme çıktıları ve bu çıktıların süreç bileşenleri ile öğrenme-öğretme uygulamalarını tam olarak karşılamalıdır.</li>
                            <li>Ölçme ve değerlendirmeye yönelik etkinlikler, ilgili öğretim programında belirlenen öğrenme çıktılarına uygun olmalıdır.</li>
                            <li>Öğrenme-öğretme uygulamaları bölümleri ile öğrenme kanıtları bölümlerinde "istenebilir, verilebilir, vb." şeklinde biten, ölçme değerlendirme sürecine ilişkin konunun ve sınıfın şartları göz önünde bulundurularak yazılmış olan ölçme ve değerlendirme araçlarına ders kitabı ve eğitim aracında yer verilmeyebilir. Ancak böyle bir durumda ilgili ölçme değerlendirme süreci farklı bir ölçme ve değerlendirme aracıyla ölçülecek biçimde ders kitabı ve eğitim aracında yer almalıdır.</li>
                            <li>Ölçme ve değerlendirme araçlarının planlaması, tasarımı ve uygulamasında; ödevler, projeler, performans görevleri, sunumlar, kontrol listeleri, sınavlar, gözlem ve görüşme formları, öğrenci anketleri, ölçekler, mezun anketleri, sınıf içi tartışmalar, öz/akran/grup değerlendirmeleri ve yansıtma yazıları gibi öğrenme kanıtları eğitim öğretim programının sınırlılıkları ve beklentileri dikkate alınarak yapılmalıdır.</li>
                            <li>Ölçme ve değerlendirme bölümü ilgili öğretim programında yer alan öğrenme-öğretme yaşantılarında ölçülmek istenen yapıya bağlı olarak belirlenmelidir.</li>
                            <li>Öğrenme kanıtlarına yönelik etkinlikler öğrenme çıktılarını destekleyen, beceri ve süreç odaklı bir biçimde tasarlanmalıdır.</li>
                            <li>Ölçme ve değerlendirme bölümleri bilgi ve beceri düzeylerini belirlemenin yanı sıra öğrenme eksiklikleriyle ilgili de bilgi sağlamalıdır.</li>
                            <li>Ölçme ve değerlendirme bölümleri öğretmenlere öğrenci gelişimini takip etme, öğretim yöntemlerini iyileştirme ve öğrenme çıktılarına ulaşma konularında rehberlik etmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.2.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Her ünite/tema/öğrenme alanında en az bir tane performans görevi verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Performans görevleri gerçek hayatla ilişkili, bilginin transferine imkân sağlayan, öğrenci için anlamlı ve ilgi çekici olan, bireysel ilgi ve ihtiyaçlara göre farklılaşabilme konusunda esnekliğe imkân verecek şekilde tasarlanmalıdır.</li>
                            <li>Değer, eğilim, okuryazarlık ve sosyal duygusal öğrenme becerilerindeki gelişim ve değişimin izlenebilmesi amacıyla performans görevi ölçütleri arasında bu becerilerin yer alması sağlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">5.3. Ön Değerlendirme ve Pekiştirme Araçları</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.3.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte ön öğrenmeleri belirleyici, konuya hazırlayıcı ve öğrenilenleri pekiştirici nitelikte etkinlik ve maddelere yer verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>İçerikte ünite/tema/öğrenme alanına ilişkin temel kabullerde yer alan bilgileri hatırlatabilecek, yeni konuya çerçeve oluşturabilecek, öğrenme isteği ve merak uyandırıcı, motive edici nitelikte hazırlayıcı etkinliklere yer verilmelidir.</li>
                            <li>Ders kitabı ve eğitim aracında yer alan öğrenme kanıtlarına yönelik etkinlikler dışında ünite/tema/öğrenme alanı sonu ölçme ve değerlendirme bölümlerinde yer verilmek üzere, sınıf seviyesi ve alan türleri dikkate alınarak konunun niteliği, öğrenme çıktıları ve süreç bileşenlerinin düzeyine bağlı olarak farklı soru çeşitleri ve ölçme araçları ile öğrenilenleri pekiştirici etkinlik veya sorular hazırlanmalıdır.</li>
                            <li>Ön değerlendirme sürecinde öğrenilenleri pekiştirici nitelikte etkinlik ve maddelere yeterli oranda yer verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.3.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ölçme ve değerlendirmeye yönelik içerikler ünite/tema/öğrenme alanının köprü kurma bölümlerini kapsayacak nitelikte olmalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.3.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İlgili ünite/tema/öğrenme alanında yer alan öğrenme kanıtlarında kullanılacak yöntem ve tekniklerde çeşitlilik sağlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ölçme ve değerlendirmeye yönelik etkinlikler öğrencilerin yetenek farklılıkları, özel gereksinimleri ve öğrenme profilleri göz önünde bulundurularak çeşitlendirilmeli ve çok yönlü bir biçimde tasarlanmalıdır.</li>
                            <li>Ölçme ve değerlendirmeye yönelik etkinlikler öğrencinin kendisini değerlendirmesine fırsat vermelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">5.3.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ölçme ve değerlendirmeye yönelik etkinlikler ilgili ünite/tema/öğrenme alanı dikkate alınarak mümkün olduğunca sınıf ortamında yapılacak şekilde tasarlanmalıdır.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 6. Dil ve Anlatım Yönünden Yeterliği -->
        <section id="dil" class="content-section">
            <h2 class="section-title">6. DİL VE ANLATIM YÖNÜNDEN YETERLİĞİ</h2>
            <p class="section-intro">Bu bölümde ders kitapları ve eğitim araçları ile bunlara ait elektronik içeriklerin dil ve anlatım yönünden yeterliğinin incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">6.1. Dil ve Üslup</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik Türkçenin doğru ve özenli kullanımını, dilin anlatım zenginliğini, gücünü ve anlam inceliklerini yansıtır nitelikte olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Dilin kullanımında kültürel miras niteliğindeki dil ve edebiyat ürünleri ile aradaki bağı koparmayacak bir hassasiyet gözetilmelidir.</li>
                            <li>Söz varlığı yönünden zengin olan metinler tercih edilmelidir.</li>
                            <li>Türkçeye henüz yerleşmemiş yabancı sözcükler yerine varsa Türkçe karşılıkları kullanılmalıdır.</li>
                            <li>Öğrencilerin sınıf seviyelerine uygun ve söz varlıklarını zenginleştirmeye yönelik bir dil kullanılmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Özel isim, yabancı sözcük ve sözcük gruplarının okunuşu ile kısaltmaların açılımı, içindekiler bölümü, ünite/tema/öğrenme alanı kapakları ve başlıklar haricinde ilk geçtiği yerde verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Özel isim, yabancı sözcük ve sözcük gruplarının yazılışı ile okunuşu aynı olsa bile ilk geçtiği yerde okunuşuna yer verilmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">6.2. Yazı Dili Standartlarına Uygunluk</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte yazım yanlışı bulunmamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Alana özgü olmayan ifadelerin yazımında Türk Dil Kurumu Yazım Kılavuzu esas alınmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.2.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte noktalama eksikliği, yanlışlığı olmamalı; gereksiz noktalama işareti kullanılmamalıdır.</p>
                        <ul class="criterion-details">
                            <li>Sayılar ve birimlerden sonra gelen eklerin kesme işareti ile ayrılması hususunda TDK yazımı esas alınmalıdır.</li>
                            <li>Karışıklığa yol açabilecek sembol ve gösterimlere (türev, tümleyen, değişken, mutlak değer, aralık, geometrik ifadeler, vb.) gelen eklerin yazımında kesme işareti kullanılmamalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.2.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Yabancı diller, yaşayan diller ve lehçeler alanındaki ders kitapları ve eğitim araçları, ilgili olduğu dilin dil bilgisi kurallarına uygun olmalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.2.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Yabancı diller, yaşayan diller ve lehçeler alanındaki ders kitapları ve eğitim araçları, ilgili olduğu dilin öğretim programında temel alınan lehçeye özgü kullanım şekline uygun hazırlanmalıdır.</p>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">6.3. Anlam ve Anlatım</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.3.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerikte anlamsal veya yapısal anlatım bozukluğu bulunmamalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.3.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Anlatım ilkelerine (akıcılık, yalınlık, açıklık, duruluk vb.) uygun bir dil kullanılmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Anlatım hiçbir tartışmaya yol açmadan tek bir yargıyı açıkça ifade etmelidir.</li>
                            <li>Anlatım gereksiz söz sanatları ve sözcük öbeklerinden uzak, basit ve yalın; ifadeler sade ve anlaşılır olmalıdır.</li>
                            <li>Anlatım gereksiz sözcüklerden, aynı anlama gelen ifadelerden ve sözcük tekrarlarından arınmış olmalıdır.</li>
                            <li>Anlatım, metin içerisinde akıcılığı bozacak nitelikte uzun cümlelerden ve karışık ifadelerden uzak; okumayı yavaşlatmayan ve kolay okunabilir nitelikte olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.3.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Metin içerisinde kullanılan sözcük ve sözcük grupları, bağlama uygun biçimde verilmelidir.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">6.3.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Metni oluşturan birimler (cümle, paragraf vb.) arasında anlam ve anlatım bütünlüğü sağlanmalıdır.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 7. Görsel Tasarım ve İçerik Tasarımının Uygunluğu -->
        <section id="gorsel" class="content-section">
            <h2 class="section-title">7. GÖRSEL TASARIM VE İÇERİK TASARIMININ UYGUNLUĞU</h2>
            <p class="section-intro">Bu bölümde ders kitapları ve eğitim araçları ile bunlara ait elektronik içeriklerin görsel tasarım ve içerik tasarımının uygunluğunun incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">7.1. Kapak Tasarımı</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Kapak tasarımı genel tasarım ilkelerine, Yönetmelik'te belirlenmiş ilkelere ve "Ders Kitabı Kapağı Tasarım Çerçevesi"ne uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Kapak tasarımında kullanılan görseller ünite/tema/öğrenme alanı kapak görselleri ile aynı olmamalıdır.</li>
                            <li>Kapak, öğrencilerin gelişim seviyesine uygun olarak ilgi çekici ve öğrencide merak uyandırıcı bir nitelikte tasarlanmalıdır.</li>
                            <li>Kapak tasarımında kullanılan ögeler ve bunların kullanılış tarzı kitabın içeriğiyle uyumlu ve içeriği destekleyici nitelikte olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ünite/tema/öğrenme alanı kapak tasarımında kullanılan ögeler ve bunların kullanılış tarzı ilgili ünite/tema/öğrenme alanı içeriğiyle uyumlu ve içeriği destekleyici nitelikte olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ünite/tema/öğrenme alanı veya konu başında yer alan görsel, ünite/tema/öğrenme alanını veya konuyu temsil etmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">7.2. Genel Tasarım Uyumu</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Tasarımda kullanılan ögeler sistematik bir bütünlüğe sahip olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Kitabın bütününde sayfa düzeni, yazı karakteri ve büyüklüğü, satır boşluğu, kenar boşluk ayarları gibi ögeler arasında bütünlük ve devamlılık sağlanmalıdır.</li>
                            <li>Ana ve alt başlıkların punto, renk, yazı tipi vb. özellikleri metinden ayırt edilecek ve konuyu toparlayacak şekilde sistematik bir biçimde düzenlenmelidir.</li>
                            <li>Sayfa numaraları kolaylıkla görülebilecek, takibi güçleştirmeyecek ve karışıklığa yol açmayacak şekilde; sağ (ön) sayfalarda tek sayılar, sol (arka) sayfalarda çift sayılar kullanılarak yapılmalıdır.</li>
                            <li>Sayfada resim, tablo, şema, grafik, fotoğraf, kavram haritası, zihin haritası, karekod vb. ögelerin tasarımında kendi içinde birlik olmalıdır.</li>
                            <li>Metin, kaynak bağlacı, kaynakça, dipnotlar, görsel alt yazıları vb. bölümler kitabın tamamında bütünlük oluşturacak şekilde hazırlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.2.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçindekiler listesi sistematik ve işlevsel olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçindekiler listesi sayfa tasarımı biçimlendirmesine, metinde kullanılan başlık sistemine, içeriği tanıtma amacına uygun; rahat okunabilir, sistematik ve işlevsel biçimde düzenlenmelidir.</li>
                            <li>İçindekiler bölümünde belirtilen başlık ve alt başlıklar içerikte kullanılan başlıklarla aynı olmalıdır.</li>
                            <li>İçindekiler bölümünde belirtilen sayfa numaraları içerikte doğru yere yönlendirmelidir.</li>
                            <li>Alfabetik sıralamada alfabemizde yer alan harf sıralamasına uyulmalıdır. Yabancı dilde yazılan kitaplardaki sıralamada ilgili dilin alfabesi dikkate alınmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.2.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Cevap anahtarları belli bir düzen içinde ve takibi kolaylaştıracak şekilde verilmelidir.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.2.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Dikkat gerektiren bölümler vurgulama teknikleri kullanılarak etkili bir biçimde tasarlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Metinlerde vurgulama amaçlı kullanılan çeşitli yöntemler, seçilen yazı tipi, madde imi vb. unsurlar içeriğin tamamında tutarlı olmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">7.3. Sayfa Tasarımı</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.3.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Sayfa tasarımı genel tasarım ilkelerine uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Sayfada kullanılan arka plan rengi ile yazılı ve görsel unsurların renklendirilmesinde okumayı ve algılamayı kolaylaştıracak bir tasarım tercih edilmelidir.</li>
                            <li>Kenar boşlukları ve yazma alanları, konunun özelliğine bağlı olarak öğrenmeyi destekleyici nitelikte olmalıdır.</li>
                            <li>İçerikte boşluk doldurma, eşleştirme, çizim vb. etkinliklerde yazmak için bırakılan alanlar yeterli olmalıdır.</li>
                            <li>Sayfa tasarımında perspektif, denge, birlik, hiyerarşi, baskınlık, oran-orantı, uygunluk, zıtlık ve diğer tasarım ilkeleri dikkate alınmalıdır.</li>
                            <li>Görsel ögeler sayfa düzenine uygun ve okuma akışını engellemeyecek şekilde yerleştirilmeli, yatay ve dikey olarak materyale eşit ağırlıkta dağıtılıp dengeli bir biçimde verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.3.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Sayfalar ve görseller estetik olarak tasarlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Görsellerde kompozisyon bütünlüğünü bozan gereksiz öge kullanılmamalıdır.</li>
                            <li>Sayfada amacı belli olmayan, anlaşılırlığı bozan ögelerin kullanımından kaçınılmalı; gereksiz ögeler kullanılmamalıdır.</li>
                            <li>Sayfa tasarımı öğrencinin ilgisini çekecek, gelişim seviyesine uygun ve görsel algısını kolaylaştıracak nitelikte olmalıdır.</li>
                            <li>Karşılıklı sayfalar tek bir kompozisyon olarak tasarlanmışsa görsel bütünlük bozulmamalıdır.</li>
                            <li>Tasarımsal ögelerdeki çizgi, boyut, doku, renk, ışık, gölge, tonlama, perspektif vb. unsurlar öğrenmeye katkı sağlayacak şekilde kullanılmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.3.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Özgün veya konunun niteliğine uygun olarak özgün kabul edilebilecek tasarım ögeleri kullanılmalıdır.</p>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">7.4. Görsel Destekli Öğrenme</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.4.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">İçerik öğrenme çıktıları ve süreç bileşenlerinin gerçekleşmesini ve öğrenmeyi destekleyecek, anlamayı kolaylaştıracak görsellerle desteklenmelidir.</p>
                        <ul class="criterion-details">
                            <li>İçerik öğrenmeyi destekleyecek sayıda, amaca hizmet eder nitelikte ve metinle bütünlük oluşturacak çeşitlilikte görsellerle zenginleştirilmelidir.</li>
                            <li>Konunun niteliğine bağlı olarak anlamayı ve yorumlamayı kolaylaştıracak, sözel ve yazılı unsurları destekleyecek görsel ögelere (tablo, şema, grafik, fotoğraf, kavram haritası, zihin haritası, bilgi görseli vb.) yer verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.4.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Görsellerin seçiminde yakından uzağa ilkesi gözetilmelidir.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.4.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Eğitim öğretim programında yer alan öğrenme çıktıları ünite/tema/öğrenme alanı başlarında görsel özetleyicilerle sunulmalıdır.</p>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">7.5. Görsel ve Yazılı Unsurların Özellikleri</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.5.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Görseller anlaşılır ve net olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Görseller ve içinde kullanılan ögeler yüksek çözünürlük ve kalitede olmalıdır.</li>
                            <li>Görseller ve görsellerin içinde yer alan yazılı unsurlar okunabilir, belirgin ve anlaşılır olmalıdır.</li>
                            <li>Görseller kolay algılanabilecek büyüklükte olmalıdır.</li>
                            <li>Görseller verilmek istenen mesajı açık bir biçimde iletmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.5.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Görsel ve görseli oluşturan ögeler hata ve eksiklik içermemelidir.</p>
                        <ul class="criterion-details">
                            <li>Görsellerde yükseklik, genişlik ve derinlik özellikleri açısından perspektif hataları bulunmamalıdır.</li>
                            <li>Görsellerde öge eksikliği bulunmamalıdır.</li>
                            <li>Görseller ışık kaynağına uygun şekilde çizilmeli, tonlama ve gölgelendirmede ışık kaynağının konumu göz önünde bulundurulmalıdır.</li>
                            <li>Nesne ve varlıklar birbirlerine göre oran ve orantı bakımından uygun bir şekilde verilmelidir.</li>
                            <li>Görsellerde anatomik bozukluklar olmamalıdır.</li>
                            <li>Görsellerde denge unsurlarına (simetrik ve asimetrik) dikkat edilmelidir.</li>
                            <li>Nesnelerin göze olan uzaklık ve yakınlığına, göz hizasından aşağıda ve yukarıda oluşuna göre çizgi, yüzey, renk değişikliklerini yansıtan ölçü ve oranlar doğru kullanılmalıdır.</li>
                            <li>Görseller içeriğe uygun şekilde bir bütün olarak alınmalı veya bütünlüğü bozmayacak şekilde kesit alınarak gösterilmelidir.</li>
                            <li>Figürlerin bulundukları mekân ve nesnelerle ilişkisi, mekândaki konumlandırılışı, yerleşimi ve mekânla bütünleşmesi doğru kompozisyona oturtulmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.5.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Görseller konunun niteliğine bağlı olarak gerçek durumları yansıtıcı özellikte olmalıdır.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">7.5.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Yazılı unsurlar, genel tasarım ilkelerine ve Yönetmelik'te belirlenmiş ilkelere uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Metin tüm bileşenleriyle temel tasarım ilkeleri göz önünde bulundurularak öğrenmeyi destekleyen ve kolay anlaşılabilir şekilde tasarlanmalıdır.</li>
                            <li>Yazıda karakter büyüklüğü Yönetmelik hükümlerinde belirtildiği şekilde olmalı; metin kısımlarının başlıkları dışında kalan bölümlerinde resim altı yazıları, dipnot ve benzeri kullanılan yazılar hariç ilkokul 1'inci sınıflar için yirmi, 2'nci sınıflar için on sekiz, 3'üncü sınıflar için on dört, 4'üncü sınıflar için on iki, ortaokul 5'inci sınıflar için on bir; daha üst sınıflar için ise on puntodan daha küçük punto kullanılmamalıdır.</li>
                            <li>Seçilen yazı tipi öğrenci düzeyine uygun ve kolay okunabilir nitelikte olmalıdır.</li>
                            <li>İçerikte öğrencilerin okuma hızını, anlama yeteneğini olumsuz etkileyecek ve bilişsel yükü artıracak düzeyde farklı yazı tipleri kullanılmamalıdır.</li>
                            <li>Metin içerisinde vurgulama amaçlı olarak büyük harf kullanılmamalıdır.</li>
                            <li>Paragraflar arası boşluklar satır arası boşluklardan fazla olmalıdır. Başlıkla metin arasındaki boşluk satır arasındaki boşluktan fazla olmalıdır.</li>
                            <li>Metinlerde tipografik tasarım hataları (sözcüklerin ve harflerin aralarında yeterli ve dengeli boşluk bırakılmamasından kaynaklı sıkışık metin tasarımı vb.) bulunmamalıdır.</li>
                            <li>Tutarsız boşluklar nedeniyle okumanın kesintiye uğramaması için otomatik tam bloklama (yanlardan hizalama) yapılmamalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 8. Elektronik İçeriklerin Kapsam ve Tasarımının Uygunluğu -->
        <section id="elektronik" class="content-section">
            <h2 class="section-title">8. ELEKTRONİK İÇERİKLERİN KAPSAM VE TASARIMININ UYGUNLUĞU</h2>
            <p class="section-intro">Bu bölümde elektronik içeriklerin kapsam ve tasarımının uygunluğunun incelenmesi ve değerlendirilmesinde dikkate alınacak kriterler ve açıklamaları yer almaktadır.</p>
            
            <div class="subsection">
                <h3 class="subsection-title">8.1. Standart Olarak Hazırlanması Gereken E-içerikler ve Karekodlar</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.1.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ders Kitabı ve eğitim aracının ilgili bölümlerinde karekodlara ve e-içeriklere yer verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Tüm ünite/tema/öğrenme alanlarının kapaklarında ilgili ünite/tema/öğrenme alanına yönlendiren karekod yer almalıdır.</li>
                            <li>Arka kapakta kitabın EBA platformunda yer alan elektronik nüshasına yönlendiren karekod yer almalıdır.</li>
                            <li>Tüm ünite/tema/öğrenme alanları için özet e-içerikler hazırlanmalı ve bu e-içeriklere yönlendiren karekodlara ilgili ünite/tema/öğrenme alanı kapağında yer verilmelidir.</li>
                            <li>Tüm ünite/tema/öğrenme alanları için ek etkinlik veya sorular e-içerik olarak hazırlanmalı ve bu e-içeriklere yönlendiren karekodlara ilgili ünite/tema/öğrenme alanı sonunda yer verilmelidir.</li>
                            <li>Ders kitabı ve eğitim aracının "Cevap Anahtarı, Görsel Kaynakça ve Genel Ağ Kaynakçası" bölümleri elektronik ortamda verilmelidir.</li>
                            <li>Kaynakça bölümünde görsel kaynakçaya ve genel ağ kaynakçasına yönlendiren karekod yer almalıdır.</li>
                            <li>Cevap anahtarı bölümünde cevap anahtarına yönlendiren karekod yer almalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.1.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Karekodlar standartlara uygun olarak tasarlanmalı ve yerleştirilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Karekodlar ilişkili olduğu içeriğe uygun sayfalara yerleştirilmelidir.</li>
                            <li>Karekodların yönlendirdiği e-içeriğin tanıtıcı nitelikte, kısa ve öz alt yazısı olmalıdır.</li>
                            <li>Karekodlar; kitabın sırt kısmına yakın olmayacak, netliği sağlayacak ve okumayı zorlaştırmayacak şekilde yerleştirilmelidir.</li>
                            <li>Aynı sayfada iki veya daha fazla karekod kullanılması durumunda karekodlar birbirlerinin okunurluğunu etkilemeyecek şekilde yerleştirilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.1.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içeriklere karekodu okutma ve tıklama yoluyla erişim sağlanabilmelidir.</p>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.1.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Özet e-içerikler etkili bir öğretim sağlayacak nitelikte hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Özet e-içerikler ünite/tema/öğrenme alanı içeriğini ana hatlarıyla özetleyecek şekilde ve ders işlenişine uygun olarak hazırlanmalıdır.</li>
                            <li>Özet e-içerikler basılı kitabın bire bir aynısı olmamalı, özgün bir anlatım ve bakış açısı sunmalıdır.</li>
                            <li>Özet e-içerikler kitaptaki bilgilerle çelişmemeli ve tutarlı olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.1.5.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerik olarak hazırlanan ek etkinlik veya sorular öğrenme çıktılarının tamamını ölçmeye yönelik, yeterli sayıda ve çeşitlilikte hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Sınıf seviyesi ve alan türleri dikkate alınarak konunun niteliğine bağlı farklı soru çeşitleri ve ölçme araçları ile öğrenilenleri pekiştirici etkinlik veya sorular hazırlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">8.2. Elektronik Eğitim İçerikleri Tablosuna Uygunluk</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.2.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ders kitapları ve eğitim araçlarına yönelik hazırlanması gereken "Elektronik Eğitim İçerikleri Tablosu"nda belirtilen e-içerikler hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>E-içerikler eğitim öğretim programının yapısı, kitabın kurgusu ve e-içerik tablosu dikkate alınarak hazırlanmalıdır.</li>
                            <li>Tablo satırında belirtilen e-içerik türlerinden en az birinde e-içerik hazırlanmalıdır.</li>
                            <li>E-içerikler içeriğin yapısı, konunun uygunluk durumu ve e-içeriğin türü göz önüne alınarak tabloda istenen e-içeriklerden birkaçını kapsayacak şekilde hazırlanabilir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">8.3. Eğitsel Tasarım</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.3.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler ilgili öğretim programında öngörülen ve öğrenme çıktılarıyla ilişkili bilgi, beceri, eğilim ve değerlerin geliştirilmesine katkıda bulunacak şekilde hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Öğrencilerin değer ve eğilimlerini geliştirmelerini teşvik edecek e-içerikler hazırlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.3.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler öğrencilerin öğrenme fırsatlarını artıracak çeşitlilik ve nitelikte hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik, öğrencilere becerilerini uygulayabilecekleri fırsatlar sunan ve farklı öğrenme stratejilerini destekleyen etkinlikler içermelidir.</li>
                            <li>İçerik, dersin türü ve ilgili ünite/tema/öğrenme alanları dikkate alınarak video, etkileşimli içerik, bilgi görselleri, animasyon gibi farklı e-içerik türleri ile zenginleştirilmelidir.</li>
                            <li>E-içerik tasarımında metin, resim, ses ve video gibi farklı çoklu ortam unsurları dengeli ve etkili bir şekilde kullanılmalıdır.</li>
                            <li>Kitap genelindeki e-içerikler, öğrenme sürecinin sadece belirli bölümlerine odaklanmamalı, öğrencinin dikkatini çekmekten öğrendiklerini değerlendirmeye kadar tüm öğrenme aşamalarını destekleyecek şekilde çeşitlilik göstermelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.3.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler mantıklı, ilgi çekici ve motive edici senaryolar üzerinden kurgulanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçeriğin açık, net ve eğitim öğretim programına uygun amacı olmalıdır.</li>
                            <li>İçerik, ders kitabı ve eğitim aracındaki ilişkili olduğu içeriği tamamlayıcı nitelikte tasarlanmalıdır.</li>
                            <li>İçerik, e-içeriğin türüne bağlı olarak öğrencilerin aktif olarak katılmasını teşvik eden etkileşimli ögeler içermelidir.</li>
                            <li>Konunun özelliği ve e-içeriğin türüne bağlı olarak öğrencileri güdülemeye yönelik ödüllendirme mekanizmaları kullanılmalıdır.</li>
                            <li>Seslerin ve videoların uzunluğu içeriğin amacına uygun olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.3.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler öğrencinin yaşına ve sınıf seviyesine uygun olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerik, öğrencinin yaşına ve sınıf seviyesine uygun bir pedagojik yaklaşımla hazırlanmalıdır.</li>
                            <li>İçerikte kullanılan metin, görsel, ses vb. çoklu ortam unsurları öğrencinin yaşına ve sınıf seviyesine uygun olmalıdır.</li>
                            <li>İçerikte öğrencinin yaşına ve sınıf seviyesine uygun, anlaşılır ve sade bir dil kullanılmalıdır.</li>
                            <li>İçerik, öğrencinin yaşına ve sınıf seviyesine uygun bir etkileşim düzeyi sunmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.3.5.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler bilişsel yük dengesi açısından etkili bir öğretim sağlayacak nitelikte tasarlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>İçerikte öğrenmenin amaçlarıyla doğrudan ilgili olmayan görseller ve gereksiz bilgiler yer almamalıdır.</li>
                            <li>Birden fazla adımdan oluşan görevler, alt görevlere bölünmeli ve açık bir şekilde talimatlandırılmalıdır.</li>
                            <li>Öğrencilerin içerikte zorlandıkları noktalarda gerekli ipucu desteği sağlanmalıdır.</li>
                            <li>Öğrencinin aktif katılacağı içeriklerde karmaşık görevler olması durumunda (deney, etkinlik, alıştırma, oyun vb.) anlaşılır, sistematik ve tutarlı yönergelere yer verilmelidir.</li>
                            <li>Bilgi sunumunda bilişsel yükü azaltmak ve öğrenmeyi kolaylaştırmak için e-içeriğin türüne uygun olarak görsel ve işitsel ögeler dengeli bir şekilde kullanılmalıdır.</li>
                            <li>Birbirleriyle ilişkili ögelerin birbirine yakın ve eş zamanlı olarak sunulmasına özen gösterilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.3.6.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Etkileşimli içeriklerde e-içeriğin türüne, konusuna ve öğrenenin özelliklerine uygun geri bildirimlere yer verilmelidir.</p>
                        <ul class="criterion-details">
                            <li>Geri bildirimler, öğrenciye en uygun sürede ve sıklıkta sağlanmalıdır.</li>
                            <li>Geri bildirimin içeriği, öğrenme süreciyle doğrudan ilişkili olmalıdır.</li>
                            <li>Geri bildirim yapıcı olmalı, öğrencilerin güçlü yönlerini ortaya çıkarmalı, gelişimlerini teşvik etmeli, öz güvenlerini desteklemeli ve aynı zamanda gelişim alanlarıyla ilgili farkındalık kazandırmalıdır.</li>
                            <li>Bir soruya verilen yanıtlarla ilgili geri bildirimlerde sadece yanıtın doğru veya yanlış olduğu belirtilmemeli, aynı zamanda açıklayıcı bilgiler ve ipuçları verilmeli veya yönlendirmeler yapılmalıdır.</li>
                            <li>Geri bildirim, metin, ses ve görsel gibi çeşitli formatları kullanarak çok yönlü bir yaklaşım sergilemeli ve böylece farklı öğrenme stillerine hitap etmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">8.4. Arayüz Tasarımı ve Kullanılabilirlik</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.4.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler sorunsuz bir şekilde çalışmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Düğmeler, bağlantılar, menüler gibi etkileşimli ögeler tıklandığında veya kullanıldığında beklenen işlevi yerine getirmelidir.</li>
                            <li>Sürükle-bırak işlevi sorunsuz çalışmalı, ögeler kolayca seçilip taşınabilmeli ve hedef alanlara doğru şekilde yerleştirilebilmelidir.</li>
                            <li>İçerikler herhangi bir eklenti ya da yazılım kurulumu gerektirmeden kullanılabilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.4.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Arayüz basit, anlaşılır ve kullanımı kolay olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Araç çubukları, menüler ve düğmeler gibi denetim ögeleri işlevini doğru yansıtacak şekilde kolay hatırlanabilir ve anlaşılır olmalıdır.</li>
                            <li>Video veya sesli anlatım içeren etkileşimli içeriklerde durdurma, geri ve ileri sarma gibi oynatma seçenekleri sunulmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.4.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içeriklerin genel yapısı ve tasarımı kendi içinde bir bütünlük oluşturmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ekranlar ve geçişler arasında tematik bir bütünlük olmalıdır.</li>
                            <li>Arayüzde kullanılan tüm ögeler, tutarlı bir görsel ve işlevsel düzen içinde yer almalıdır.</li>
                            <li>E-içeriklerin farklı ekranları, menüleri, düğmeleri, kullanılan yazı tipi ve boyutu, renk, boşluk, hizalama gibi tasarım özellikleri ve benzeri yapıları arasında renk, biçim, kompozisyon gibi unsurlar açısından görsel estetik ve tematik bütünlük sağlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.4.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Etkileşimli içeriklerde alanlar etkileşime uygun tasarlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Etkileşimli içeriklerde sunulan eşleştirme, yazma, tıklama, boşluk doldurma vb. alanlar ile diğer etkileşim bölümleri amacına uygun tasarlanmalıdır.</li>
                            <li>Eşleşen ögeler arasında görsel bir bağlantı (örneğin renk değişimi veya çizgi) kurularak eşleşmenin doğruluğu vurgulanmalıdır.</li>
                            <li>Yazma alanları yeterli büyüklükte olmalı ve öğrencinin rahatça yazmasına imkân tanımalıdır.</li>
                            <li>Yazma alanlarındaki yazı tipi ve boyutu okunaklı olmalıdır.</li>
                            <li>Boşlukların uzunluğu, beklenen cevaba uygun olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.4.5.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Renkler, içerik ve işlevselliği destekleyecek nitelikte olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Renkler arasında yeterli kontrast sağlanmalıdır.</li>
                            <li>Renkler, içerik ve işlev açısından uyumlu ve anlamlı bir şekilde kullanılmalıdır.</li>
                            <li>Renk paletleri ve kontrastları uluslararası erişilebilirlik ölçütlerine uygun olmalıdır.</li>
                            <li>Renk paleti, arayüzdeki bilgilerin anlaşılmasını kolaylaştıracak şekilde planlanmalıdır.</li>
                            <li>Seçilen renk tonları, göz yormayan, rahat ve kullanıcı dostu olmalıdır.</li>
                            <li>İçeriğe uygun, öğrenmeyi destekleyici, görsel algı açısından uyumlu, bilgi akışına katkı sunan ve ilgi çekici renkler tercih edilmelidir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">8.5. Ses ve Görüntü Kalitesi</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.5.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Ses ile içerik uyumlu olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Ses ve görüntü birbirine eş zamanlı (senkronize) olmalıdır.</li>
                            <li>Tonlamanın oluşturduğu algı içerikle uyumlu olmalıdır.</li>
                            <li>Ses rengi ve sesler, içeriğin yazılı ve görsel ögeleriyle uyumlu olmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.5.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Sesler net ve anlaşılır olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Sesler profesyonel kalitede olmalıdır.</li>
                            <li>Dikkat dağıtıcı arka plan sesleri olmamalıdır.</li>
                            <li>Sesler bozulma olmayacak şekilde uygun ses hacmi ve kalitesinde olmalıdır.</li>
                            <li>Sesler net, dip gürültüsüz, akıcı (kesintiye uğramadan) olmalıdır.</li>
                            <li>Seçilen işitsel efektler içeriğe uygun ve dikkat dağıtmayacak bir ses hacmi ile verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.5.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Video ve görseller net, yüksek çözünürlük ve kalitede olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Video ve fotoğraflarda yeterli ve uygun ışıklandırma kullanılmalıdır.</li>
                            <li>Video ve fotoğraf çekimleri doğru şekilde çerçevelenmeli ve önemli detaylar odak noktası olmalıdır.</li>
                            <li>Farklı çekim ölçekleri (yakın plan, genel plan vb.) ve açılar kullanılarak görsel çeşitlilik sağlanmalıdır.</li>
                            <li>Video ve görseller estetik ve dengeli bir kompozisyona sahip olmalıdır.</li>
                            <li>Video ve görsellerin görsel etkinliği ve bütünlüğü olmalı, görüntü estetiği sağlanmalıdır.</li>
                            <li>Karakterler, dokular vb. yapıların detayları doğru bir biçimde verilmelidir.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.5.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Video akışı ve geçişler sorunsuz olmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Videoların akış boyutu, bit oranı, bit yoğunluğu ve kare hızı uygun ve hatasız olmalıdır.</li>
                            <li>Farklı görüntüler arasındaki geçişler dikkat dağıtıcı nitelikte olmamalıdır.</li>
                            <li>Videolar akıcı olmalı, kesintiye uğramamalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.5.5.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Sesli anlatım bulunan video içerikler için alt yazı hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Alt yazılar ortamın desteklediği formatta hazırlanmalı ve sesli içerikle bire bir örtüşmelidir.</li>
                            <li>Ses ile alt yazı eş zamanlı (senkronize) olmalıdır.</li>
                            <li>Öğretim programlarındaki dinleme becerisinin geliştirilmesine yönelik hazırlanan içerikler için alt yazı hazırlanmayabilir.</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="subsection">
                <h3 class="subsection-title">8.6. Güvenlik, Güncellik ve Uyumluluk</h3>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.6.1.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler zararlı yazılımlar içermemelidir.</p>
                        <ul class="criterion-details">
                            <li>Virüs, truva atı, solucan ve benzeri nitelikte zararlı unsurlar içermemeli ve bu nitelikteki üçüncü tür uygulama veya web sayfalarına yönlendirme yapmamalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.6.2.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler sunulduğu ortama ve duyarlı tasarım ilkelerine uygun şekilde hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>E-içerikler bilişim teknolojileri cihazlarının (mobil-masaüstü) farklı ekran boyutları, çözünürlükleri ve özelliklerine uygun, bunlarla uyumlu, kullanışlı ve işlevsel fark olmayacak şekilde hazırlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.6.3.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içerikler güncel teknolojilere ve standartlara uygun olarak geliştirilmelidir.</p>
                        <ul class="criterion-details">
                            <li>İçerikler güvenlik açıkları ve sınırlamalarla karşılaşılmaması için güncel çoklu platformlarda, farklı işletim sistemleri ve cihazlarda çalışabilecek yapıda ve güncel geliştirme ortamları, araç ve kütüphaneleri ile hazırlanmalıdır.</li>
                            <li>E-içerikler uluslararası açık kaynaklı e-içerik standart ve belirtimlerine uygun olarak hazırlanmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.6.4.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">E-içeriklerde Türkçe karakter setleri kullanılmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Türkçe karakterlerin kodlanmasında Windows 1254, UTF 8 ve ISO 8859-9 karakter kümeleri kullanılmalıdır.</li>
                            <li>Yabancı diller, yaşayan diller ve lehçeler için hazırlanan eğitim araçlarında o dile uygun karakter seti kullanılmalıdır.</li>
                        </ul>
                    </div>
                </div>
                
                <div class="criterion">
                    <h4 class="criterion-number">8.6.5.</h4>
                    <div class="criterion-content">
                        <p class="criterion-text">Sanal gerçeklik ve artırılmış gerçeklik uygulamaları standartlara uygun olarak hazırlanmalıdır.</p>
                        <ul class="criterion-details">
                            <li>Sanal gerçeklik ve artırılmış gerçeklik cihazlarının web tarayıcısı desteği olmalıdır.</li>
                            <li>Sanal gerçeklik uygulamaları güncel sanal gerçeklik başlıklarıyla uyumlu olmalıdır.</li>
                            <li>Sanal gerçeklik deneyimi için gerekli olan asgari sistem gereksinimleri (işlemci, RAM, grafik kartı vb.) belirtilmelidir.</li>
                            <li>Sanal gerçeklik uygulamaları düşük gecikme süresi ile kesintisiz bir deneyim sunmalıdır.</li>
                            <li>Artırılmış gerçeklik uygulamaları mobil cihazlar ve artırılmış gerçeklik gözlükleri ile uyumlu olmalıdır.</li>
                            <li>Artırılmış gerçeklik uygulamaları, gerçek zamanlı izleme ve nesne tanıma özelliklerini desteklemelidir.</li>
                            <li>Artırılmış gerçeklik uygulamalarında kullanılan işaretleyiciler yüksek tanıma oranına sahip olmalıdır.</li>
                            <li>İşaretleyiciler çeşitli yüzeylerde ve ışık koşullarında doğru şekilde çalışmalıdır.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    // Insert before footer
    const footer = document.querySelector('.footer');
    footer.insertAdjacentHTML('beforebegin', remainingSections);
    
    // Update criterion structure for existing content
    updateCriterionStructure();
}

// Update criterion structure for existing content
function updateCriterionStructure() {
    const existingCriteria = document.querySelectorAll('#anayasa .criterion');
    existingCriteria.forEach(criterion => {
        const number = criterion.querySelector('h4');
        const text = criterion.querySelector('p');
        const details = criterion.querySelector('ul');
        
        if (number && text) {
            // Create new structure
            const content = document.createElement('div');
            content.className = 'criterion-content';
            
            // Move text and details to content div
            text.className = 'criterion-text';
            content.appendChild(text);
            
            if (details) {
                details.className = 'criterion-details';
                content.appendChild(details);
            }
            
            // Update number class
            number.className = 'criterion-number';
            
            // Clear criterion and add new structure
            criterion.innerHTML = '';
            criterion.appendChild(number);
            criterion.appendChild(content);
        }
    });
}

// Initialize search functionality
function initializeSearch() {
    // Build search index
    buildSearchIndex();
    
    // Search input event listeners
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim().length >= 2) {
            showSearchResults();
        }
    });
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
    
    // Keyboard navigation for search results
    searchInput.addEventListener('keydown', handleSearchKeyboard);
}

// Build search index from content - Düzeltildi
function buildSearchIndex() {
    // Wait for content to be added
    setTimeout(() => {
        const sections = document.querySelectorAll('.content-section');
        searchData = [];
        
        sections.forEach(section => {
            const sectionId = section.id;
            const sectionTitle = section.querySelector('.section-title')?.textContent || '';
            
            // Add section title to search data
            if (sectionTitle) {
                searchData.push({
                    type: 'section',
                    title: sectionTitle,
                    content: sectionTitle,
                    element: section,
                    id: sectionId
                });
            }
            
            // Add subsections
            const subsections = section.querySelectorAll('.subsection-title');
            subsections.forEach(subsection => {
                searchData.push({
                    type: 'subsection',
                    title: `${sectionTitle} - ${subsection.textContent}`,
                    content: subsection.textContent,
                    element: subsection.closest('.subsection'),
                    id: sectionId
                });
            });
            
            // Add criteria
            const criteria = section.querySelectorAll('.criterion');
            criteria.forEach(criterion => {
                const criterionNumber = criterion.querySelector('.criterion-number')?.textContent || '';
                const criterionText = criterion.querySelector('.criterion-text')?.textContent || '';
                const listItems = Array.from(criterion.querySelectorAll('.criterion-details li')).map(li => li.textContent).join(' ');
                
                if (criterionNumber || criterionText) {
                    searchData.push({
                        type: 'criterion',
                        title: `${sectionTitle} - ${criterionNumber}`,
                        content: `${criterionText} ${listItems}`,
                        element: criterion,
                        id: sectionId
                    });
                }
            });
            
            // Add definitions
            const definitions = section.querySelectorAll('.definition-item');
            definitions.forEach(definition => {
                const defTitle = definition.querySelector('h3')?.textContent || '';
                const defContent = definition.querySelector('p')?.textContent || '';
                
                if (defTitle) {
                    searchData.push({
                        type: 'definition',
                        title: defTitle,
                        content: `${defTitle} ${defContent}`,
                        element: definition,
                        id: sectionId
                    });
                }
            });
        });
        
        console.log('Search index built with', searchData.length, 'items');
    }, 100);
}

// Handle search input - Düzeltildi
function handleSearch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    currentSearchTerm = searchTerm;
    
    // Clear button visibility
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    }
    
    if (searchTerm.length < 2) {
        hideSearchResults();
        clearHighlights();
        showAllContent();
        return;
    }
    
    // Hide dropdown search results - artık açılır menü yok
    hideSearchResults();
    
    // Perform real-time search - doğrudan ekranda göster
    performRealTimeSearch(searchTerm);
}

// Perform real-time search in content - Düzeltildi
function performRealTimeSearch(searchTerm) {
    clearHighlights();
    
    if (!searchTerm) {
        showAllContent();
        return;
    }
    
    const allSections = document.querySelectorAll('.content-section');
    const allSubsections = document.querySelectorAll('.subsection');
    const allCriteria = document.querySelectorAll('.criterion');
    const allDefinitions = document.querySelectorAll('.definition-item');
    
    let hasVisibleContent = false;
    
    // Hide all content initially
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    allSubsections.forEach(sub => sub.style.display = 'none');
    allCriteria.forEach(crit => crit.style.display = 'none');
    allDefinitions.forEach(def => def.style.display = 'none');
    
    // Search and highlight in all text content
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    
    // Search in criteria
    allCriteria.forEach(criterion => {
        const textElements = criterion.querySelectorAll('.criterion-text, .criterion-details li, .criterion-number');
        let hasMatch = false;
        
        textElements.forEach(element => {
            const originalText = element.textContent;
            if (originalText.toLowerCase().includes(searchTerm)) {
                hasMatch = true;
                // Highlight the search term
                const highlightedHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                element.innerHTML = highlightedHTML;
            }
        });
        
        if (hasMatch) {
            criterion.style.display = 'flex';
            const subsection = criterion.closest('.subsection');
            const section = criterion.closest('.content-section');
            if (subsection) subsection.style.display = 'block';
            if (section) section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // Search in definitions
    allDefinitions.forEach(definition => {
        const title = definition.querySelector('h3');
        const content = definition.querySelector('p');
        let hasMatch = false;
        
        if (title && title.textContent.toLowerCase().includes(searchTerm)) {
            hasMatch = true;
            title.innerHTML = title.textContent.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        if (content && content.textContent.toLowerCase().includes(searchTerm)) {
            hasMatch = true;
            content.innerHTML = content.textContent.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        if (hasMatch) {
            definition.style.display = 'block';
            const section = definition.closest('.content-section');
            if (section) section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // Search in section titles
    allSections.forEach(section => {
        const title = section.querySelector('.section-title');
        const intro = section.querySelector('.section-intro');
        
        if (title && title.textContent.toLowerCase().includes(searchTerm)) {
            title.innerHTML = title.textContent.replace(regex, '<span class="search-highlight">$1</span>');
            section.style.display = 'block';
            hasVisibleContent = true;
        }
        
        if (intro && intro.textContent.toLowerCase().includes(searchTerm)) {
            intro.innerHTML = intro.textContent.replace(regex, '<span class="search-highlight">$1</span>');
            section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // Search in subsection titles
    allSubsections.forEach(subsection => {
        const title = subsection.querySelector('.subsection-title');
        
        if (title && title.textContent.toLowerCase().includes(searchTerm)) {
            title.innerHTML = title.textContent.replace(regex, '<span class="search-highlight">$1</span>');
            subsection.style.display = 'block';
            const section = subsection.closest('.content-section');
            if (section) section.style.display = 'block';
            hasVisibleContent = true;
        }
    });
    
    // If no content is visible, show a message
    if (!hasVisibleContent) {
        showNoResultsMessage();
    }
}

// Clear all highlights
function clearHighlights() {
    const highlighted = document.querySelectorAll('.search-highlight');
    highlighted.forEach(element => {
        const parent = element.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(element.textContent), element);
            parent.normalize();
        }
    });
}

// Show all content
function showAllContent() {
    const allSections = document.querySelectorAll('.content-section');
    const allSubsections = document.querySelectorAll('.subsection');
    const allCriteria = document.querySelectorAll('.criterion');
    const allDefinitions = document.querySelectorAll('.definition-item');
    
    allSections.forEach(section => section.style.display = 'block');
    allSubsections.forEach(sub => sub.style.display = 'block');
    allCriteria.forEach(crit => crit.style.display = 'flex');
    allDefinitions.forEach(def => def.style.display = 'block');
    
    // Remove no results message if exists
    const noResultsMsg = document.querySelector('.no-results-message');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Show no results message
function showNoResultsMessage() {
    const content = document.querySelector('.content');
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-message';
        noResultsMsg.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 0.5rem;">Sonuç bulunamadı</h3>
                <p>"${currentSearchTerm}" için herhangi bir sonuç bulunamadı.</p>
            </div>
        `;
        content.appendChild(noResultsMsg);
    }
}

// Display search results dropdown - Düzeltildi
function displaySearchResults(results, searchTerm) {
    if (!searchResults) return;
    
    // Remove any existing no-results message from main content
    const noResultsMsg = document.querySelector('.no-results-message');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
    
    // Show all content when displaying search results
    showAllContent();
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-title">Sonuç bulunamadı</div></div>';
        showSearchResults();
        return;
    }
    
    const resultsHTML = results.map(result => {
        const highlightedTitle = highlightText(result.title, searchTerm);
        const highlightedContent = highlightText(
            result.content.substring(0, 120) + (result.content.length > 120 ? '...' : ''),
            searchTerm
        );
        
        return `
            <div class="search-result-item" data-section="${result.id}">
                <div class="search-result-title">${highlightedTitle}</div>
                <div class="search-result-content">${highlightedContent}</div>
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = resultsHTML;
    
    // Add click listeners to search results
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            navigateToSection(sectionId);
            hideSearchResults();
        });
    });
    
    showSearchResults();
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Show search results
function showSearchResults() {
    if (searchResults && searchResults.innerHTML.trim()) {
        searchResults.style.display = 'block';
    }
}

// Hide search results
function hideSearchResults() {
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    currentSearchTerm = '';
    hideSearchResults();
    clearHighlights();
    showAllContent();
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Remove no results message if exists
    const noResultsMsg = document.querySelector('.no-results-message');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
    
    searchInput.focus();
}

// Handle keyboard navigation in search
function handleSearchKeyboard(e) {
    if (!searchResults) return;
    
    const items = searchResults.querySelectorAll('.search-result-item');
    const activeItem = searchResults.querySelector('.search-result-item.active');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!activeItem) {
            items[0]?.classList.add('active');
        } else {
            activeItem.classList.remove('active');
            const nextItem = activeItem.nextElementSibling || items[0];
            nextItem.classList.add('active');
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!activeItem) {
            items[items.length - 1]?.classList.add('active');
        } else {
            activeItem.classList.remove('active');
            const prevItem = activeItem.previousElementSibling || items[items.length - 1];
            prevItem.classList.add('active');
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeItem) {
            activeItem.click();
        }
    } else if (e.key === 'Escape') {
        hideSearchResults();
    }
}

// Initialize navigation
function initializeNavigation() {
    // Add click listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            
            // Clear search when navigating - arama temizle
            clearSearch();
            
            navigateToSection(sectionId);
            updateActiveNavLink(this);
            
            // Close mobile menu if open
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.remove('open');
        });
    });
    
    // Update active navigation on scroll
    window.addEventListener('scroll', updateActiveNavOnScroll);
}

// Navigate to section
function navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const offset = headerHeight + 20;
        
        const sectionTop = section.offsetTop - offset;
        
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// Update active navigation link
function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Update active navigation on scroll
function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('.content-section');
    const headerHeight = document.querySelector('.header').offsetHeight;
    const offset = headerHeight + 100;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - offset;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.id;
        }
    });
    
    if (currentSection) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize smooth scrolling
function initializeSmoothScrolling() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            navigateToSection(targetId);
        });
    });
}

// Add back to top functionality
function addBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide back to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    document.body.appendChild(backToTopBtn);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + P for print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        clearSearch();
    }
});

