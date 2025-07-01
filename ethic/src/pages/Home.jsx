import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, Shield, Target, TrendingUp, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import aiEthicsImage from '../assets/ai_ethics_society.png'
import aiFrameworkImage from '../assets/ai_ethics_framework.webp'

const Home = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Uluslararası Standartlar',
      description: 'UNESCO, AB ve OECD standartlarına uygun etik çerçeve',
      link: '/international'
    },
    {
      icon: Shield,
      title: '7 Temel Etik İlke',
      description: 'Öğrenci odaklılık, adillik, şeffaflık ve güvenlik ilkeleri',
      link: '/principles'
    },
    {
      icon: Users,
      title: 'Etik Kurul Yapısı',
      description: 'Çok paydaşlı ve uzman kurul yapısı',
      link: '/committee'
    },
    {
      icon: Target,
      title: 'EED Modeli',
      description: 'Sistematik etik etki değerlendirme süreci',
      link: '/assessment'
    }
  ]

  const stats = [
    { number: '14', label: 'Uluslararası Kaynak' },
    { number: '7', label: 'Etik İlke' },
    { number: '3', label: 'Alt Komisyon' },
    { number: '5', label: 'Uygulama Adımı' }
  ]

  const highlights = [
    'İnsan odaklı yapay zeka yaklaşımı',
    'Veri mahremiyeti ve güvenlik önceliği',
    'Algoritmik yanlılığın önlenmesi',
    'Şeffaf ve açıklanabilir sistemler',
    'Pedagojik değer odaklı uygulama',
    'Sürekli izleme ve değerlendirme'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary text-primary-foreground">
        <div className="absolute inset-0 hero-pattern"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Eğitimde Yapay Zeka
                <span className="block text-accent">Etik Çerçevesi</span>
              </h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed">
                Millî Eğitim Bakanlığı'nın eğitimde yapay zeka uygulamaları için geliştirdiği 
                kapsamlı etik çerçeve ve kurul yapısı raporu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/about">
                    Raporu Keşfet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link to="/principles">
                    Etik İlkeler
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={aiEthicsImage}
                alt="Yapay Zeka Etiği"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kapsamlı Etik Çerçeve
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Uluslararası standartlara uygun, Türkiye'nin eğitim bağlamına özel olarak 
              uyarlanmış etik ilkeler ve uygulama modeli.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                    <Link to={feature.link} className="text-primary hover:text-primary/80">
                      Detayları Gör
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Temel Özellikler
              </h2>
              <div className="space-y-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button asChild size="lg">
                  <Link to="/roadmap">
                    Yol Haritasını İncele
                    <TrendingUp className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div>
              <img
                src={aiFrameworkImage}
                alt="Yapay Zeka Etik Çerçevesi"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Eğitimde Etik Yapay Zeka Geleceği
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Türkiye'nin eğitim sisteminde yapay zeka uygulamalarının etik, güvenli ve 
            pedagojik değer odaklı kullanımı için geliştirilen kapsamlı çerçeve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/contact">
                İletişime Geç
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/resources">
                Kaynakları İncele
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

