import { useState } from 'react'
import { FileText, AlertTriangle, Search, Gavel, TrendingUp, CheckCircle, Clock, Users, Database, Shield, Eye, Scale } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const Assessment = () => {
  const [selectedStep, setSelectedStep] = useState(0)

  const processSteps = [
    {
      id: 1,
      icon: FileText,
      title: 'Başvuru',
      duration: '1 gün',
      description: 'YZ projesini geliştiren veya tedarik edecek birim, standart EED Başvuru Formu\'nu doldurarak Kurul\'a sunar.',
      details: [
        'Proje tanımlama ve amaç belirleme',
        'Hedef kitle ve paydaş analizi',
        'Beklenen faydalar ve riskler',
        'Teknik özellikler ve veri gereksinimleri'
      ]
    },
    {
      id: 2,
      icon: AlertTriangle,
      title: 'Ön Değerlendirme ve Risk Belirleme',
      duration: '3 gün',
      description: 'Kurul sekretaryası, başvuruyu inceleyerek projenin risk seviyesini (düşük, orta, yüksek) belirler.',
      details: [
        'Risk seviyesi belirleme (düşük/orta/yüksek)',
        'Otomatik karar alma süreçlerinin analizi',
        'Biyometrik veri kullanımının değerlendirilmesi',
        'Hassas veri işleme durumunun kontrolü'
      ]
    },
    {
      id: 3,
      icon: Search,
      title: 'Detaylı İnceleme',
      duration: '10 gün',
      description: 'İlgili alt komisyonlar, projeyi kendi uzmanlık alanları açısından detaylı olarak inceler ve raporlarını hazırlar.',
      details: [
        'Teknik güvenlik ve veri koruma analizi',
        'Pedagojik değer ve eğitim uygunluğu',
        'Hukuki uyum ve etik ilkeler kontrolü',
        'Paydaş etki analizi'
      ]
    },
    {
      id: 4,
      icon: Gavel,
      title: 'Kurul Kararı',
      duration: '5 gün',
      description: 'Alt komisyon raporları ışığında Etik Kurul, projeyi görüşür ve "Onaylandı", "Revizyon Gerekli" veya "Reddedildi" şeklinde karar verir.',
      details: [
        'Alt komisyon raporlarının değerlendirilmesi',
        'Kurul üyelerinin görüş bildirmesi',
        'Karar alma ve gerekçelendirme',
        'Öneri ve şartların belirlenmesi'
      ]
    },
    {
      id: 5,
      icon: TrendingUp,
      title: 'İzleme',
      duration: '30+ gün',
      description: 'Onaylanan projeler, EED\'de belirtilen azaltım ve izleme planı çerçevesinde periyodik olarak izlenir.',
      details: [
        'Periyodik performans değerlendirmesi',
        'Risk azaltma önlemlerinin kontrolü',
        'Paydaş geri bildirimlerinin toplanması',
        'Gerektiğinde ek önlemlerin alınması'
      ]
    }
  ]

  const formSections = [
    {
      id: 'A',
      title: 'Proje ve Sistem Bilgileri',
      icon: FileText,
      description: 'Projenin adı, sorumlu birim, geliştirici, amaç, hedef kitle, yaşam döngüsü aşaması',
      fields: [
        'Proje adı ve tanımı',
        'Sorumlu birim ve iletişim bilgileri',
        'Geliştirici/tedarikçi bilgileri',
        'Proje amacı ve hedefleri',
        'Hedef kitle analizi',
        'Yaşam döngüsü aşaması'
      ]
    },
    {
      id: 'B',
      title: 'Risk Seviyesi Belirleme',
      icon: AlertTriangle,
      description: 'Yüksek riskli durumları tespit eden sorular (otomatik kararlar, biyometrik veri kullanımı vb.)',
      fields: [
        'Otomatik karar alma süreçleri',
        'Biyometrik veri kullanımı',
        'Hassas kişisel veri işleme',
        'Öğrenci haklarını etkileyen kararlar',
        'Davranışsal profil oluşturma',
        'Yüksek riskli uygulama alanları'
      ]
    },
    {
      id: 'C',
      title: 'Paydaş ve Etki Analizi',
      icon: Users,
      description: 'Öğrenciler, öğretmenler, veliler ve dezavantajlı gruplar üzerindeki potansiyel fayda ve riskler',
      fields: [
        'Öğrenciler üzerindeki etkiler',
        'Öğretmenler üzerindeki etkiler',
        'Veliler üzerindeki etkiler',
        'Dezavantajlı gruplar analizi',
        'Potansiyel faydalar',
        'Potansiyel riskler'
      ]
    },
    {
      id: 'D',
      title: 'Etik İlkelerle Uyum Değerlendirmesi',
      icon: Scale,
      description: 'Yedi etik ilke açısından sistemin durumunun değerlendirilmesi',
      fields: [
        'Öğrenci ve insan odaklılık',
        'Adillik ve kapsayıcılık',
        'Şeffaflık ve açıklanabilirlik',
        'Mahremiyet ve veri güvenliği',
        'Güvenilirlik ve güvenlik',
        'Hesap verebilirlik ve insani denetim',
        'Pedagojik değer'
      ]
    },
    {
      id: 'E',
      title: 'Risk Azaltma ve İzleme Planı',
      icon: Shield,
      description: 'Tespit edilen riskler için alınacak önlemler, sorumlular ve izleme metrikleri',
      fields: [
        'Tespit edilen riskler',
        'Risk azaltma önlemleri',
        'Sorumlu kişi/birimler',
        'İzleme metrikleri',
        'Raporlama sıklığı',
        'Acil durum planları'
      ]
    },
    {
      id: 'F',
      title: 'Değerlendirme Sonucu',
      icon: CheckCircle,
      description: 'Kurul tarafından doldurulacak değerlendirme, karar ve tavsiyeler',
      fields: [
        'Alt komisyon değerlendirmeleri',
        'Kurul kararı',
        'Gerekçe ve açıklamalar',
        'Şartlar ve öneriler',
        'İzleme gereksinimleri',
        'Yeniden değerlendirme tarihi'
      ]
    }
  ]

  const riskLevels = [
    {
      level: 'Düşük Risk',
      color: 'bg-green-50 border-green-200 text-green-800',
      criteria: [
        'Sınırlı veri kullanımı',
        'İnsan denetimi mevcut',
        'Düşük etki alanı',
        'Standart güvenlik önlemleri'
      ],
      process: 'Hızlandırılmış değerlendirme (5-7 gün)'
    },
    {
      level: 'Orta Risk',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      criteria: [
        'Orta düzey veri işleme',
        'Kısmi otomatikleşme',
        'Orta etki alanı',
        'Ek güvenlik önlemleri'
      ],
      process: 'Standart değerlendirme (10-15 gün)'
    },
    {
      level: 'Yüksek Risk',
      color: 'bg-red-50 border-red-200 text-red-800',
      criteria: [
        'Kapsamlı veri işleme',
        'Yüksek otomatikleşme',
        'Geniş etki alanı',
        'Kritik güvenlik gereksinimleri'
      ],
      process: 'Detaylı değerlendirme (15-25 gün)'
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Etik Etki Değerlendirme (EED) Modeli
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Yapay zeka projelerinin etik etkilerini sistematik olarak değerlendiren 
            kapsamlı süreç ve form yapısı.
          </p>
        </div>

        {/* Process Flow */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Süreç Akışı</h2>
          
          {/* Timeline Navigation */}
          <div className="flex flex-wrap justify-center mb-8 gap-2">
            {processSteps.map((step, index) => (
              <Button
                key={step.id}
                variant={selectedStep === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStep(index)}
                className="flex items-center space-x-2"
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.id}. {step.title}</span>
                <span className="sm:hidden">{step.id}</span>
              </Button>
            ))}
          </div>

          {/* Selected Step Detail */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {React.createElement(processSteps[selectedStep].icon, {
                      className: "h-6 w-6 text-primary"
                    })}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {processSteps[selectedStep].id}. {processSteps[selectedStep].title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Süre: {processSteps[selectedStep].duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="text-base mt-4">
                {processSteps[selectedStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">Detaylar:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {processSteps[selectedStep].details.map((detail, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Process Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {processSteps.map((step, index) => (
              <Card key={step.id} className={`text-center ${selectedStep === index ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm">{step.id}. {step.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">{step.duration}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Risk Levels */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Risk Seviyeleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskLevels.map((risk, index) => (
              <Card key={index} className={`border-2 ${risk.color}`}>
                <CardHeader>
                  <CardTitle className="text-center">{risk.level}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Kriterler:</h4>
                    <ul className="space-y-1">
                      {risk.criteria.map((criterion, idx) => (
                        <li key={idx} className="text-sm flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0"></div>
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Süreç:</h4>
                    <p className="text-sm">{risk.process}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Form Sections */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">EED Formu Bölümleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formSections.map((section, index) => (
              <Card key={section.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      Bölüm {section.id}: {section.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-3">İçerik:</h4>
                  <ul className="space-y-1">
                    {section.fields.map((field, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                        {field}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Assessment

