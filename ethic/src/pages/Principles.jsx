import { useState } from 'react'
import { User, Scale, Eye, Shield, CheckCircle, Clipboard, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const Principles = () => {
  const [selectedPrinciple, setSelectedPrinciple] = useState(0)

  const principles = [
    {
      id: 1,
      icon: User,
      title: 'Öğrenci ve İnsan Odaklılık',
      shortDesc: 'Öğrencinin bütüncül gelişimini merkeze alma',
      description: 'Tüm YZ uygulamaları, öğrencinin akademik, sosyal ve duygusal esenliğini merkeze almalı, bireysel farklılıkları ve bütüncül gelişimi desteklemelidir.',
      details: [
        'Öğrencinin akademik, sosyal ve duygusal esenliğini öncelik olarak kabul etme',
        'Bireysel farklılıkları tanıma ve destekleme',
        'Bütüncül gelişimi teşvik eden yaklaşımlar benimseme',
        'Öğrenci refahını teknolojik verimlilikten üstün tutma'
      ],
      examples: [
        'Kişiselleştirilmiş öğrenme sistemlerinde öğrencinin duygusal durumunu dikkate alma',
        'Farklı öğrenme stillerine uygun içerik sunma',
        'Öğrenci motivasyonunu artıran gamifikasyon unsurları'
      ]
    },
    {
      id: 2,
      icon: Scale,
      title: 'Adillik ve Kapsayıcılık',
      shortDesc: 'Ayrımcılık yapmama ve eşit fırsatlar sunma',
      description: 'YZ sistemleri, sosyo-ekonomik durum, coğrafi konum, cinsiyet, dil veya özel gereksinim durumu gibi faktörlere dayalı ayrımcılık yapmamalıdır.',
      details: [
        'Sosyo-ekonomik, coğrafi, cinsiyet, dil veya özel gereksinim ayrımcılığı yapmama',
        'Mevcut eşitsizlikleri pekiştirmek yerine azaltma',
        'Tüm öğrenciler için adil ve erişilebilir öğrenme fırsatları yaratma',
        'Algoritmik yanlılığı tespit etme ve önleme'
      ],
      examples: [
        'Farklı sosyo-ekonomik geçmişlerden öğrenciler için eşit kalitede içerik',
        'Özel gereksinimli öğrenciler için erişilebilir arayüzler',
        'Kırsal ve kentsel bölgeler arasında eşit hizmet kalitesi'
      ]
    },
    {
      id: 3,
      icon: Eye,
      title: 'Şeffaflık ve Açıklanabilirlik',
      shortDesc: 'Anlaşılır ve açıklanabilir karar alma süreçleri',
      description: 'YZ sistemlerinin karar alma süreçleri, özellikle öğrenci değerlendirme gibi kritik alanlarda, öğrenciler, öğretmenler ve veliler için anlaşılır ve açıklanabilir olmalıdır.',
      details: [
        'Karar alma süreçlerinin şeffaf olması',
        'Öğrenci, öğretmen ve veliler için anlaşılır açıklamalar',
        'Kritik kararlarda gerekçelendirme yapılması',
        '"Kara kutu" sistemlerden kaçınma'
      ],
      examples: [
        'Öğrenci değerlendirmelerinde kullanılan kriterlerin açık olması',
        'Öneri sistemlerinin nasıl çalıştığının açıklanması',
        'Otomatik puanlama sistemlerinde gerekçe sunma'
      ]
    },
    {
      id: 4,
      icon: Shield,
      title: 'Mahremiyet ve Veri Güvenliği',
      shortDesc: 'Kişisel verilerin korunması ve güvenliği',
      description: 'Öğrenci ve öğretmenlere ait kişisel veriler, KVKK başta olmak üzere ilgili tüm yasal düzenlemelere tam uyumlu bir şekilde korunmalıdır.',
      details: [
        'KVKK ve ilgili yasal düzenlemelere tam uyum',
        'En üst düzeyde güvenlik önlemleri',
        'Verilerin toplanma amacının net olması',
        'Amaç dışında veri kullanımının önlenmesi'
      ],
      examples: [
        'Öğrenci verilerinin şifrelenmiş olarak saklanması',
        'Veri erişim yetkilerinin sınırlandırılması',
        'Düzenli güvenlik denetimleri yapılması'
      ]
    },
    {
      id: 5,
      icon: CheckCircle,
      title: 'Güvenilirlik ve Güvenlik',
      shortDesc: 'Doğru ve tutarlı sonuçlar üretme',
      description: 'Kullanılan YZ sistemleri, teknik olarak doğru ve tutarlı sonuçlar üretmeli, siber güvenlik tehditlerine karşı dayanıklı olmalıdır.',
      details: [
        'Teknik olarak doğru ve tutarlı sonuçlar',
        'Siber güvenlik tehditlerine karşı dayanıklılık',
        'Amaçlandığı şekilde güvenilir performans',
        'Düzenli test ve doğrulama süreçleri'
      ],
      examples: [
        'Otomatik değerlendirme sistemlerinin doğruluk testleri',
        'Güvenlik açıklarına karşı düzenli güncellemeler',
        'Sistem performansının sürekli izlenmesi'
      ]
    },
    {
      id: 6,
      icon: Clipboard,
      title: 'Hesap Verebilirlik ve İnsani Denetim',
      shortDesc: 'İnsan sorumluluğu ve denetimi',
      description: 'YZ sistemlerinin ürettiği sonuçların ve kararların nihai sorumluluğu her zaman insana aittir.',
      details: [
        'YZ kararlarının nihai sorumluluğunun insana ait olması',
        'Kritik kararlarda insan denetim ve onayı',
        'Otomatikleştirilmiş sistemlerde insan müdahalesi imkanı',
        'Şikayet ve itiraz mekanizmalarının bulunması'
      ],
      examples: [
        'Sınıf geçme kararlarında öğretmen onayı',
        'Disiplin işlemlerinde insan değerlendirmesi',
        'Öğrenci yönlendirmelerinde danışman görüşü'
      ]
    },
    {
      id: 7,
      icon: GraduationCap,
      title: 'Pedagojik Değer',
      shortDesc: 'Eğitim amaçlarına hizmet etme',
      description: 'Eğitimde kullanılan her YZ aracı, belirli bir pedagojik amaca hizmet etmeli, öğretim programlarının hedefleriyle uyumlu olmalıdır.',
      details: [
        'Belirli pedagojik amaçlara hizmet etme',
        'Öğretim programlarıyla uyum',
        'Öğrenme-öğretme süreçlerini zenginleştirme',
        'Kanıtlanabilir katma değer sağlama'
      ],
      examples: [
        'Matematik öğretiminde kavramsal anlayışı destekleyen simülasyonlar',
        'Dil öğretiminde konuşma pratiği sağlayan chatbotlar',
        'Fen bilimlerinde sanal laboratuvar deneyimleri'
      ]
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            MEB Eğitimde Yapay Zeka Etik İlkeleri
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Uluslararası çerçevelerden sentezlenen ve Türkiye'nin eğitim bağlamına 
            uyarlanan yedi temel etik ilke.
          </p>
        </div>

        {/* Interactive Principles Explorer */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Principles List */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6">Etik İlkeler</h2>
              <div className="space-y-2">
                {principles.map((principle, index) => (
                  <Button
                    key={principle.id}
                    variant={selectedPrinciple === index ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => setSelectedPrinciple(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <principle.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm">
                          {principle.id}. {principle.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {principle.shortDesc}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Principle Detail */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {React.createElement(principles[selectedPrinciple].icon, {
                        className: "h-6 w-6 text-primary"
                      })}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {principles[selectedPrinciple].id}. {principles[selectedPrinciple].title}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        {principles[selectedPrinciple].description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Temel Gereksinimler:</h4>
                    <ul className="space-y-2">
                      {principles[selectedPrinciple].details.map((detail, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Uygulama Örnekleri:</h4>
                    <ul className="space-y-2">
                      {principles[selectedPrinciple].examples.map((example, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-muted-foreground">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Principles Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">İlkeler Genel Bakış</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((principle, index) => (
              <Card key={principle.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <principle.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {principle.id}. {principle.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {principle.shortDesc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Implementation Context */}
        <section>
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Uygulama Bağlamı</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Eğitim Odaklı Yaklaşım</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Bu yedi ilke, genel yapay zeka etik ilkelerinin eğitim alanının 
                    kendine özgü dinamikleri göz önünde bulundurularak uyarlanmış halidir. 
                    Öğrenci-öğretmen ilişkisi, pedagojik değerler ve gelişimsel özellikler 
                    her ilkenin merkezinde yer almaktadır.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Bütüncül Değerlendirme</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Bu ilkeler birbirinden bağımsız değil, birbirini tamamlayan ve 
                    destekleyen bir bütün oluşturmaktadır. Herhangi bir yapay zeka 
                    uygulamasının değerlendirilmesinde tüm ilkeler birlikte dikkate 
                    alınmalıdır.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default Principles

