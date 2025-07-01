import { Users, Target, Shield, BookOpen, Gavel, FileCheck, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const Committee = () => {
  const structure = {
    title: 'MEB Yapay Zekâ Uygulamaları Etik Kurulu (MEB-YZEK)',
    mission: 'Eğitimde kullanılan yapay zeka uygulamalarının etik ilkelere uygunluğunu değerlendirmek ve denetlemek',
    vision: 'Türkiye\'nin eğitim sisteminde yapay zeka teknolojilerinin etik, güvenli ve pedagojik değer odaklı kullanımını sağlamak'
  }

  const responsibilities = [
    {
      icon: FileCheck,
      title: 'Etik Etki Değerlendirmesi',
      description: 'YZ projelerinin etik etkilerini sistematik olarak değerlendirme ve onaylama'
    },
    {
      icon: Shield,
      title: 'Denetim ve İzleme',
      description: 'Onaylanan projelerin uygulanma sürecini izleme ve denetleme'
    },
    {
      icon: BookOpen,
      title: 'Rehberlik ve Eğitim',
      description: 'Paydaşlara yönelik etik rehberler hazırlama ve farkındalık eğitimleri düzenleme'
    },
    {
      icon: Gavel,
      title: 'Politika Geliştirme',
      description: 'Etik ilkeler ve standartları güncelleme, yeni politikalar önerme'
    }
  ]

  const subCommittees = [
    {
      name: 'Teknik Değerlendirme Alt Komisyonu',
      focus: 'Teknik güvenlik, veri koruma, algoritma adaleti',
      members: 'Bilgisayar mühendisleri, veri bilimciler, siber güvenlik uzmanları',
      responsibilities: [
        'Algoritma adaleti ve yanlılık analizi',
        'Veri güvenliği ve mahremiyet değerlendirmesi',
        'Teknik güvenlik açıklarının tespiti',
        'Sistem performansı ve güvenilirlik analizi'
      ]
    },
    {
      name: 'Pedagojik Değerlendirme Alt Komisyonu',
      focus: 'Eğitim değeri, öğrenme çıktıları, pedagojik uygunluk',
      members: 'Eğitim uzmanları, öğretmenler, eğitim teknolojisi uzmanları',
      responsibilities: [
        'Pedagojik değer ve eğitim hedefleriyle uyum analizi',
        'Öğrenme-öğretme süreçlerine etkinin değerlendirilmesi',
        'Öğretmen ve öğrenci deneyiminin analizi',
        'Eğitim programlarıyla entegrasyon değerlendirmesi'
      ]
    },
    {
      name: 'Hukuki ve Etik Değerlendirme Alt Komisyonu',
      focus: 'Yasal uyum, etik ilkeler, insan hakları',
      members: 'Hukukçular, etik uzmanları, insan hakları uzmanları',
      responsibilities: [
        'KVKK ve diğer yasal düzenlemelere uyum kontrolü',
        'Etik ilkelere uygunluk değerlendirmesi',
        'İnsan hakları ve temel özgürlükler analizi',
        'Hukuki risk değerlendirmesi'
      ]
    }
  ]

  const membershipCriteria = [
    {
      category: 'Akademik Üyeler',
      criteria: [
        'Yapay zeka, eğitim teknolojileri veya etik alanında doktora derecesi',
        'En az 5 yıl akademik deneyim',
        'Konuyla ilgili yayınları bulunması'
      ]
    },
    {
      category: 'MEB Temsilcileri',
      criteria: [
        'Eğitim yönetimi alanında en az 10 yıl deneyim',
        'Teknoloji entegrasyonu konusunda bilgi ve deneyim',
        'Üst düzey yöneticilik deneyimi'
      ]
    },
    {
      category: 'Sektör Uzmanları',
      criteria: [
        'Yapay zeka veya eğitim teknolojileri alanında en az 7 yıl deneyim',
        'Etik ve sorumlu teknoloji geliştirme konusunda bilgi',
        'Proje yönetimi ve değerlendirme deneyimi'
      ]
    },
    {
      category: 'Sivil Toplum Temsilcileri',
      criteria: [
        'Eğitim, teknoloji veya insan hakları alanında faaliyet',
        'Paydaş temsil kabiliyeti',
        'Etik konularda farkındalık ve deneyim'
      ]
    }
  ]

  const operatingPrinciples = [
    'Bağımsızlık: Kurul, kararlarını hiçbir dış baskı altında kalmadan alır',
    'Şeffaflık: Değerlendirme süreçleri ve kriterleri açık ve anlaşılırdır',
    'Çok paydaşlılık: Farklı perspektiflerin temsil edilmesi sağlanır',
    'Kanıt temelli karar alma: Kararlar bilimsel veriler ve analizlere dayanır',
    'Sürekli öğrenme: Kurul, deneyimlerden öğrenerek süreçlerini geliştirir'
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            MEB Yapay Zekâ Uygulamaları Etik Kurulu
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Eğitimde yapay zeka uygulamalarının etik, güvenli ve pedagojik değer odaklı 
            kullanımını sağlamak için oluşturulan çok paydaşlı kurul yapısı.
          </p>
        </div>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-6 w-6 text-primary" />
                  <span>Misyon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {structure.mission}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-secondary" />
                  <span>Vizyon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {structure.vision}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Responsibilities */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Görev ve Sorumluluklar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {responsibilities.map((responsibility, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <responsibility.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{responsibility.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {responsibility.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sub-committees */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Alt Komisyonlar</h2>
          <div className="space-y-8">
            {subCommittees.map((committee, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{committee.name}</CardTitle>
                  <CardDescription className="text-base">
                    <strong>Odak Alanı:</strong> {committee.focus}
                  </CardDescription>
                  <CardDescription className="text-base">
                    <strong>Üye Profili:</strong> {committee.members}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-3">Sorumluluklar:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {committee.responsibilities.map((responsibility, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Membership Criteria */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Üyelik Kriterleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {membershipCriteria.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.criteria.map((criterion, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Operating Principles */}
        <section>
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Çalışma İlkeleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operatingPrinciples.map((principle, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-background rounded-lg">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{principle}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default Committee

