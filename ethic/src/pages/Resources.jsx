import { Download, ExternalLink, BookOpen, FileText, Video, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const Resources = () => {
  const documents = [
    {
      title: 'MEB Yapay Zeka Etik Çerçevesi Raporu (Tam Metin)',
      description: 'Kapsamlı rapor dokümanı - PDF formatında',
      type: 'PDF',
      size: '2.5 MB',
      icon: FileText,
      downloadable: true
    },
    {
      title: 'Etik İlkeler Özet Kılavuzu',
      description: 'Yedi temel etik ilkenin özet açıklaması',
      type: 'PDF',
      size: '850 KB',
      icon: BookOpen,
      downloadable: true
    },
    {
      title: 'EED Başvuru Formu Taslağı',
      description: 'Etik Etki Değerlendirme başvuru formu',
      type: 'PDF',
      size: '1.2 MB',
      icon: FileText,
      downloadable: true
    },
    {
      title: 'Uygulama Rehberi',
      description: 'Paydaşlar için adım adım uygulama kılavuzu',
      type: 'PDF',
      size: '1.8 MB',
      icon: BookOpen,
      downloadable: true
    }
  ]

  const externalLinks = [
    {
      title: 'UNESCO AI Ethics Recommendation',
      description: 'UNESCO\'nun yapay zeka etiği tavsiyesi',
      url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
      organization: 'UNESCO'
    },
    {
      title: 'EU Ethics Guidelines for Trustworthy AI',
      description: 'Avrupa Birliği güvenilir yapay zeka etik yönergeleri',
      url: 'https://digital-strategy.ec.europa.eu/en/library/ethics-guidelines-trustworthy-ai',
      organization: 'European Commission'
    },
    {
      title: 'OECD AI Principles',
      description: 'OECD yapay zeka ilkeleri',
      url: 'https://oecd.ai/en/ai-principles',
      organization: 'OECD'
    },
    {
      title: 'Microsoft Responsible AI Impact Assessment',
      description: 'Microsoft sorumlu yapay zeka etki değerlendirme şablonu',
      url: 'https://www.microsoft.com/en-us/ai/responsible-ai',
      organization: 'Microsoft'
    },
    {
      title: 'Partnership on AI',
      description: 'Yapay zeka ortaklığı platformu',
      url: 'https://www.partnershiponai.org/',
      organization: 'Partnership on AI'
    },
    {
      title: 'AI Ethics Lab',
      description: 'Yapay zeka etiği araştırma laboratuvarı',
      url: 'https://aiethicslab.com/',
      organization: 'AI Ethics Lab'
    }
  ]

  const videos = [
    {
      title: 'Yapay Zeka Etiği Nedir?',
      description: 'Temel kavramlar ve önem',
      duration: '15 dakika',
      type: 'Eğitim Videosu'
    },
    {
      title: 'Eğitimde YZ Uygulamaları',
      description: 'Örnekler ve en iyi uygulamalar',
      duration: '20 dakika',
      type: 'Örnek Olay'
    },
    {
      title: 'EED Süreci Nasıl İşler?',
      description: 'Adım adım süreç açıklaması',
      duration: '12 dakika',
      type: 'Süreç Rehberi'
    }
  ]

  const faqs = [
    {
      question: 'Etik Etki Değerlendirmesi zorunlu mudur?',
      answer: 'Evet, MEB bünyesinde geliştirilen veya tedarik edilen tüm yapay zeka uygulamaları için EED süreci zorunludur. Bu, öğrenci ve öğretmenlerin güvenliğini sağlamak için kritik bir adımdır.'
    },
    {
      question: 'EED süreci ne kadar sürer?',
      answer: 'Süre, projenin risk seviyesine bağlıdır. Düşük riskli projeler 5-7 gün, orta riskli projeler 10-15 gün, yüksek riskli projeler ise 15-25 gün sürebilir.'
    },
    {
      question: 'Hangi projeler yüksek riskli sayılır?',
      answer: 'Otomatik karar alma süreçleri içeren, biyometrik veri kullanan, öğrenci haklarını doğrudan etkileyen veya hassas kişisel veri işleyen projeler yüksek riskli kategorisinde değerlendirilir.'
    },
    {
      question: 'EED başvurusu kim tarafından yapılır?',
      answer: 'Projeyi geliştiren veya tedarik edecek MEB birimi tarafından yapılır. Başvuru, proje sorumlusu tarafından imzalanmalıdır.'
    },
    {
      question: 'Etik Kurul kararlarına itiraz edilebilir mi?',
      answer: 'Evet, kurul kararlarına karşı belirtilen süre içinde gerekçeli itiraz yapılabilir. İtirazlar, kurul tarafından yeniden değerlendirilir.'
    },
    {
      question: 'Mevcut projeler için EED gerekli mi?',
      answer: 'Halihazırda kullanımda olan projeler için geçiş dönemi tanınacaktır. Ancak tüm mevcut projeler belirli bir süre içinde EED sürecinden geçirilecektir.'
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Kaynaklar ve Materyaller
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            MEB Yapay Zeka Etik Çerçevesi ile ilgili dokümanlar, rehberler, 
            dış kaynaklar ve sıkça sorulan sorular.
          </p>
        </div>

        {/* Downloadable Documents */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">İndirilebilir Dokümanlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <doc.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {doc.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {doc.type} • {doc.size}
                    </div>
                    <Button size="sm" className="group-hover:bg-primary/90">
                      <Download className="h-4 w-4 mr-2" />
                      İndir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* External Links */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Dış Kaynaklar ve Referanslar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {externalLinks.map((link, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{link.organization}</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ziyaret Et
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Educational Videos */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Eğitim Videoları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-center">{video.title}</CardTitle>
                  <CardDescription className="text-center">
                    {video.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-sm text-muted-foreground mb-4">
                    {video.type} • {video.duration}
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Video className="h-4 w-4 mr-2" />
                    Yakında
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Sıkça Sorulan Sorular</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-start space-x-3">
                    <HelpCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <span>{faq.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed pl-9">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Resources

