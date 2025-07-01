import { Globe, Flag, BarChart3, Building } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const International = () => {
  const frameworks = [
    {
      icon: Globe,
      title: 'UNESCO Yaklaşımı',
      year: '2021',
      description: 'Yapay Zekâ Etiği Tavsiyesi ile küresel standart belirleme',
      principles: [
        'İnsan haklarının korunması ve geliştirilmesi',
        'Çevre ve ekosistemlerin gelişimi',
        'Çeşitlilik ve kapsayıcılığın sağlanması',
        'Barışçıl, adil ve birbirine bağlı toplumlar'
      ],
      keyPoints: [
        'Orantılılık ve zarar vermeme',
        'Güvenlik ve adillik',
        'Mahremiyet ve veri koruma',
        'Şeffaflık ve açıklanabilirlik'
      ]
    },
    {
      icon: Flag,
      title: 'Avrupa Birliği Yaklaşımı',
      year: '2019',
      description: 'İnsan odaklı yapay zeka yaklaşımı ve güvenilir YZ yönergeleri',
      principles: [
        'Yasalara uygun sistemler',
        'Etik sistemler',
        'Teknik olarak sağlam sistemler'
      ],
      keyPoints: [
        'İnsani denetim ve gözetim',
        'Teknik sağlamlık ve güvenlik',
        'Mahremiyet ve veri yönetişimi',
        'Şeffaflık ve hesap verebilirlik'
      ]
    },
    {
      icon: BarChart3,
      title: 'OECD Yaklaşımı',
      year: '2020',
      description: 'Eğitimde Güvenilir Yapay Zekâ ve güven odaklı yaklaşım',
      principles: [
        'Kişiselleştirilmiş öğrenme',
        'Özel ihtiyaçları olan öğrencilere destek',
        'Öngörücü analizler',
        'Sistemsel uygulamalar'
      ],
      keyPoints: [
        'Veri mahremiyeti',
        'Güvenlik önceliği',
        'Önyargı önleme',
        'Sosyal adalet ve eşitlik'
      ]
    },
    {
      icon: Building,
      title: 'Ülke ve Özel Sektör Örnekleri',
      year: '2022-2024',
      description: 'Çeşitli ülke ve şirketlerin etik çerçeveleri',
      principles: [
        'Avustralya: 8 temel ilke',
        'ABD: Human-in-the-loop yaklaşımı',
        'Hong Kong: 12 etik ilke',
        'Microsoft: Sorumlu YZ şablonu'
      ],
      keyPoints: [
        'İnsan merkezli değerler',
        'Adillik ve güvenilirlik',
        'Şeffaflık ve sorgulanabilirlik',
        'Hesap verebilirlik'
      ]
    }
  ]

  const commonThemes = [
    {
      title: 'İnsan Odaklılık ve Esenlik',
      description: 'YZ\'nin insanlığa hizmet etmesi, bireysel ve toplumsal refahı artırması ve insan onurunu koruması. Teknoloji bir amaç değil, insanın gelişimini destekleyen bir araç olarak görülmelidir.',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Adillik, Hakkaniyet ve Kapsayıcılık',
      description: 'YZ sistemlerinin mevcut toplumsal eşitsizlikleri pekiştirmemesi, aksine azaltması. Algoritmik yanlılığın önlenmesi ve dezavantajlı grupların korunması.',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Şeffaflık ve Açıklanabilirlik',
      description: 'YZ sistemlerinin nasıl çalıştığı, hangi verilere dayandığı ve kararlarını nasıl aldığının anlaşılır olması. "Kara kutu" sistemlere karşı güvence.',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      title: 'Güvenilirlik, Güvenlik ve Mahremiyet',
      description: 'YZ sistemlerinin teknik olarak sağlam, siber saldırılara karşı güvenli olması ve veri mahremiyetinin korunması.',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Hesap Verebilirlik ve Sorumluluk',
      description: 'YZ sistemlerinin neden olduğu sonuçlardan ve kararlardan nihai olarak insanların sorumlu tutulması.',
      color: 'bg-red-50 border-red-200'
    },
    {
      title: 'İnsani Denetim ve Yetki',
      description: '"Döngüde insan" (human-in-the-loop) prensibi ile kritik kararlarda insanın sürece dahil olması ve YZ kararlarını geçersiz kılabilmesi.',
      color: 'bg-indigo-50 border-indigo-200'
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Uluslararası Etik Çerçeveleri
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Yapay zeka etiği konusunda öncü kuruluşların ve ülkelerin geliştirdiği 
            çerçevelerin karşılaştırmalı analizi.
          </p>
        </div>

        {/* International Frameworks */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Başlıca Uluslararası Yaklaşımlar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {frameworks.map((framework, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <framework.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{framework.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {framework.year}
                      </CardDescription>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {framework.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Temel Değerler:</h4>
                      <ul className="space-y-1">
                        {framework.principles.map((principle, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {principle}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Ana İlkeler:</h4>
                      <ul className="space-y-1">
                        {framework.keyPoints.map((point, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Themes */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Ortak Temalar ve Evrensel İlkeler</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            İncelenen tüm uluslararası çerçeveler, farklı terminolojiler kullansalar da, 
            evrensel olarak kabul görmüş ortak ilkeler etrafında birleşmektedir.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commonThemes.map((theme, index) => (
              <Card key={index} className={`border-2 ${theme.color}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{theme.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {theme.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Synthesis */}
        <section>
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Sentez ve Çıkarımlar</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Küresel Fikir Birliği</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Farklı coğrafyaların benzer temel değerler etrafında toplandığı görülmektedir. 
                    Bu durum, yapay zeka etiği konusunda küresel bir fikir birliği oluştuğunu 
                    ve MEB'in geliştireceği çerçevenin uluslararası standartlarla uyumlu 
                    olabileceğini göstermektedir.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Eğitime Özgü Yaklaşım</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Eğitim alanının kendine özgü dinamikleri (öğrenci-öğretmen ilişkisi, 
                    pedagojik değerler, gelişimsel özellikler) göz önünde bulundurularak, 
                    genel etik ilkelerin eğitim bağlamına uyarlanması gerekmektedir.
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

export default International

