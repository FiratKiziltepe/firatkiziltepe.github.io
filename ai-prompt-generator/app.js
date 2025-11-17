// AI Prompt Generator - Main Application
// ==========================================

// Application State
const AppState = {
    currentCategory: null,
    currentFormData: {},
    generatedPrompt: '',
    history: [],
    userTemplates: []
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadFromLocalStorage();
    setupEventListeners();
    console.log('AI Prompt Generator initialized');
}

// ==========================================
// CATEGORY DEFINITIONS
// ==========================================

const Categories = {
    image: {
        name: 'Görsel Oluşturma',
        icon: 'fa-image',
        fields: [
            {
                id: 'subject',
                label: 'Ana Konu/Obje',
                type: 'text',
                required: true,
                placeholder: 'Örn: Bir uzay gemisi, fantastik bir orman',
                help: 'Görselde ne olmasını istiyorsunuz?'
            },
            {
                id: 'style',
                label: 'Sanat Stili',
                type: 'select',
                required: true,
                options: ['Fotorealistik', 'Dijital Sanat', 'Yağlı Boya', 'Suluboya', 'Anime/Manga', 'Minimalist', 'Sürrealist', 'Soyut', 'Pixel Art', '3D Render'],
                help: 'Görselin sanatsal tarzı'
            },
            {
                id: 'mood',
                label: 'Atmosfer/Ruh Hali',
                type: 'text',
                required: false,
                placeholder: 'Örn: Huzurlu, karanlık, enerjik, gizemli',
                help: 'Görselin genel havası'
            },
            {
                id: 'colors',
                label: 'Renk Paleti',
                type: 'text',
                required: false,
                placeholder: 'Örn: Pastel tonlar, canlı renkler, siyah-beyaz',
                help: 'Tercih edilen renkler veya renk şeması'
            },
            {
                id: 'lighting',
                label: 'Işıklandırma',
                type: 'select',
                required: false,
                options: ['', 'Gün Işığı', 'Gün Batımı', 'Gece', 'Neon Işıklar', 'Mum Işığı', 'Dramatik Işık', 'Yumuşak Işık', 'Arka Işık'],
                help: 'Işık efektleri'
            },
            {
                id: 'perspective',
                label: 'Bakış Açısı',
                type: 'select',
                required: false,
                options: ['', 'Göz Hizası', 'Kuş Bakışı', 'Solucan Bakışı', 'Yakın Çekim', 'Geniş Açı', 'Panoramik'],
                help: 'Kamera veya görüş açısı'
            },
            {
                id: 'details',
                label: 'Ek Detaylar',
                type: 'textarea',
                required: false,
                placeholder: 'Eklemek istediğiniz diğer özellikler, objeler veya detaylar',
                help: 'Görseli zenginleştirecek ek bilgiler'
            },
            {
                id: 'exclude',
                label: 'İstenmeyen Öğeler',
                type: 'text',
                required: false,
                placeholder: 'Örn: Metin, bulanıklık, insanlar',
                help: 'Görselde olmamasını istediğiniz şeyler'
            }
        ]
    },

    video: {
        name: 'JSON Video',
        icon: 'fa-video',
        fields: [
            {
                id: 'title',
                label: 'Video Başlığı',
                type: 'text',
                required: true,
                placeholder: 'Video başlığını girin',
                help: 'Videonun ana başlığı'
            },
            {
                id: 'duration',
                label: 'Video Süresi',
                type: 'select',
                required: true,
                options: ['15 saniye', '30 saniye', '60 saniye', '2 dakika', '5 dakika', '10 dakika'],
                help: 'Toplam video uzunluğu'
            },
            {
                id: 'target_audience',
                label: 'Hedef Kitle',
                type: 'text',
                required: true,
                placeholder: 'Örn: Gençler, profesyoneller, aileler',
                help: 'Video kimin için hazırlanıyor?'
            },
            {
                id: 'purpose',
                label: 'Video Amacı',
                type: 'select',
                required: true,
                options: ['Eğitim', 'Tanıtım', 'Eğlence', 'Bilgilendirme', 'Pazarlama', 'Hikaye Anlatımı'],
                help: 'Videonun temel amacı'
            },
            {
                id: 'scenes',
                label: 'Sahneler',
                type: 'multi',
                required: true,
                placeholder: 'Sahne açıklaması (Örn: "Açılış - Logo animasyonu")',
                help: 'Her sahne için ayrı bir satır ekleyin'
            },
            {
                id: 'voiceover',
                label: 'Seslendirme Metni',
                type: 'textarea',
                required: false,
                placeholder: 'Videoda okunacak metin',
                help: 'Varsa seslendirme metni'
            },
            {
                id: 'music_style',
                label: 'Müzik Tarzı',
                type: 'text',
                required: false,
                placeholder: 'Örn: Enerjik, sakin, epik',
                help: 'Arka plan müziği tarzı'
            },
            {
                id: 'transitions',
                label: 'Geçiş Efektleri',
                type: 'text',
                required: false,
                placeholder: 'Örn: Fade, slide, zoom',
                help: 'Sahneler arası geçişler'
            },
            {
                id: 'branding',
                label: 'Marka Öğeleri',
                type: 'textarea',
                required: false,
                placeholder: 'Logo, renk şeması, slogan vb.',
                help: 'Markaya özel öğeler'
            }
        ]
    },

    summary: {
        name: 'Makale Özetleme',
        icon: 'fa-file-alt',
        fields: [
            {
                id: 'article_title',
                label: 'Makale Başlığı',
                type: 'text',
                required: true,
                placeholder: 'Özetlenecek makalenin başlığı',
                help: 'Tam makale başlığı'
            },
            {
                id: 'article_type',
                label: 'Makale Türü',
                type: 'select',
                required: true,
                options: ['Nicel Araştırma', 'Nitel Araştırma', 'Karma Yöntem', 'Derleme', 'Meta-Analiz', 'Vaka Çalışması', 'Teorik Makale'],
                help: 'Makalenin araştırma türü'
            },
            {
                id: 'research_field',
                label: 'Araştırma Alanı',
                type: 'text',
                required: true,
                placeholder: 'Örn: Psikoloji, Eğitim, Tıp, Sosyoloji',
                help: 'Makalenin bilim dalı'
            },
            {
                id: 'research_question',
                label: 'Araştırma Sorusu/Hipotez',
                type: 'textarea',
                required: true,
                placeholder: 'Makalenin araştırma sorusu veya hipotezini girin',
                help: 'Çalışmanın temel sorusu'
            },
            {
                id: 'sample_size',
                label: 'Örneklem Büyüklüğü',
                type: 'text',
                required: false,
                placeholder: 'Örn: N=150',
                help: 'Katılımcı veya örneklem sayısı'
            },
            {
                id: 'methodology',
                label: 'Metodoloji Detayları',
                type: 'textarea',
                required: true,
                placeholder: 'Araştırma tasarımı, veri toplama araçları, analiz teknikleri',
                help: 'Çalışmanın yöntemsel detayları'
            },
            {
                id: 'statistical_tests',
                label: 'İstatistiksel Testler',
                type: 'text',
                required: false,
                placeholder: 'Örn: t-testi, ANOVA, regresyon analizi',
                help: 'Kullanılan istatistiksel yöntemler'
            },
            {
                id: 'key_findings',
                label: 'Ana Bulgular',
                type: 'textarea',
                required: true,
                placeholder: 'Araştırmanın en önemli bulguları',
                help: 'Elde edilen ana sonuçlar'
            },
            {
                id: 'limitations',
                label: 'Sınırlılıklar',
                type: 'textarea',
                required: false,
                placeholder: 'Çalışmanın sınırlılıkları',
                help: 'Araştırmanın kısıtları ve zayıf yönleri'
            },
            {
                id: 'future_research',
                label: 'Gelecek Araştırma Önerileri',
                type: 'textarea',
                required: false,
                placeholder: 'Gelecek çalışmalar için öneriler',
                help: 'Bu çalışmadan yola çıkarak yapılabilecek araştırmalar'
            },
            {
                id: 'practical_implications',
                label: 'Pratik Uygulamalar',
                type: 'textarea',
                required: false,
                placeholder: 'Bulguların pratiğe nasıl uygulanabileceği',
                help: 'Gerçek hayatta nasıl kullanılabilir?'
            }
        ]
    },

    report: {
        name: 'Rapor Yazma',
        icon: 'fa-chart-bar',
        fields: [
            {
                id: 'report_title',
                label: 'Rapor Başlığı',
                type: 'text',
                required: true,
                placeholder: 'Rapor başlığını girin',
                help: 'Raporun ana başlığı'
            },
            {
                id: 'report_type',
                label: 'Rapor Türü',
                type: 'select',
                required: true,
                options: ['İş Raporu', 'Proje Raporu', 'Performans Raporu', 'Durum Raporu', 'Analiz Raporu', 'Değerlendirme Raporu', 'Teknik Rapor'],
                help: 'Raporun kategorisi'
            },
            {
                id: 'target_audience_report',
                label: 'Hedef Kitle',
                type: 'text',
                required: true,
                placeholder: 'Örn: Üst yönetim, proje ekibi, müşteriler',
                help: 'Rapor kime sunulacak?'
            },
            {
                id: 'executive_summary',
                label: 'Yönetici Özeti',
                type: 'textarea',
                required: true,
                placeholder: 'Raporun kısa özeti (ana noktalar)',
                help: 'Raporun önemli noktalarının özeti'
            },
            {
                id: 'background',
                label: 'Arka Plan/Bağlam',
                type: 'textarea',
                required: true,
                placeholder: 'Raporun hazırlanma nedeni ve bağlamı',
                help: 'Neden bu rapor hazırlandı?'
            },
            {
                id: 'objectives',
                label: 'Amaç ve Hedefler',
                type: 'multi',
                required: true,
                placeholder: 'Bir amaç girin',
                help: 'Raporun hedefleri'
            },
            {
                id: 'methodology_report',
                label: 'Metodoloji/Yaklaşım',
                type: 'textarea',
                required: false,
                placeholder: 'Veri toplama ve analiz yöntemleri',
                help: 'Nasıl bir yöntem kullanıldı?'
            },
            {
                id: 'key_data',
                label: 'Ana Veriler/Bulgular',
                type: 'textarea',
                required: true,
                placeholder: 'Önemli veriler, istatistikler ve bulgular',
                help: 'Temel veriler ve bulgular'
            },
            {
                id: 'analysis',
                label: 'Analiz ve Yorumlama',
                type: 'textarea',
                required: true,
                placeholder: 'Verilerin analizi ve yorumlanması',
                help: 'Bulgular ne anlama geliyor?'
            },
            {
                id: 'recommendations',
                label: 'Öneriler',
                type: 'multi',
                required: true,
                placeholder: 'Bir öneri girin',
                help: 'Eylem önerileri'
            },
            {
                id: 'conclusion',
                label: 'Sonuç',
                type: 'textarea',
                required: true,
                placeholder: 'Rapor sonucu',
                help: 'Genel değerlendirme ve sonuç'
            },
            {
                id: 'tone',
                label: 'Üslup',
                type: 'select',
                required: false,
                options: ['', 'Resmi', 'Yarı-Resmi', 'Teknik', 'Açıklayıcı', 'İkna Edici'],
                help: 'Raporun dil ve üslubu'
            }
        ]
    },

    lesson: {
        name: 'Ders Planı (5E Modeli)',
        icon: 'fa-chalkboard-teacher',
        fields: [
            {
                id: 'lesson_title',
                label: 'Ders Başlığı',
                type: 'text',
                required: true,
                placeholder: 'Ders konusu',
                help: 'Dersin ana konusu'
            },
            {
                id: 'grade_level',
                label: 'Sınıf Seviyesi',
                type: 'select',
                required: true,
                options: ['İlkokul 1-2', 'İlkokul 3-4', 'Ortaokul 5-6', 'Ortaokul 7-8', 'Lise 9-10', 'Lise 11-12', 'Üniversite', 'Yetişkin Eğitimi'],
                help: 'Hedef yaş grubu/seviye'
            },
            {
                id: 'subject_area',
                label: 'Ders Alanı',
                type: 'select',
                required: true,
                options: ['Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Türkçe', 'İngilizce', 'Müzik', 'Beden Eğitimi', 'Sanat', 'Teknoloji', 'Diğer'],
                help: 'Hangi ders?'
            },
            {
                id: 'duration',
                label: 'Ders Süresi',
                type: 'select',
                required: true,
                options: ['40 dakika', '50 dakika', '60 dakika', '90 dakika', '2 saat', '3 saat'],
                help: 'Toplam ders süresi'
            },
            {
                id: 'learning_objectives',
                label: 'Öğrenme Hedefleri',
                type: 'multi',
                required: true,
                placeholder: 'Bir öğrenme hedefi girin',
                help: 'Öğrencilerin dersin sonunda neler öğrenmiş olacağı'
            },
            {
                id: 'materials',
                label: 'Gerekli Materyaller',
                type: 'multi',
                required: true,
                placeholder: 'Bir materyal girin',
                help: 'Ders için gerekli araç-gereçler'
            },
            {
                id: 'engage',
                label: '1. ENGAGE (Dikkat Çekme/Giriş)',
                type: 'textarea',
                required: true,
                placeholder: 'Öğrencilerin ilgisini çekmek için neler yapılacak? (5-10 dakika)',
                help: 'Dikkat çekici aktivite, soru veya senaryo',
                className: 'five-e-section'
            },
            {
                id: 'explore',
                label: '2. EXPLORE (Keşfetme)',
                type: 'textarea',
                required: true,
                placeholder: 'Öğrenciler konuyu nasıl keşfedecek? Hangi aktiviteler yapılacak? (10-15 dakika)',
                help: 'Öğrencilerin kendi başlarına deneyim kazanması',
                className: 'five-e-section'
            },
            {
                id: 'explain',
                label: '3. EXPLAIN (Açıklama)',
                type: 'textarea',
                required: true,
                placeholder: 'Öğretmen kavramları nasıl açıklayacak? (10-15 dakika)',
                help: 'Kavramların net açıklaması ve bilimsel terminoloji',
                className: 'five-e-section'
            },
            {
                id: 'elaborate',
                label: '4. ELABORATE (Derinleştirme)',
                type: 'textarea',
                required: true,
                placeholder: 'Öğrenilenleri pekiştirmek ve derinleştirmek için aktiviteler (10-15 dakika)',
                help: 'Bilgilerin uygulanması ve genişletilmesi',
                className: 'five-e-section'
            },
            {
                id: 'evaluate',
                label: '5. EVALUATE (Değerlendirme)',
                type: 'textarea',
                required: true,
                placeholder: 'Öğrenme nasıl değerlendirilecek? (5-10 dakika)',
                help: 'Değerlendirme yöntemleri ve araçları',
                className: 'five-e-section'
            },
            {
                id: 'differentiation',
                label: 'Farklılaştırma Stratejileri',
                type: 'textarea',
                required: false,
                placeholder: 'Farklı öğrenme ihtiyaçları için uyarlamalar',
                help: 'Özel ihtiyaçlara yönelik düzenlemeler'
            },
            {
                id: 'homework',
                label: 'Ev Ödevi/Uzantı Aktiviteleri',
                type: 'textarea',
                required: false,
                placeholder: 'Ders sonrası yapılacak çalışmalar',
                help: 'İsteğe bağlı ödev veya ek aktiviteler'
            }
        ]
    },

    html: {
        name: 'Etkileşimli HTML İçerik',
        icon: 'fa-code',
        fields: [
            {
                id: 'content_title',
                label: 'İçerik Başlığı',
                type: 'text',
                required: true,
                placeholder: 'HTML içeriğinin başlığı',
                help: 'İçeriğin ana başlığı'
            },
            {
                id: 'content_type',
                label: 'İçerik Türü',
                type: 'select',
                required: true,
                options: ['Quiz/Test', 'İnteraktif Sunum', 'Oyun', 'Simülasyon', 'Form/Anket', 'Animasyon', 'Veri Görselleştirme', 'Eğitim Modülü'],
                help: 'Ne tür bir HTML içeriği?'
            },
            {
                id: 'target_platform',
                label: 'Hedef Platform',
                type: 'select',
                required: true,
                options: ['Web Tarayıcı (Desktop)', 'Mobil (Responsive)', 'Tablet', 'Tümü (Responsive)'],
                help: 'Hangi cihazlarda çalışacak?'
            },
            {
                id: 'features',
                label: 'Özellikler',
                type: 'multi',
                required: true,
                placeholder: 'Bir özellik girin (Örn: "Puan sistemi", "Geri bildirim")',
                help: 'İçerikte olması gereken özellikler'
            },
            {
                id: 'interactivity',
                label: 'Etkileşim Türleri',
                type: 'multi',
                required: true,
                placeholder: 'Örn: "Tıklama", "Sürükle-bırak", "Form doldurma"',
                help: 'Kullanıcı nasıl etkileşimde bulunacak?'
            },
            {
                id: 'content_description',
                label: 'İçerik Açıklaması',
                type: 'textarea',
                required: true,
                placeholder: 'İçeriğin detaylı açıklaması',
                help: 'Ne hakkında ve nasıl çalışacak?'
            },
            {
                id: 'design_style',
                label: 'Tasarım Stili',
                type: 'select',
                required: false,
                options: ['', 'Modern/Minimalist', 'Renkli/Canlı', 'Profesyonel', 'Eğlenceli/Çocuk Dostu', 'Karanlık Tema', 'Materyal Design'],
                help: 'Görsel stil tercihi'
            },
            {
                id: 'colors_html',
                label: 'Renk Şeması',
                type: 'text',
                required: false,
                placeholder: 'Örn: Mavi ve beyaz tonları',
                help: 'Tercih edilen renkler'
            },
            {
                id: 'technologies',
                label: 'Tercih Edilen Teknolojiler',
                type: 'text',
                required: false,
                placeholder: 'Örn: Vanilla JS, React, Vue, Bootstrap, Tailwind',
                help: 'Kullanılmasını istediğiniz teknolojiler'
            },
            {
                id: 'accessibility',
                label: 'Erişilebilirlik Gereksinimleri',
                type: 'textarea',
                required: false,
                placeholder: 'WCAG uyumluluğu, klavye navigasyonu, ekran okuyucu desteği vb.',
                help: 'Erişilebilirlik standartları'
            }
        ]
    },

    other: {
        name: 'Diğer (Çeşitli İçerikler)',
        icon: 'fa-ellipsis-h',
        fields: [
            {
                id: 'content_category',
                label: 'İçerik Kategorisi',
                type: 'select',
                required: true,
                options: ['Sosyal Medya Gönderisi', 'E-posta', 'Blog Yazısı', 'Hikaye/Senaryo', 'Kod Dokümantasyonu', 'Veri Analizi', 'Pazarlama Metni', 'Ürün Açıklaması', 'Basın Bülteni', 'İş Teklifi'],
                help: 'Hangi tür içerik üretilecek?'
            },
            {
                id: 'other_title',
                label: 'İçerik Başlığı/Konusu',
                type: 'text',
                required: true,
                placeholder: 'İçeriğin başlığı veya konusu',
                help: 'Ne hakkında?'
            },
            {
                id: 'target_audience_other',
                label: 'Hedef Kitle',
                type: 'text',
                required: true,
                placeholder: 'Örn: Gençler, profesyoneller, müşteriler',
                help: 'İçerik kime yönelik?'
            },
            {
                id: 'purpose_other',
                label: 'Amaç',
                type: 'textarea',
                required: true,
                placeholder: 'İçeriğin amacı nedir?',
                help: 'Bu içerikle ne başarmak istiyorsunuz?'
            },
            {
                id: 'tone_other',
                label: 'Üslup/Ton',
                type: 'select',
                required: true,
                options: ['Resmi', 'Dostça', 'Profesyonel', 'Eğlenceli', 'Motive Edici', 'Bilgilendirici', 'İkna Edici', 'Duygusal'],
                help: 'İçeriğin dili ve üslubu'
            },
            {
                id: 'key_messages',
                label: 'Ana Mesajlar',
                type: 'multi',
                required: true,
                placeholder: 'Bir ana mesaj girin',
                help: 'İletmek istediğiniz temel mesajlar'
            },
            {
                id: 'length_other',
                label: 'İçerik Uzunluğu',
                type: 'select',
                required: false,
                options: ['', 'Kısa (100-300 kelime)', 'Orta (300-700 kelime)', 'Uzun (700-1500 kelime)', 'Çok Uzun (1500+ kelime)'],
                help: 'Hedef kelime sayısı'
            },
            {
                id: 'special_requirements',
                label: 'Özel Gereksinimler',
                type: 'textarea',
                required: false,
                placeholder: 'Ek gereksinimler, kısıtlamalar veya özel istekler',
                help: 'Diğer önemli detaylar'
            },
            {
                id: 'call_to_action',
                label: 'Harekete Geçirici Mesaj (CTA)',
                type: 'text',
                required: false,
                placeholder: 'Örn: "Hemen Kaydolun", "Daha Fazla Bilgi Alın"',
                help: 'İçeriğin sonunda kullanıcıyı ne yapmaya yönlendirmek istiyorsunuz?'
            },
            {
                id: 'additional_context',
                label: 'Ek Bağlam/Bilgi',
                type: 'textarea',
                required: false,
                placeholder: 'AI\'ın daha iyi içerik üretmesi için ek bilgiler',
                help: 'Yararlı olabilecek diğer bilgiler'
            }
        ]
    }
};

// ==========================================
// TEMPLATES
// ==========================================

const Templates = {
    image: [
        {
            name: 'Fotorealistik Portre',
            data: {
                subject: 'Bir kadın portresi',
                style: 'Fotorealistik',
                mood: 'Sakin ve düşünceli',
                colors: 'Doğal tonlar, yumuşak renkler',
                lighting: 'Yumuşak Işık',
                perspective: 'Yakın Çekim',
                details: 'Profesyonel stüdyo çekimi, net odak, doğal makyaj',
                exclude: 'Bulanıklık, aşırı filtreler'
            }
        },
        {
            name: 'Fantastik Manzara',
            data: {
                subject: 'Sihirli bir orman, ışıldayan ağaçlar',
                style: 'Dijital Sanat',
                mood: 'Gizemli ve büyülü',
                colors: 'Mor, mavi ve yeşil tonları',
                lighting: 'Neon Işıklar',
                perspective: 'Geniş Açı',
                details: 'Peri ışıkları, sihirli yaratıklar, mistik sis',
                exclude: 'Modern binalar, araçlar'
            }
        },
        {
            name: 'Minimalist Logo',
            data: {
                subject: 'Teknoloji şirketi logosu',
                style: 'Minimalist',
                mood: 'Modern ve profesyonel',
                colors: 'Mavi ve beyaz',
                lighting: 'Gün Işığı',
                perspective: 'Göz Hizası',
                details: 'Geometrik şekiller, basit çizgiler, temiz tasarım',
                exclude: 'Karmaşık detaylar, çok fazla renk'
            }
        },
        {
            name: 'Anime Karakter',
            data: {
                subject: 'Genç bir anime kahramanı',
                style: 'Anime/Manga',
                mood: 'Enerjik ve cesur',
                colors: 'Canlı ve parlak renkler',
                lighting: 'Gün Işığı',
                perspective: 'Göz Hizası',
                details: 'Büyük gözler, renkli saçlar, dinamik poz, detaylı kıyafet',
                exclude: 'Realistik özellikler'
            }
        }
    ],

    video: [
        {
            name: 'Ürün Tanıtım Videosu',
            data: {
                title: 'Yeni Ürün Lansmanı',
                duration: '60 saniye',
                target_audience: 'Genç profesyoneller',
                purpose: 'Tanıtım',
                scenes: ['Açılış animasyonu - Logo', 'Ürün özellikleri gösterimi', 'Kullanım senaryoları', 'Fiyat ve CTA'],
                voiceover: 'Hayatınızı kolaylaştıracak yeni ürünümüzle tanışın...',
                music_style: 'Enerjik ve modern',
                transitions: 'Smooth fade ve zoom',
                branding: 'Şirket logosu, marka renkleri'
            }
        },
        {
            name: 'Eğitim Videosu',
            data: {
                title: 'Python Programlamaya Giriş',
                duration: '5 dakika',
                target_audience: 'Yeni başlayanlar',
                purpose: 'Eğitim',
                scenes: ['Giriş - Konu tanıtımı', 'Temel kavramlar', 'Kod örnekleri', 'Pratik uygulama', 'Özet ve sonuç'],
                voiceover: 'Bugün Python programlamanın temellerini öğreneceğiz...',
                music_style: 'Sakin arka plan müziği',
                transitions: 'Basit kesme ve fade',
                branding: 'Eğitim platformu logosu'
            }
        },
        {
            name: 'Sosyal Medya Hikayesi',
            data: {
                title: 'Günün İlham Verici Sözü',
                duration: '15 saniye',
                target_audience: 'Sosyal medya takipçileri',
                purpose: 'Eğlence',
                scenes: ['Animasyonlu metin gösterimi', 'Görsel arka plan'],
                voiceover: '',
                music_style: 'Upbeat, pozitif',
                transitions: 'Hızlı kesme',
                branding: 'Sosyal medya hesap adı'
            }
        }
    ],

    summary: [
        {
            name: 'Psikoloji Araştırması',
            data: {
                article_title: 'Stresin Akademik Performans Üzerindeki Etkisi',
                article_type: 'Nicel Araştırma',
                research_field: 'Psikoloji',
                research_question: 'Üniversite öğrencilerinde stres düzeyi ile akademik başarı arasında anlamlı bir ilişki var mıdır?',
                sample_size: 'N=250',
                methodology: 'Kesitsel survey tasarımı, Algılanan Stres Ölçeği (PSS-10), GPA verileri, Pearson korelasyon analizi',
                statistical_tests: 't-testi, Pearson korelasyon, çoklu regresyon',
                key_findings: 'Yüksek stres düzeyi ile düşük GPA arasında negatif korelasyon (r=-0.42, p<0.001)',
                limitations: 'Öz-bildirim ölçekleri, tek bir üniversiteden örneklem',
                future_research: 'Boylamsal çalışmalar, müdahale programlarının etkisi',
                practical_implications: 'Kampüste stres yönetimi programları geliştirilmeli'
            }
        },
        {
            name: 'Tıp Vaka Çalışması',
            data: {
                article_title: 'Nadir Görülen Otoimmün Hastalık Vakası',
                article_type: 'Vaka Çalışması',
                research_field: 'Tıp',
                research_question: 'Atipik semptomlar gösteren otoimmün hastalık nasıl teşhis edildi?',
                sample_size: 'N=1 (vaka)',
                methodology: 'Klinik gözlem, laboratuvar testleri, görüntüleme yöntemleri, literatür taraması',
                statistical_tests: 'Tanımlayıcı istatistikler',
                key_findings: 'Erken teşhis ve tedavi ile tam iyileşme sağlandı',
                limitations: 'Tek vaka, genellenemez',
                future_research: 'Benzer vakaların derlenmesi',
                practical_implications: 'Atipik semptomlarda dikkatli değerlendirme gerekli'
            }
        },
        {
            name: 'Eğitim Meta-Analizi',
            data: {
                article_title: 'Çevrimiçi Öğrenmenin Etkililiği: Meta-Analiz',
                article_type: 'Meta-Analiz',
                research_field: 'Eğitim',
                research_question: 'Çevrimiçi öğrenme geleneksel yüz yüze öğrenme kadar etkili midir?',
                sample_size: '45 çalışma, toplam N=12,500',
                methodology: 'Sistematik literatür taraması, etki büyüklüğü hesaplama, heterojenlik analizi',
                statistical_tests: 'Cohen\'s d, Q istatistiği, I² indeksi',
                key_findings: 'Orta düzeyde pozitif etki (d=0.35), heterojenlik yüksek',
                limitations: 'Yayın yanlılığı olasılığı, çalışma kalitesi farklılıkları',
                future_research: 'Moderatör değişkenlerin incelenmesi',
                practical_implications: 'İyi tasarlanmış çevrimiçi kurslar etkili olabilir'
            }
        }
    ],

    report: [
        {
            name: 'Proje İlerleme Raporu',
            data: {
                report_title: 'Web Sitesi Yenileme Projesi - Aylık İlerleme',
                report_type: 'Proje Raporu',
                target_audience_report: 'Proje paydaşları',
                executive_summary: 'Proje %75 tamamlandı, bütçe dahilinde, planlanan zaman çizelgesine uygun',
                background: 'Şirket web sitesinin modernizasyonu projesi Ocak ayında başlatıldı',
                objectives: ['Modern ve responsive tasarım', 'Hız optimizasyonu', 'SEO iyileştirmesi'],
                methodology_report: 'Agile metodoloji, iki haftalık sprintler',
                key_data: 'Tamamlanan: Ana sayfa, ürün sayfaları, blog bölümü. Bekleyen: İletişim formu, admin paneli.',
                analysis: 'Proje genel olarak iyi gidiyor ancak admin paneli için ek kaynak gerekebilir',
                recommendations: ['Admin paneli için bir geliştirici daha ekle', 'Test sürecine daha fazla zaman ayır'],
                conclusion: 'Proje başarılı şekilde ilerliyor, belirlenen zaman ve bütçe dahilinde tamamlanacak',
                tone: 'Profesyonel'
            }
        },
        {
            name: 'Performans Değerlendirme',
            data: {
                report_title: 'Satış Ekibi Performans Raporu - Q2 2024',
                report_type: 'Performans Raporu',
                target_audience_report: 'Üst yönetim',
                executive_summary: 'Q2\'de satışlar %15 arttı, hedeflerin %102\'si gerçekleşti',
                background: 'İkinci çeyrek satış performansının değerlendirilmesi',
                objectives: ['Satış hedeflerini değerlendirmek', 'Ekip performansını analiz etmek', 'İyileştirme alanlarını belirlemek'],
                methodology_report: 'CRM verileri analizi, ekip anketleri, birebir görüşmeler',
                key_data: 'Toplam satış: 2.5M TL, Yeni müşteri: 45, Müşteri memnuniyeti: %92',
                analysis: 'Performans hedeflerin üzerinde ancak bazı ekip üyelerinin desteğe ihtiyacı var',
                recommendations: ['Düşük performanslı üyelere mentorluk', 'Başarılı üyelerin stratejilerini paylaşma', 'Ek eğitim programları'],
                conclusion: 'Genel olarak başarılı bir çeyrek, küçük iyileştirmelerle daha da artırılabilir',
                tone: 'Profesyonel'
            }
        },
        {
            name: 'Analiz Raporu',
            data: {
                report_title: 'Rakip Analizi: E-ticaret Platformları',
                report_type: 'Analiz Raporu',
                target_audience_report: 'Strateji ekibi',
                executive_summary: 'Ana rakipler daha iyi mobil deneyim ve daha hızlı teslimat sunuyor',
                background: 'Pazar konumumuzu güçlendirmek için rakip analizi yapıldı',
                objectives: ['Rakip güçlü ve zayıf yönlerini belirlemek', 'Pazar fırsatlarını tespit etmek', 'Stratejik öneriler geliştirmek'],
                methodology_report: 'Rakip web siteleri incelemesi, müşteri yorumları analizi, SWOT analizi',
                key_data: 'Analiz edilen rakip sayısı: 5, İncelenen kriter: 15, Veri kaynağı: Web, müşteri yorumları',
                analysis: 'Mobil uygulama ve hızlı kargo konularında gerideyiz, müşteri hizmetlerinde önündeyiz',
                recommendations: ['Mobil uygulamayı geliştir', 'Kargo süreçlerini hızlandır', 'Müşteri hizmetleri avantajını pazarlamada kullan'],
                conclusion: 'Belirli alanlarda iyileştirme ile rekabet gücümüzü artırabiliriz',
                tone: 'Teknik'
            }
        }
    ],

    lesson: [
        {
            name: 'Fen - Fotosentez',
            data: {
                lesson_title: 'Bitkilerde Fotosentez',
                grade_level: 'Ortaokul 5-6',
                subject_area: 'Fen Bilimleri',
                duration: '40 dakika',
                learning_objectives: ['Fotosentez sürecini açıklayabilme', 'Fotosentez için gerekli koşulları sıralayabilme', 'Fotosentezin canlılar için önemini kavrama'],
                materials: ['Bitki örneği', 'Deney malzemeleri', 'Sunum', 'Çalışma kağıtları'],
                engage: 'Bitkilerin nasıl beslendiğine dair öğrencilere soru sor. "Bitkiler markete gidip yemek alıyor mu?" gibi eğlenceli sorular sor.',
                explore: 'Öğrenciler gruplara ayrılır, bitki yapraklarını inceleyip gözlem yaparlar. Yaprak üzerinde bulunan yapıları not alırlar.',
                explain: 'Fotosentez sürecini görsellerle açıkla. Klorofil, güneş ışığı, su ve karbondioksit kavramlarını tanıt. Kimyasal denklemi basitçe göster.',
                elaborate: 'Öğrenciler fotosntezin önemini tartışır. "Bitkiler olmasaydı ne olurdu?" sorusunu küçük grup çalışmalarında tartışırlar.',
                evaluate: 'Çalışma kağıdı ile değerlendirme. Fotosentez diyagramı çizdirme. Çıkış kartı: 3 şey öğrendim, 2 soru aklımda kaldı.',
                differentiation: 'İleri öğrenciler için: Fotosentez ve solunum arasındaki ilişki araştırması. Desteğe ihtiyaç duyan öğrenciler için: Görsel destekli basitleştirilmiş notlar.',
                homework: 'Evdeki bir bitkiyi gözlemle, 1 hafta boyunca güneş ışığı alan ve almayan yapraklarını karşılaştır.'
            }
        },
        {
            name: 'Matematik - Kesirler',
            data: {
                lesson_title: 'Kesirleri Toplama',
                grade_level: 'İlkokul 3-4',
                subject_area: 'Matematik',
                duration: '40 dakika',
                learning_objectives: ['Payda eşit olan kesirleri toplayabilme', 'Kesir modellerini kullanarak toplama işlemini görselleştirebilme', 'Günlük hayattan kesir toplama örnekleri verebilme'],
                materials: ['Kesir daireleri', 'Renkli kağıtlar', 'Tahta', 'Çalışma sayfaları'],
                engage: 'İki pizza görseli göster. "Bir pizzanın 2/8\'ini, diğerinin 3/8\'ini yedik. Toplam ne kadar pizza yedik?" sorusunu sor.',
                explore: 'Öğrenciler kesir dairelerini kullanarak farklı kesirleri birleştirip toplamlarını bulurlar. Eşli çalışma.',
                explain: 'Paydaları eşit olan kesirlerin toplanmasını adım adım açıkla. Pay + Pay = Yeni Pay, Payda aynı kalır kuralını öğret.',
                elaborate: 'Öğrenciler kendi günlük hayat örneklerini oluştururlar (pasta paylaşımı, su bardağı vb.) ve kesir toplama problemleri yazarlar.',
                evaluate: 'Bireysel çalışma sayfası, tahta çalışması ve akran değerlendirmesi. Öğrenciler çözümlerini açıklarlar.',
                differentiation: 'Zorluk yaşayan öğrenciler: Kesir modelleriyle daha fazla çalışma. İleri öğrenciler: Farklı paydalı kesirlerle tanışma (zorlaştırma).',
                homework: 'Evde ailesiyle bir yemek hazırlayıp malzeme ölçülerini kesir olarak not alma.'
            }
        },
        {
            name: 'Türkçe - Hikaye Yazma',
            data: {
                lesson_title: 'Yaratıcı Hikaye Yazma',
                grade_level: 'İlkokul 3-4',
                subject_area: 'Türkçe',
                duration: '50 dakika',
                learning_objectives: ['Hikaye öğelerini (kişi, yer, zaman, olay) kullanarak kısa bir hikaye yazabilme', 'Hayal gücünü kullanarak özgün karakterler oluşturabilme', 'Hikayeyi düzenli ve anlaşılır şekilde anlatabilme'],
                materials: ['Hikaye kartları', 'Renkli kalemler', 'A4 kağıtlar', 'Örnek hikaye kitapları'],
                engage: 'Bir çanta içinden rastgele obje çıkar (örn: anahtar, fotoğraf). "Bu obje bir hikayenin kahramanı olsaydı ne olurdu?" sorusunu sor.',
                explore: 'Öğrenciler ikili gruplarda rastgele hikaye kartları çekerler (karakter, yer, sorun kartları) ve bu kartlarla kısa bir hikaye tasarlarlar.',
                explain: 'Hikaye öğelerini açıkla: Başlangıç (kim, nerede, ne zaman), Gelişme (sorun/macera), Sonuç (çözüm). İyi hikaye örnekleri göster.',
                elaborate: 'Her öğrenci kendi hikayesini yazar. İsteğe bağlı: Çizimlerle destekleyebilir. Hikayelerini sınıfla paylaşırlar.',
                evaluate: 'Öz değerlendirme formu: Hikaye öğelerini kullandım mı? Akran geri bildirimi. Öğretmen gözlemi ve yazılı değerlendirme.',
                differentiation: 'Desteğe ihtiyaç duyan öğrenciler: Hikaye şablonu (boşluk doldurma). İleri öğrenciler: Daha uzun hikaye, diyalog ekleme.',
                homework: 'Aileden bir kişinin hayatından kısa bir gerçek hikaye dinleyip yazmak.'
            }
        }
    ],

    html: [
        {
            name: 'Matematik Quiz Oyunu',
            data: {
                content_title: 'Eğlenceli Matematik Quiz\'i',
                content_type: 'Quiz/Test',
                target_platform: 'Tümü (Responsive)',
                features: ['Çoktan seçmeli sorular', 'Puan sistemi', 'Zamanlayıcı', 'Anında geri bildirim', 'Sonuç ekranı'],
                interactivity: ['Buton tıklama', 'Soru gezinme', 'Skor takibi'],
                content_description: 'İlkokul öğrencileri için 10 soruluk toplama-çıkarma quiz\'i. Her doğru cevap 10 puan. Yanlış cevapta açıklama gösterilsin.',
                design_style: 'Renkli/Canlı',
                colors_html: 'Mavi, sarı, yeşil tonları',
                technologies: 'Vanilla JS, CSS3 animasyonlar',
                accessibility: 'Klavye navigasyonu, büyük butonlar'
            }
        },
        {
            name: 'İnteraktif Sunum',
            data: {
                content_title: 'Güneş Sistemi Keşfi',
                content_type: 'İnteraktif Sunum',
                target_platform: 'Web Tarayıcı (Desktop)',
                features: ['Animasyonlu geçişler', 'Tıklanabilir gezegen kartları', 'Bilgi panelleri', 'Video entegrasyonu', 'Quiz bölümü'],
                interactivity: ['Slide gezinme', 'Pop-up bilgi kutuları', 'Hover efektleri'],
                content_description: 'Güneş sistemindeki gezegenleri tanıtan etkileşimli eğitim sunumu. Her gezegene tıklayınca detaylı bilgi açılsın.',
                design_style: 'Modern/Minimalist',
                colors_html: 'Uzay teması: lacivert, mor, beyaz',
                technologies: 'HTML5, CSS3, JavaScript',
                accessibility: 'Alt metinler, kontrast oranı'
            }
        },
        {
            name: 'Form Anket Uygulaması',
            data: {
                content_title: 'Müşteri Memnuniyet Anketi',
                content_type: 'Form/Anket',
                target_platform: 'Tümü (Responsive)',
                features: ['Çoklu sayfa formu', 'İlerleme çubuğu', 'Form validasyonu', 'Sonuç özeti', 'E-posta gönderimi'],
                interactivity: ['Form doldurma', 'İleri/geri navigasyon', 'Radyo button, checkbox, metin girişi'],
                content_description: 'Müşteri memnuniyetini ölçen 3 sayfalık anket. Demografik bilgiler, hizmet değerlendirmesi ve açık uçlu sorular.',
                design_style: 'Profesyonel',
                colors_html: 'Kurumsal: mavi ve gri',
                technologies: 'Bootstrap 5, jQuery validation',
                accessibility: 'WCAG AA uyumlu, label-input ilişkilendirmesi'
            }
        },
        {
            name: 'Veri Görselleştirme Dashboard',
            data: {
                content_title: 'Satış Analiz Paneli',
                content_type: 'Veri Görselleştirme',
                target_platform: 'Web Tarayıcı (Desktop)',
                features: ['Grafik ve tablolar', 'Filtreleme seçenekleri', 'Tarih aralığı seçimi', 'CSV export', 'Gerçek zamanlı güncelleme'],
                interactivity: ['Grafik üzerine gelince detay gösterme', 'Filtre seçimi', 'Tarihi değiştirme'],
                content_description: 'Satış verilerini çizgi, bar ve pasta grafikleriyle gösteren dashboard. Kullanıcı zaman aralığını ve ürün kategorisini seçebilsin.',
                design_style: 'Modern/Minimalist',
                colors_html: 'Profesyonel: lacivert, turkuaz, gri',
                technologies: 'Chart.js, Tailwind CSS',
                accessibility: 'Tablo alternatifi, renk körlerine uygun palet'
            }
        }
    ],

    other: [
        {
            name: 'LinkedIn Gönderisi',
            data: {
                content_category: 'Sosyal Medya Gönderisi',
                other_title: 'Yeni İş İlanı Duyurusu',
                target_audience_other: 'Profesyoneller, iş arayanlar',
                purpose_other: 'Ekibe yeni yazılım geliştirici arıyoruz duyurusu',
                tone_other: 'Profesyonel',
                key_messages: ['Yenilikçi ekibimize katıl', 'Uzaktan çalışma imkanı', 'Rekabetçi maaş'],
                length_other: 'Kısa (100-300 kelime)',
                special_requirements: 'Hashtag kullan, profesyonel ama samimi ol',
                call_to_action: 'Başvuru linki',
                additional_context: 'Şirketimiz fintech alanında çalışıyor'
            }
        },
        {
            name: 'E-posta Newsletter',
            data: {
                content_category: 'E-posta',
                other_title: 'Aylık Ürün Güncellemeleri',
                target_audience_other: 'Mevcut müşteriler',
                purpose_other: 'Yeni özellikleri tanıtmak ve kullanıcı bağlılığını artırmak',
                tone_other: 'Dostça',
                key_messages: ['3 yeni özellik eklendi', 'Kullanıcı geri bildirimlerini dinledik', 'Özel indirim kodu'],
                length_other: 'Orta (300-700 kelime)',
                special_requirements: 'E-posta formatına uygun, kısa paragraflar, alt başlıklar',
                call_to_action: 'Yeni özellikleri dene',
                additional_context: 'Proje yönetimi yazılımı'
            }
        },
        {
            name: 'Blog Yazısı - SEO',
            data: {
                content_category: 'Blog Yazısı',
                other_title: '2024\'te Dijital Pazarlamanın 10 Trendi',
                target_audience_other: 'Pazarlama profesyonelleri, girişimciler',
                purpose_other: 'SEO trafiği çekmek ve düşünce liderliği oluşturmak',
                tone_other: 'Bilgilendirici',
                key_messages: ['AI pazarlamayı değiştiriyor', 'Video içerik önemi artıyor', 'Kişiselleştirme kritik'],
                length_other: 'Uzun (700-1500 kelime)',
                special_requirements: 'SEO anahtar kelimeler: dijital pazarlama, trendler 2024. Alt başlıklar (H2, H3) kullan.',
                call_to_action: 'Ücretsiz e-kitabı indir',
                additional_context: 'Listeleme formatı, her trend için örnek ver'
            }
        },
        {
            name: 'Kısa Hikaye',
            data: {
                content_category: 'Hikaye/Senaryo',
                other_title: 'Kayıp Anahtar',
                target_audience_other: 'Genel okuyucu',
                purpose_other: 'Eğlenceli ve düşündürücü bir hikaye anlatmak',
                tone_other: 'Duygusal',
                key_messages: ['Geçmişle yüzleşme', 'Aile bağları', 'İkinci şanslar'],
                length_other: 'Orta (300-700 kelime)',
                special_requirements: 'Birinci şahıs anlatım, geçmiş zaman, twist ending',
                call_to_action: '',
                additional_context: 'Nostaljik ve umutlu bir son olsun'
            }
        },
        {
            name: 'API Dokümantasyonu',
            data: {
                content_category: 'Kod Dokümantasyonu',
                other_title: 'REST API Endpoint Dokümantasyonu',
                target_audience_other: 'Yazılım geliştiriciler',
                purpose_other: 'API kullanımını açıklamak',
                tone_other: 'Profesyonel',
                key_messages: ['Net endpoint açıklamaları', 'Request/Response örnekleri', 'Hata kodları'],
                length_other: 'Orta (300-700 kelime)',
                special_requirements: 'Kod örnekleri (JSON), parametre tabloları, HTTP metotları',
                call_to_action: 'API key al ve dene',
                additional_context: 'RESTful tasarım prensipleri, versiyonlama'
            }
        }
    ]
};

// ==========================================
// PROMPT GENERATORS (5E Model)
// ==========================================

const PromptGenerators = {
    image: function(formData) {
        let prompt = `# GÖRSEL OLUŞTURMA PROMPTU\n\n`;
        prompt += `## 🎯 ENGAGE (Dikkat Çekme)\n`;
        prompt += `Bir AI görsel oluşturma modeli kullanarak aşağıdaki detaylara sahip profesyonel bir görsel oluştur:\n\n`;

        prompt += `## 🔍 EXPLORE (Keşfetme)\n`;
        prompt += `### Ana Konu/Obje:\n${formData.subject || 'Belirtilmedi'}\n\n`;
        prompt += `### Sanat Stili:\n${formData.style || 'Belirtilmedi'}\n\n`;

        prompt += `## 📖 EXPLAIN (Açıklama)\n`;
        if (formData.mood) prompt += `### Atmosfer/Ruh Hali:\n${formData.mood}\n\n`;
        if (formData.colors) prompt += `### Renk Paleti:\n${formData.colors}\n\n`;
        if (formData.lighting) prompt += `### Işıklandırma:\n${formData.lighting}\n\n`;
        if (formData.perspective) prompt += `### Bakış Açısı:\n${formData.perspective}\n\n`;

        prompt += `## 🎨 ELABORATE (Derinleştirme)\n`;
        if (formData.details) prompt += `### Ek Detaylar:\n${formData.details}\n\n`;

        prompt += `## ✅ EVALUATE (Değerlendirme)\n`;
        prompt += `### Kalite Kriterleri:\n`;
        prompt += `- Yüksek çözünürlük ve detay seviyesi\n`;
        prompt += `- Belirtilen stil ve atmosfere sadakat\n`;
        prompt += `- Kompozisyon dengesi ve görsel çekicilik\n\n`;

        if (formData.exclude) {
            prompt += `### ❌ İstenmeyen Öğeler:\n${formData.exclude}\n\n`;
        }

        prompt += `---\n### 💡 Not:\nBu prompt, profesyonel görsel oluşturma araçlarında (DALL-E, Midjourney, Stable Diffusion vb.) kullanılmak üzere optimize edilmiştir.`;

        return prompt;
    },

    video: function(formData) {
        let prompt = `# JSON VİDEO PROMPT YAPISI\n\n`;

        prompt += `## 🎯 ENGAGE (Dikkat Çekme)\n`;
        prompt += `Video Başlığı: ${formData.title || 'Belirtilmedi'}\n`;
        prompt += `Hedef Kitle: ${formData.target_audience || 'Belirtilmedi'}\n`;
        prompt += `Video Amacı: ${formData.purpose || 'Belirtilmedi'}\n\n`;

        prompt += `## 🔍 EXPLORE (Video Yapısı)\n`;
        prompt += `### Genel Özellikler:\n`;
        prompt += `- Süre: ${formData.duration || 'Belirtilmedi'}\n`;
        if (formData.music_style) prompt += `- Müzik Tarzı: ${formData.music_style}\n`;
        if (formData.transitions) prompt += `- Geçiş Efektleri: ${formData.transitions}\n`;
        prompt += `\n`;

        prompt += `## 📖 EXPLAIN (Sahne Detayları)\n`;
        prompt += `### Sahneler:\n`;
        if (formData.scenes && formData.scenes.length > 0) {
            formData.scenes.forEach((scene, index) => {
                prompt += `${index + 1}. ${scene}\n`;
            });
        } else {
            prompt += `Sahne bilgisi eklenmedi.\n`;
        }
        prompt += `\n`;

        if (formData.voiceover) {
            prompt += `## 🎙️ ELABORATE (Seslendirme)\n`;
            prompt += `### Seslendirme Metni:\n${formData.voiceover}\n\n`;
        }

        if (formData.branding) {
            prompt += `### Marka Öğeleri:\n${formData.branding}\n\n`;
        }

        prompt += `## ✅ EVALUATE (Başarı Kriterleri)\n`;
        prompt += `- Hedef kitleye uygunluk\n`;
        prompt += `- Mesajın net iletilmesi\n`;
        prompt += `- Görsel ve işitsel tutarlılık\n`;
        prompt += `- Belirlenen süreye uyum\n\n`;

        prompt += `---\n### 💡 Not:\nBu prompt, JSON video oluşturma araçlarında yapılandırılmış video içeriği üretmek için hazırlanmıştır.`;

        return prompt;
    },

    summary: function(formData) {
        let prompt = `# AKADEMİK MAKALE ÖZETLEME PROMPTU\n\n`;

        prompt += `## 🎯 ENGAGE (Giriş)\n`;
        prompt += `Aşağıdaki akademik makaleyi kapsamlı bir şekilde özetle:\n\n`;
        prompt += `**Makale Başlığı:** ${formData.article_title || 'Belirtilmedi'}\n`;
        prompt += `**Makale Türü:** ${formData.article_type || 'Belirtilmedi'}\n`;
        prompt += `**Araştırma Alanı:** ${formData.research_field || 'Belirtilmedi'}\n\n`;

        prompt += `## 🔍 EXPLORE (Araştırma Sorusu ve Metodoloji)\n`;
        prompt += `### Araştırma Sorusu/Hipotez:\n${formData.research_question || 'Belirtilmedi'}\n\n`;

        prompt += `### Metodoloji:\n`;
        prompt += `${formData.methodology || 'Belirtilmedi'}\n\n`;
        if (formData.sample_size) prompt += `**Örneklem:** ${formData.sample_size}\n`;
        if (formData.statistical_tests) prompt += `**İstatistiksel Testler:** ${formData.statistical_tests}\n`;
        prompt += `\n`;

        prompt += `## 📖 EXPLAIN (Bulgular)\n`;
        prompt += `### Ana Bulgular:\n${formData.key_findings || 'Belirtilmedi'}\n\n`;

        prompt += `## 🎨 ELABORATE (Derinlemesine Analiz)\n`;
        if (formData.limitations) {
            prompt += `### Sınırlılıklar:\n${formData.limitations}\n\n`;
        }

        prompt += `### Literatürle İlişki:\n`;
        prompt += `Bu makaleyi özetlerken:\n`;
        prompt += `- Bulguların mevcut literatürle örtüşen yönlerini belirt\n`;
        prompt += `- Literatürle çelişen veya yeni katkı sağlayan noktaları vurgula\n\n`;

        if (formData.practical_implications) {
            prompt += `### Pratik Uygulamalar:\n${formData.practical_implications}\n\n`;
        }

        prompt += `## ✅ EVALUATE (Değerlendirme ve Gelecek)\n`;
        if (formData.future_research) {
            prompt += `### Gelecek Araştırma Önerileri:\n${formData.future_research}\n\n`;
        }

        prompt += `### Genel Değerlendirme:\n`;
        prompt += `- Çalışmanın bilimsel katkısını değerlendir\n`;
        prompt += `- Metodolojik güçlü ve zayıf yönlerini belirt\n`;
        prompt += `- Bulguların güvenilirliğini yorumla\n\n`;

        prompt += `---\n### 📋 Özet Formatı:\n`;
        prompt += `Lütfen özeti şu başlıklar altında yapılandır:\n`;
        prompt += `1. Araştırma Sorusu/Hipotez\n`;
        prompt += `2. Metodoloji (tasarım, örneklem, veri toplama, analiz teknikleri)\n`;
        prompt += `3. Ana Bulgular\n`;
        prompt += `4. Literatürle Örtüşen ve Çelişen Noktalar\n`;
        prompt += `5. Sınırlılıklar\n`;
        prompt += `6. Gelecek Araştırma Önerileri\n`;
        prompt += `7. Pratik Uygulamalar\n`;

        return prompt;
    },

    report: function(formData) {
        let prompt = `# RAPOR YAZMA PROMPTU\n\n`;

        prompt += `## 🎯 ENGAGE (Giriş)\n`;
        prompt += `Aşağıdaki bilgilere dayanarak profesyonel bir rapor hazırla:\n\n`;
        prompt += `**Rapor Başlığı:** ${formData.report_title || 'Belirtilmedi'}\n`;
        prompt += `**Rapor Türü:** ${formData.report_type || 'Belirtilmedi'}\n`;
        prompt += `**Hedef Kitle:** ${formData.target_audience_report || 'Belirtilmedi'}\n`;
        if (formData.tone) prompt += `**Üslup:** ${formData.tone}\n`;
        prompt += `\n`;

        prompt += `## 🔍 EXPLORE (Yönetici Özeti ve Bağlam)\n`;
        prompt += `### Yönetici Özeti:\n${formData.executive_summary || 'Belirtilmedi'}\n\n`;
        prompt += `### Arka Plan:\n${formData.background || 'Belirtilmedi'}\n\n`;

        prompt += `## 📖 EXPLAIN (Amaç ve Metodoloji)\n`;
        prompt += `### Amaç ve Hedefler:\n`;
        if (formData.objectives && formData.objectives.length > 0) {
            formData.objectives.forEach((obj, index) => {
                prompt += `${index + 1}. ${obj}\n`;
            });
        } else {
            prompt += `Hedef belirtilmedi.\n`;
        }
        prompt += `\n`;

        if (formData.methodology_report) {
            prompt += `### Metodoloji/Yaklaşım:\n${formData.methodology_report}\n\n`;
        }

        prompt += `## 🎨 ELABORATE (Bulgular ve Analiz)\n`;
        prompt += `### Ana Veriler/Bulgular:\n${formData.key_data || 'Belirtilmedi'}\n\n`;
        prompt += `### Analiz ve Yorumlama:\n${formData.analysis || 'Belirtilmedi'}\n\n`;

        prompt += `## ✅ EVALUATE (Öneriler ve Sonuç)\n`;
        prompt += `### Öneriler:\n`;
        if (formData.recommendations && formData.recommendations.length > 0) {
            formData.recommendations.forEach((rec, index) => {
                prompt += `${index + 1}. ${rec}\n`;
            });
        } else {
            prompt += `Öneri belirtilmedi.\n`;
        }
        prompt += `\n`;

        prompt += `### Sonuç:\n${formData.conclusion || 'Belirtilmedi'}\n\n`;

        prompt += `---\n### 📋 Rapor Yapısı:\n`;
        prompt += `Lütfen raporu şu bölümlerle yapılandır:\n`;
        prompt += `1. Yönetici Özeti\n`;
        prompt += `2. Giriş ve Arka Plan\n`;
        prompt += `3. Amaç ve Hedefler\n`;
        prompt += `4. Metodoloji (varsa)\n`;
        prompt += `5. Bulgular ve Veriler\n`;
        prompt += `6. Analiz ve Yorumlama\n`;
        prompt += `7. Öneriler\n`;
        prompt += `8. Sonuç\n`;
        prompt += `9. Ekler (gerekirse)\n`;

        return prompt;
    },

    lesson: function(formData) {
        let prompt = `# DERS PLANI (5E MODELİ) PROMPTU\n\n`;

        prompt += `## 🎯 Ders Bilgileri\n`;
        prompt += `**Ders Başlığı:** ${formData.lesson_title || 'Belirtilmedi'}\n`;
        prompt += `**Sınıf Seviyesi:** ${formData.grade_level || 'Belirtilmedi'}\n`;
        prompt += `**Ders Alanı:** ${formData.subject_area || 'Belirtilmedi'}\n`;
        prompt += `**Süre:** ${formData.duration || 'Belirtilmedi'}\n\n`;

        prompt += `### Öğrenme Hedefleri:\n`;
        if (formData.learning_objectives && formData.learning_objectives.length > 0) {
            formData.learning_objectives.forEach((obj, index) => {
                prompt += `${index + 1}. ${obj}\n`;
            });
        } else {
            prompt += `Hedef belirtilmedi.\n`;
        }
        prompt += `\n`;

        prompt += `### Gerekli Materyaller:\n`;
        if (formData.materials && formData.materials.length > 0) {
            formData.materials.forEach((mat, index) => {
                prompt += `- ${mat}\n`;
            });
        } else {
            prompt += `Materyal belirtilmedi.\n`;
        }
        prompt += `\n`;

        prompt += `---\n\n`;
        prompt += `## 🔥 ENGAGE (Dikkat Çekme/Giriş) - 5-10 dakika\n`;
        prompt += `${formData.engage || 'Belirtilmedi'}\n\n`;
        prompt += `**Amaç:** Öğrencilerin ilgisini çekmek, ön bilgilerini harekete geçirmek ve konuya merak uyandırmak.\n\n`;

        prompt += `## 🔍 EXPLORE (Keşfetme) - 10-15 dakika\n`;
        prompt += `${formData.explore || 'Belirtilmedi'}\n\n`;
        prompt += `**Amaç:** Öğrencilerin konuyu kendi başlarına keşfetmesi, deneyim kazanması ve gözlem yapması.\n\n`;

        prompt += `## 📖 EXPLAIN (Açıklama) - 10-15 dakika\n`;
        prompt += `${formData.explain || 'Belirtilmedi'}\n\n`;
        prompt += `**Amaç:** Öğretmenin kavramları açıklaması, bilimsel terminolojiyi tanıtması ve öğrenci keşiflerini yapılandırması.\n\n`;

        prompt += `## 🎨 ELABORATE (Derinleştirme) - 10-15 dakika\n`;
        prompt += `${formData.elaborate || 'Belirtilmedi'}\n\n`;
        prompt += `**Amaç:** Öğrenilen bilgilerin pekiştirilmesi, yeni durumlara uygulanması ve derinleştirilmesi.\n\n`;

        prompt += `## ✅ EVALUATE (Değerlendirme) - 5-10 dakika\n`;
        prompt += `${formData.evaluate || 'Belirtilmedi'}\n\n`;
        prompt += `**Amaç:** Öğrenme hedeflerine ulaşılıp ulaşılmadığının değerlendirilmesi.\n\n`;

        if (formData.differentiation) {
            prompt += `---\n\n`;
            prompt += `## 🌟 Farklılaştırma Stratejileri\n`;
            prompt += `${formData.differentiation}\n\n`;
        }

        if (formData.homework) {
            prompt += `## 📚 Ev Ödevi/Uzantı Aktiviteleri\n`;
            prompt += `${formData.homework}\n\n`;
        }

        prompt += `---\n### 💡 Not:\n`;
        prompt += `Bu ders planı 5E öğretim modeline göre yapılandırılmıştır. Model, öğrenci merkezli, yapılandırmacı bir yaklaşımla öğrenmeyi destekler.\n`;

        return prompt;
    },

    html: function(formData) {
        let prompt = `# ETKİLEŞİMLİ HTML İÇERİK PROMPTU\n\n`;

        prompt += `## 🎯 ENGAGE (Proje Tanımı)\n`;
        prompt += `Aşağıdaki özelliklere sahip etkileşimli bir HTML içeriği oluştur:\n\n`;
        prompt += `**Proje Başlığı:** ${formData.content_title || 'Belirtilmedi'}\n`;
        prompt += `**İçerik Türü:** ${formData.content_type || 'Belirtilmedi'}\n`;
        prompt += `**Hedef Platform:** ${formData.target_platform || 'Belirtilmedi'}\n\n`;

        prompt += `## 🔍 EXPLORE (İçerik Açıklaması)\n`;
        prompt += `### Detaylı Açıklama:\n${formData.content_description || 'Belirtilmedi'}\n\n`;

        prompt += `## 📖 EXPLAIN (Teknik Özellikler)\n`;
        prompt += `### İstenen Özellikler:\n`;
        if (formData.features && formData.features.length > 0) {
            formData.features.forEach((feature, index) => {
                prompt += `${index + 1}. ${feature}\n`;
            });
        } else {
            prompt += `Özellik belirtilmedi.\n`;
        }
        prompt += `\n`;

        prompt += `### Etkileşim Türleri:\n`;
        if (formData.interactivity && formData.interactivity.length > 0) {
            formData.interactivity.forEach((interaction, index) => {
                prompt += `- ${interaction}\n`;
            });
        } else {
            prompt += `Etkileşim belirtilmedi.\n`;
        }
        prompt += `\n`;

        if (formData.technologies) {
            prompt += `### Tercih Edilen Teknolojiler:\n${formData.technologies}\n\n`;
        }

        prompt += `## 🎨 ELABORATE (Tasarım Detayları)\n`;
        if (formData.design_style) prompt += `**Tasarım Stili:** ${formData.design_style}\n`;
        if (formData.colors_html) prompt += `**Renk Şeması:** ${formData.colors_html}\n`;
        prompt += `\n`;

        if (formData.accessibility) {
            prompt += `### Erişilebilirlik Gereksinimleri:\n${formData.accessibility}\n\n`;
        }

        prompt += `## ✅ EVALUATE (Başarı Kriterleri)\n`;
        prompt += `### Kalite Standartları:\n`;
        prompt += `- Responsive tasarım (tüm cihazlarda çalışmalı)\n`;
        prompt += `- Temiz ve okunabilir kod yapısı\n`;
        prompt += `- Kullanıcı dostu arayüz\n`;
        prompt += `- Hızlı yüklenme ve performans\n`;
        if (formData.accessibility) prompt += `- Erişilebilirlik standartlarına uyum\n`;
        prompt += `\n`;

        prompt += `---\n### 💻 Beklenen Çıktı:\n`;
        prompt += `Lütfen aşağıdaki dosyaları oluştur:\n`;
        prompt += `1. **index.html** - Ana HTML yapısı\n`;
        prompt += `2. **style.css** - Tüm stiller (veya satır içi CSS)\n`;
        prompt += `3. **script.js** - JavaScript fonksiyonları\n`;
        prompt += `4. Kod içinde yeterli yorum satırları\n`;
        prompt += `5. Kullanım talimatları (varsa)\n`;

        return prompt;
    },

    other: function(formData) {
        let prompt = `# ${(formData.content_category || 'İÇERİK').toUpperCase()} OLUŞTURMA PROMPTU\n\n`;

        prompt += `## 🎯 ENGAGE (Giriş)\n`;
        prompt += `Aşağıdaki özelliklere sahip bir ${formData.content_category || 'içerik'} oluştur:\n\n`;
        prompt += `**Başlık/Konu:** ${formData.other_title || 'Belirtilmedi'}\n`;
        prompt += `**Hedef Kitle:** ${formData.target_audience_other || 'Belirtilmedi'}\n`;
        prompt += `**Üslup/Ton:** ${formData.tone_other || 'Belirtilmedi'}\n\n`;

        prompt += `## 🔍 EXPLORE (Amaç ve Bağlam)\n`;
        prompt += `### Amaç:\n${formData.purpose_other || 'Belirtilmedi'}\n\n`;

        prompt += `## 📖 EXPLAIN (Ana Mesajlar)\n`;
        prompt += `### İletilmesi Gereken Temel Mesajlar:\n`;
        if (formData.key_messages && formData.key_messages.length > 0) {
            formData.key_messages.forEach((message, index) => {
                prompt += `${index + 1}. ${message}\n`;
            });
        } else {
            prompt += `Mesaj belirtilmedi.\n`;
        }
        prompt += `\n`;

        prompt += `## 🎨 ELABORATE (Detaylar ve Gereksinimler)\n`;
        if (formData.length_other) {
            prompt += `**İçerik Uzunluğu:** ${formData.length_other}\n\n`;
        }

        if (formData.special_requirements) {
            prompt += `### Özel Gereksinimler:\n${formData.special_requirements}\n\n`;
        }

        if (formData.additional_context) {
            prompt += `### Ek Bağlam:\n${formData.additional_context}\n\n`;
        }

        prompt += `## ✅ EVALUATE (Sonuç ve CTA)\n`;
        if (formData.call_to_action) {
            prompt += `**Harekete Geçirici Mesaj (CTA):** ${formData.call_to_action}\n\n`;
        }

        prompt += `### Başarı Kriterleri:\n`;
        prompt += `- Hedef kitleye uygun dil ve üslup\n`;
        prompt += `- Ana mesajların net iletilmesi\n`;
        prompt += `- Belirtilen uzunluğa uygunluk\n`;
        prompt += `- Özgün ve ilgi çekici içerik\n`;
        if (formData.call_to_action) prompt += `- Etkili CTA entegrasyonu\n`;
        prompt += `\n`;

        prompt += `---\n### 💡 Not:\n`;
        prompt += `İçerik hedef kitle ve amaç doğrultusunda optimize edilmiştir. Gerektiğinde düzenlemeler yapabilirsiniz.`;

        return prompt;
    }
};

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Category cards click
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            loadCategory(category);
        });
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', function() {
        showCategorySection();
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', function() {
        generatePrompt();
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', function() {
        clearForm();
    });

    // Save template button
    document.getElementById('saveTemplateBtn').addEventListener('click', function() {
        saveUserTemplate();
    });

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', function() {
        copyPromptToClipboard();
    });

    // Template select
    document.getElementById('templateSelect').addEventListener('change', function() {
        const templateIndex = this.value;
        if (templateIndex !== '') {
            loadTemplate(parseInt(templateIndex));
        }
    });

    // History button
    document.getElementById('historyBtn').addEventListener('click', function() {
        showHistoryModal();
    });

    // My templates button
    document.getElementById('templatesBtn').addEventListener('click', function() {
        showMyTemplatesModal();
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });
}

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

function loadCategory(categoryKey) {
    const category = Categories[categoryKey];
    if (!category) return;

    AppState.currentCategory = categoryKey;
    AppState.currentFormData = {};

    // Update title
    document.getElementById('currentCategoryTitle').textContent = category.name;

    // Load form
    loadForm(category.fields);

    // Load templates
    loadTemplates(categoryKey);

    // Show workspace
    document.getElementById('categorySection').classList.add('hidden');
    document.getElementById('workspaceSection').classList.remove('hidden');
    document.getElementById('workspaceSection').classList.add('slide-in');

    // Reset preview
    resetPreview();
}

function showCategorySection() {
    document.getElementById('workspaceSection').classList.add('hidden');
    document.getElementById('categorySection').classList.remove('hidden');
    AppState.currentCategory = null;
    AppState.currentFormData = {};
}

// ==========================================
// FORM MANAGEMENT
// ==========================================

function loadForm(fields) {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = '';

    fields.forEach(field => {
        const formGroup = createFormField(field);
        formContainer.appendChild(formGroup);
    });

    // Add event listeners to all inputs
    addFormListeners();
}

function createFormField(field) {
    const div = document.createElement('div');
    div.className = 'form-group';
    if (field.className) div.classList.add(field.className);

    const label = document.createElement('label');
    label.className = `form-label ${field.required ? 'required' : ''}`;
    label.textContent = field.label;
    div.appendChild(label);

    let input;

    if (field.type === 'text') {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
        input.id = field.id;
        if (field.required) input.required = true;
    } else if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-textarea';
        input.placeholder = field.placeholder || '';
        input.id = field.id;
        if (field.required) input.required = true;
    } else if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        input.id = field.id;
        if (field.required) input.required = true;

        field.options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            input.appendChild(opt);
        });
    } else if (field.type === 'multi') {
        const container = document.createElement('div');
        container.className = 'multi-input-container';
        container.id = field.id;

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'add-item-btn';
        addBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Ekle';
        addBtn.onclick = () => addMultiInputItem(field.id, field.placeholder);

        container.appendChild(addBtn);
        div.appendChild(container);

        if (field.help) {
            const help = document.createElement('p');
            help.className = 'form-help';
            help.textContent = field.help;
            div.appendChild(help);
        }

        return div;
    }

    div.appendChild(input);

    if (field.help) {
        const help = document.createElement('p');
        help.className = 'form-help';
        help.textContent = field.help;
        div.appendChild(help);
    }

    return div;
}

function addMultiInputItem(containerId, placeholder = '') {
    const container = document.getElementById(containerId);
    const addBtn = container.querySelector('.add-item-btn');

    const itemDiv = document.createElement('div');
    itemDiv.className = 'multi-input-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.placeholder = placeholder;
    input.onchange = () => updateFormData();

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = () => {
        itemDiv.remove();
        updateFormData();
    };

    itemDiv.appendChild(input);
    itemDiv.appendChild(removeBtn);
    container.insertBefore(itemDiv, addBtn);

    updateFormData();
}

function addFormListeners() {
    const inputs = document.querySelectorAll('#formContainer input, #formContainer textarea, #formContainer select');
    inputs.forEach(input => {
        input.addEventListener('input', updateFormData);
        input.addEventListener('change', updateFormData);
    });
}

function updateFormData() {
    const fields = Categories[AppState.currentCategory].fields;
    AppState.currentFormData = {};

    fields.forEach(field => {
        if (field.type === 'multi') {
            const container = document.getElementById(field.id);
            const inputs = container.querySelectorAll('.multi-input-item input');
            AppState.currentFormData[field.id] = Array.from(inputs)
                .map(input => input.value.trim())
                .filter(val => val !== '');
        } else {
            const input = document.getElementById(field.id);
            if (input) {
                AppState.currentFormData[field.id] = input.value;
            }
        }
    });
}

function clearForm() {
    const inputs = document.querySelectorAll('#formContainer input, #formContainer textarea, #formContainer select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    // Clear multi-input containers
    document.querySelectorAll('.multi-input-container').forEach(container => {
        const items = container.querySelectorAll('.multi-input-item');
        items.forEach(item => item.remove());
    });

    // Reset template select
    document.getElementById('templateSelect').value = '';

    AppState.currentFormData = {};
    resetPreview();
}

// ==========================================
// TEMPLATE MANAGEMENT
// ==========================================

function loadTemplates(categoryKey) {
    const templateSelect = document.getElementById('templateSelect');
    templateSelect.innerHTML = '<option value="">-- Şablon Seçin --</option>';

    const categoryTemplates = Templates[categoryKey] || [];

    // Add predefined templates
    categoryTemplates.forEach((template, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `⭐ ${template.name}`;
        templateSelect.appendChild(option);
    });

    // Add user templates for this category
    const userTemplates = AppState.userTemplates.filter(t => t.category === categoryKey);
    if (userTemplates.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = '--- Benim Şablonlarım ---';

        userTemplates.forEach((template, index) => {
            const option = document.createElement('option');
            option.value = `user_${index}`;
            option.textContent = `💾 ${template.name}`;
            optgroup.appendChild(option);
        });

        templateSelect.appendChild(optgroup);
    }
}

function loadTemplate(templateIndex) {
    const categoryKey = AppState.currentCategory;
    const templateSelectValue = document.getElementById('templateSelect').value;

    let templateData;

    if (templateSelectValue.startsWith('user_')) {
        // Load user template
        const userIndex = parseInt(templateSelectValue.split('_')[1]);
        const userTemplates = AppState.userTemplates.filter(t => t.category === categoryKey);
        templateData = userTemplates[userIndex].data;
    } else {
        // Load predefined template
        const templates = Templates[categoryKey];
        if (!templates || !templates[templateIndex]) return;
        templateData = templates[templateIndex].data;
    }

    // Fill form with template data
    Object.keys(templateData).forEach(key => {
        const value = templateData[key];

        if (Array.isArray(value)) {
            // Multi-input field
            const container = document.getElementById(key);
            if (container) {
                // Clear existing items
                container.querySelectorAll('.multi-input-item').forEach(item => item.remove());

                // Add items
                value.forEach(item => {
                    addMultiInputItem(key, '');
                    const inputs = container.querySelectorAll('.multi-input-item input');
                    const lastInput = inputs[inputs.length - 1];
                    if (lastInput) lastInput.value = item;
                });
            }
        } else {
            // Regular input
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
            }
        }
    });

    updateFormData();
}

function saveUserTemplate() {
    updateFormData();

    if (Object.keys(AppState.currentFormData).length === 0) {
        alert('Lütfen önce formu doldurun!');
        return;
    }

    const templateName = prompt('Şablon adı girin:');
    if (!templateName) return;

    const userTemplate = {
        name: templateName,
        category: AppState.currentCategory,
        data: { ...AppState.currentFormData },
        createdAt: new Date().toISOString()
    };

    AppState.userTemplates.push(userTemplate);
    saveToLocalStorage();
    loadTemplates(AppState.currentCategory);

    alert(`Şablon "${templateName}" kaydedildi!`);
}

// ==========================================
// PROMPT GENERATION
// ==========================================

function generatePrompt() {
    updateFormData();

    // Validate required fields
    const fields = Categories[AppState.currentCategory].fields;
    const missingFields = [];

    fields.forEach(field => {
        if (field.required) {
            const value = AppState.currentFormData[field.id];
            if (!value || (Array.isArray(value) && value.length === 0)) {
                missingFields.push(field.label);
            }
        }
    });

    if (missingFields.length > 0) {
        alert(`Lütfen şu zorunlu alanları doldurun:\n- ${missingFields.join('\n- ')}`);
        return;
    }

    // Generate prompt using the appropriate generator
    const generator = PromptGenerators[AppState.currentCategory];
    if (!generator) {
        alert('Prompt oluşturucu bulunamadı!');
        return;
    }

    const prompt = generator(AppState.currentFormData);
    AppState.generatedPrompt = prompt;

    // Display prompt
    displayPrompt(prompt);

    // Enable copy button
    document.getElementById('copyBtn').disabled = false;

    // Save to history
    saveToHistory();
}

function displayPrompt(prompt) {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';

    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordWrap = 'break-word';
    pre.style.fontFamily = "'Courier New', monospace";
    pre.style.fontSize = '14px';
    pre.style.lineHeight = '1.6';
    pre.textContent = prompt;

    previewContainer.appendChild(pre);
}

function resetPreview() {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '<p class="text-gray-400 italic">Formu doldurun ve "Prompt Oluştur" butonuna tıklayın...</p>';
    document.getElementById('copyBtn').disabled = true;
    AppState.generatedPrompt = '';
}

// ==========================================
// COPY FUNCTIONALITY
// ==========================================

function copyPromptToClipboard() {
    if (!AppState.generatedPrompt) return;

    navigator.clipboard.writeText(AppState.generatedPrompt).then(() => {
        // Show notification
        const notification = document.getElementById('copyNotification');
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }).catch(err => {
        alert('Kopyalama başarısız: ' + err);
    });
}

// ==========================================
// HISTORY & STORAGE
// ==========================================

function saveToHistory() {
    const historyItem = {
        id: Date.now(),
        category: AppState.currentCategory,
        categoryName: Categories[AppState.currentCategory].name,
        prompt: AppState.generatedPrompt,
        formData: { ...AppState.currentFormData },
        createdAt: new Date().toISOString()
    };

    AppState.history.unshift(historyItem);

    // Keep only last 50 items
    if (AppState.history.length > 50) {
        AppState.history = AppState.history.slice(0, 50);
    }

    saveToLocalStorage();
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('promptHistory', JSON.stringify(AppState.history));
        localStorage.setItem('userTemplates', JSON.stringify(AppState.userTemplates));
    } catch (e) {
        console.error('LocalStorage save error:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const history = localStorage.getItem('promptHistory');
        const templates = localStorage.getItem('userTemplates');

        if (history) {
            AppState.history = JSON.parse(history);
        }

        if (templates) {
            AppState.userTemplates = JSON.parse(templates);
        }
    } catch (e) {
        console.error('LocalStorage load error:', e);
    }
}

// ==========================================
// MODALS
// ==========================================

function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const listContainer = document.getElementById('historyList');
    listContainer.innerHTML = '';

    if (AppState.history.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Henüz prompt geçmişiniz yok</p>
            </div>
        `;
    } else {
        AppState.history.forEach((item, index) => {
            const historyItem = createHistoryItem(item, index);
            listContainer.appendChild(historyItem);
        });
    }

    modal.classList.remove('hidden');
}

function createHistoryItem(item, index) {
    const div = document.createElement('div');
    div.className = 'history-item';

    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="item-header">
            <div>
                <div class="item-title">${item.categoryName}</div>
                <div class="item-meta">${formattedDate}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn btn-use" onclick="useHistoryItem(${index})">
                    <i class="fas fa-redo mr-1"></i> Kullan
                </button>
                <button class="item-btn btn-delete" onclick="deleteHistoryItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="item-preview">${item.prompt.substring(0, 200)}${item.prompt.length > 200 ? '...' : ''}</div>
    `;

    return div;
}

function useHistoryItem(index) {
    const item = AppState.history[index];

    // Close modal
    document.getElementById('historyModal').classList.add('hidden');

    // Load category if different
    if (AppState.currentCategory !== item.category) {
        loadCategory(item.category);
    }

    // Fill form with data
    Object.keys(item.formData).forEach(key => {
        const value = item.formData[key];

        if (Array.isArray(value)) {
            const container = document.getElementById(key);
            if (container) {
                container.querySelectorAll('.multi-input-item').forEach(el => el.remove());
                value.forEach(val => {
                    addMultiInputItem(key, '');
                    const inputs = container.querySelectorAll('.multi-input-item input');
                    const lastInput = inputs[inputs.length - 1];
                    if (lastInput) lastInput.value = val;
                });
            }
        } else {
            const input = document.getElementById(key);
            if (input) input.value = value;
        }
    });

    // Display prompt
    AppState.generatedPrompt = item.prompt;
    displayPrompt(item.prompt);
    document.getElementById('copyBtn').disabled = false;

    updateFormData();
}

function deleteHistoryItem(index) {
    if (!confirm('Bu prompt geçmişini silmek istediğinizden emin misiniz?')) return;

    AppState.history.splice(index, 1);
    saveToLocalStorage();
    showHistoryModal(); // Refresh
}

function showMyTemplatesModal() {
    const modal = document.getElementById('myTemplatesModal');
    const listContainer = document.getElementById('myTemplatesList');
    listContainer.innerHTML = '';

    if (AppState.userTemplates.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>Henüz kaydedilmiş şablonunuz yok</p>
            </div>
        `;
    } else {
        AppState.userTemplates.forEach((template, index) => {
            const templateItem = createTemplateItem(template, index);
            listContainer.appendChild(templateItem);
        });
    }

    modal.classList.remove('hidden');
}

function createTemplateItem(template, index) {
    const div = document.createElement('div');
    div.className = 'template-item';

    const date = new Date(template.createdAt);
    const formattedDate = date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const categoryName = Categories[template.category]?.name || 'Bilinmeyen';

    div.innerHTML = `
        <div class="item-header">
            <div>
                <div class="item-title">${template.name}</div>
                <div class="item-meta">${categoryName} - ${formattedDate}</div>
            </div>
            <div class="item-actions">
                <button class="item-btn btn-use" onclick="useTemplate(${index})">
                    <i class="fas fa-redo mr-1"></i> Kullan
                </button>
                <button class="item-btn btn-delete" onclick="deleteTemplate(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    return div;
}

function useTemplate(index) {
    const template = AppState.userTemplates[index];

    // Close modal
    document.getElementById('myTemplatesModal').classList.add('hidden');

    // Load category if different
    if (AppState.currentCategory !== template.category) {
        loadCategory(template.category);
    }

    // Fill form
    Object.keys(template.data).forEach(key => {
        const value = template.data[key];

        if (Array.isArray(value)) {
            const container = document.getElementById(key);
            if (container) {
                container.querySelectorAll('.multi-input-item').forEach(el => el.remove());
                value.forEach(val => {
                    addMultiInputItem(key, '');
                    const inputs = container.querySelectorAll('.multi-input-item input');
                    const lastInput = inputs[inputs.length - 1];
                    if (lastInput) lastInput.value = val;
                });
            }
        } else {
            const input = document.getElementById(key);
            if (input) input.value = value;
        }
    });

    updateFormData();
}

function deleteTemplate(index) {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    AppState.userTemplates.splice(index, 1);
    saveToLocalStorage();
    showMyTemplatesModal(); // Refresh
}
