import { Calendar, CheckCircle, Clock, Target, TrendingUp, Users, BookOpen, Gavel } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const Roadmap = () => {
  const phases = [
    {
      id: 1,
      title: 'Kısa Vade (0-6 Ay)',
      period: '2025 Q1-Q2',
      color: 'bg-green-50 border-green-200',
      icon: Target,
      description: 'Temel altyapının oluşturulması ve kurumsal hazırlık',
      objectives: [
        {
          title: 'Yasal Altyapı Oluşturma',
          tasks: [
            'Etik Kurul\'un yasal statüsünün belirlenmesi',
            'Yönetmelik ve yönergelerin hazırlanması',
            'Bütçe ve kaynak tahsisinin yapılması'
          ],
          duration: '3 ay',
          responsible: 'MEB Hukuk Müşavirliği'
        },
        {
          title: 'Kurul Üyelerinin Atanması',
          tasks: [
            'Üye seçim kriterlerinin netleştirilmesi',
            'Aday havuzunun oluşturulması',
            'Kurucu üyelerin atanması ve görevlendirilmesi'
          ],
          duration: '2 ay',
          responsible: 'MEB Üst Yönetimi'
        },
        {
          title: 'Etik İlkeler ve EED Formu',
          tasks: [
            'Etik ilkelerin nihai hale getirilmesi',
            'EED formunun detaylandırılması',
            'Değerlendirme kriterlerinin belirlenmesi'
          ],
          duration: '4 ay',
          responsible: 'Etik Kurul Çalışma Grubu'
        }
      ]
    },
    {
      id: 2,
      title: 'Orta Vade (6-18 Ay)',
      period: '2025 Q3 - 2026 Q2',
      color: 'bg-blue-50 border-blue-200',
      icon: Users,
      description: 'Pilot uygulamalar ve kapasite geliştirme',
      objectives: [
        {
          title: 'Pilot Projeler',
          tasks: [
            'Seçili YZ projelerinde EED sürecinin test edilmesi',
            'Süreç iyileştirmelerinin yapılması',
            'Başarı hikayelerinin belgelenmesi'
          ],
          duration: '8 ay',
          responsible: 'Etik Kurul ve Alt Komisyonlar'
        },
        {
          title: 'Eğitim ve Farkındalık',
          tasks: [
            'Öğretmenler için YZ etiği eğitim programları',
            'Yöneticiler için farkındalık seminerleri',
            'Rehber materyallerin hazırlanması'
          ],
          duration: '12 ay',
          responsible: 'MEB Öğretmen Yetiştirme Genel Müdürlüğü'
        },
        {
          title: 'Sistem Geliştirme',
          tasks: [
            'EED başvuru sisteminin geliştirilmesi',
            'İzleme ve raporlama araçlarının oluşturulması',
            'Veri tabanı ve arşiv sisteminin kurulması'
          ],
          duration: '10 ay',
          responsible: 'MEB Bilgi İşlem Dairesi'
        }
      ]
    },
    {
      id: 3,
      title: 'Uzun Vade (18-36 Ay)',
      period: '2026 Q3 - 2027 Q4',
      color: 'bg-purple-50 border-purple-200',
      icon: TrendingUp,
      description: 'Tam uygulama ve sürekli iyileştirme',
      objectives: [
        {
          title: 'Tam Uygulama',
          tasks: [
            'Tüm YZ projeleri için EED\'nin zorunlu hale getirilmesi',
            'Sürekli izleme sisteminin devreye alınması',
            'Performans değerlendirme mekanizmalarının işletilmesi'
          ],
          duration: '18 ay',
          responsible: 'Tüm MEB Birimleri'
        },
        {
          title: 'Sürekli İyileştirme',
          tasks: [
            'Çerçevenin teknolojik gelişmelere göre güncellenmesi',
            'Uluslararası deneyimlerden öğrenme',
            'Paydaş geri bildirimlerinin entegrasyonu'
          ],
          duration: 'Sürekli',
          responsible: 'Etik Kurul'
        },
        {
          title: 'Uluslararası İşbirliği',
          tasks: [
            'Uluslararası etik kuruluşlarla işbirliği',
            'Deneyim paylaşımı ve ortak projeler',
            'Küresel standartlara katkı sağlama'
          ],
          duration: '12 ay',
          responsible: 'MEB Dış İlişkiler Koordinatörlüğü'
        }
      ]
    }
  ]

  const milestones = [
    {
      date: '2025 Q1',
      title: 'Etik Kurul Kurulumu',
      description: 'Yasal altyapı tamamlanır ve kurul üyeleri atanır',
      status: 'planned'
    },
    {
      date: '2025 Q2',
      title: 'İlk EED Değerlendirmesi',
      description: 'Pilot proje üzerinde ilk etik etki değerlendirmesi yapılır',
      status: 'planned'
    },
    {
      date: '2025 Q4',
      title: 'Eğitim Programları Başlatılır',
      description: 'Öğretmen ve yöneticiler için kapsamlı eğitim programları başlar',
      status: 'planned'
    },
    {
      date: '2026 Q2',
      title: 'Sistem Tam Operasyonel',
      description: 'EED süreci tüm yeni YZ projeleri için zorunlu hale gelir',
      status: 'planned'
    },
    {
      date: '2027 Q1',
      title: 'Uluslararası Tanınırlık',
      description: 'MEB etik çerçevesi uluslararası platformlarda tanınır',
      status: 'planned'
    }
  ]

  const successMetrics = [
    {
      category: 'Süreç Etkinliği',
      metrics: [
        'EED başvuru süresinin ortalama 15 günde tamamlanması',
        'Kurul kararlarının %95 oranında zamanında verilmesi',
        'Paydaş memnuniyet oranının %80\'in üzerinde olması'
      ]
    },
    {
      category: 'Etik Uyum',
      metrics: [
        'Onaylanan projelerin %100\'ünde etik ilkelere uyum',
        'Risk azaltma önlemlerinin %90 oranında uygulanması',
        'Etik ihlal vakalarında %100 müdahale oranı'
      ]
    },
    {
      category: 'Kapasite Geliştirme',
      metrics: [
        'Yılda en az 1000 eğitim katılımcısı',
        'Tüm YZ proje yöneticilerinin eğitim alması',
        'Etik farkındalık seviyesinde %50 artış'
      ]
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Uygulama Yol Haritası
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            MEB Yapay Zeka Etik Çerçevesi'nin hayata geçirilmesi için 
            kısa, orta ve uzun vadeli uygulama planı.
          </p>
        </div>

        {/* Timeline Overview */}
        <section className="mb-16">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block"></div>
            
            {/* Phase Cards */}
            <div className="space-y-12">
              {phases.map((phase, index) => (
                <div key={phase.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute left-6 w-4 h-4 bg-primary rounded-full border-4 border-background hidden md:block"></div>
                  
                  {/* Phase Card */}
                  <div className="md:ml-16">
                    <Card className={`border-2 ${phase.color}`}>
                      <CardHeader>
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <phase.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{phase.title}</CardTitle>
                            <CardDescription className="text-base">
                              {phase.period} • {phase.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {phase.objectives.map((objective, idx) => (
                            <div key={idx} className="space-y-3">
                              <h4 className="font-semibold text-lg">{objective.title}</h4>
                              <div className="space-y-2">
                                {objective.tasks.map((task, taskIdx) => (
                                  <div key={taskIdx} className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground">{task}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>Süre: {objective.duration}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                                  <Users className="h-4 w-4" />
                                  <span>Sorumlu: {objective.responsible}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Milestones */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Önemli Kilometre Taşları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((milestone, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{milestone.title}</CardTitle>
                  <CardDescription className="text-primary font-semibold">
                    {milestone.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Success Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Başarı Metrikleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successMetrics.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.metrics.map((metric, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{metric}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Implementation Challenges */}
        <section>
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Uygulama Zorlukları ve Çözümler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Potansiyel Zorluklar</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Paydaş direnci ve değişim yönetimi</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Teknik kapasite ve uzmanlık eksikliği</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Bütçe ve kaynak kısıtları</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Hızlı teknolojik değişim</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Önerilen Çözümler</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Kapsamlı iletişim ve eğitim stratejisi</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Dış uzman desteği ve işbirlikleri</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Aşamalı uygulama ve pilot projeler</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">Sürekli güncelleme ve iyileştirme mekanizması</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default Roadmap

