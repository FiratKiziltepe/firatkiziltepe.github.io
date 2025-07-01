import { FileText, Target, Users, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const About = () => {
  const objectives = [
    {
      icon: Target,
      title: 'Temel Amaç',
      description: 'MEB Yapay Zekâ Politika Belgesi\'nde belirtilen eylem maddesi uyarınca, eğitimde kullanılacak yapay zekâ uygulamalarını etik açıdan değerlendirecek ve denetleyecek olan "Yapay Zekâ Uygulamaları Etik Kurulu"nun kuruluşuna dayanak oluşturmak.'
    },
    {
      icon: FileText,
      title: 'Kapsam',
      description: 'Uluslararası standartlara uygun bir çerçeve hazırlamak, etik ilkeler belirlemek ve bu çerçeveyi işletecek olan Etik Kurul\'un yapısı, görevleri ve kullanacağı "Etik Etki Değerlendirme" aracı için somut bir model ortaya koymak.'
    },
    {
      icon: Users,
      title: 'Paydaşlar',
      description: 'Akademisyenler, MEB temsilcileri, öğretmenler, hukuk uzmanları, teknik uzmanlar ve sivil toplum kuruluşlarının katılımıyla çok paydaşlı bir yaklaşım benimsenmiştir.'
    },
    {
      icon: Lightbulb,
      title: 'Yenilikçi Yaklaşım',
      description: 'Türkiye\'nin eğitim bağlamına özel olarak uyarlanmış, insan odaklı, adil, şeffaf ve güvenilir bir "Eğitimde Yapay Zekâ Etik Çerçevesi" önerilmektedir.'
    }
  ]

  const methodology = [
    'UNESCO, Avrupa Birliği, OECD gibi uluslararası kuruluşların etik ilke ve belgelerinin analizi',
    'Çeşitli ülkelerin yapay zeka etik çerçevelerinin karşılaştırmalı incelemesi',
    'Özel sektör yaklaşımlarının değerlendirilmesi',
    'Eğitim alanına özgü etik etki değerlendirme araçlarının sentezi',
    'Türkiye\'nin eğitim sistemi ve yasal çerçevesine uyarlama'
  ]

  const outcomes = [
    'MEB\'in özgün yapısına uygun etik çerçeve',
    'Yedi temel etik ilkenin belirlenmesi',
    'Etik Kurul yapısı ve görevlerinin tanımlanması',
    'Etik Etki Değerlendirme (EED) modelinin geliştirilmesi',
    'Uygulama için somut yol haritasının oluşturulması'
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Rapor Hakkında
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bu rapor, Millî Eğitim Bakanlığı'nın eğitimde yapay zeka uygulamaları için 
            etik kurallar ve kullanım standartları oluşturma hedefi doğrultusunda hazırlanmıştır.
          </p>
        </div>

        {/* Executive Summary */}
        <section className="mb-16">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl">Yönetici Özeti</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Bu rapor, Millî Eğitim Bakanlığı (MEB) politika belgesinde yer alan "Eğitimde yapay zekâ 
                etik kuralları ve kullanım standartlarının oluşturulması" hedefi doğrultusunda, Bakanlık 
                bünyesinde kurulması planlanan "Yapay Zekâ Uygulamaları Etik Kurulu" için temel bir 
                çerçeve sunmaktadır.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Rapor, UNESCO, Avrupa Birliği, OECD gibi uluslararası kuruluşların ve çeşitli ülkelerin 
                yayımladığı etik ilke ve etki değerlendirme belgelerinin analiziyle oluşturulmuştur. 
                Analizler sonucunda, MEB'in özgün yapısına ve ihtiyaçlarına uygun, insan odaklı, adil, 
                şeffaf ve güvenilir bir "Eğitimde Yapay Zekâ Etik Çerçevesi" önerilmekte; bu çerçeveyi 
                işletecek olan Etik Kurul'un yapısı, görevleri ve kullanacağı "Etik Etki Değerlendirme" 
                aracı için somut bir model ortaya konmaktadır.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Objectives */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Amaç ve Hedefler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {objectives.map((objective, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <objective.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{objective.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {objective.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Metodoloji</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Rapor, kapsamlı bir literatür taraması ve karşılaştırmalı analiz metodolojisi 
                kullanılarak hazırlanmıştır. Aşağıdaki adımlar izlenmiştir:
              </p>
              <ul className="space-y-3">
                {methodology.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Çıktılar</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Rapor sonucunda elde edilen temel çıktılar şunlardır:
              </p>
              <ul className="space-y-3">
                {outcomes.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Context */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Eğitimde Yapay Zekânın Yükselişi ve Önemi</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                YZ teknolojilerinin küresel ölçekte eğitim süreçlerine entegrasyonu, kişiselleştirilmiş 
                öğrenme, verimlilik artışı gibi fırsatlar sunarken; veri mahremiyeti, algoritmik yanlılık 
                ve etik kullanım gibi zorlukları da beraberinde getirmektedir.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Bu bağlamda, eğitimde yapay zeka uygulamalarının etik, güvenli ve pedagojik değer 
                odaklı bir şekilde kullanılması için kapsamlı bir çerçeveye ihtiyaç duyulmaktadır. 
                MEB'in bu alandaki öncü rolü, Türkiye'nin eğitim sisteminde yapay zeka teknolojilerinin 
                sorumlu bir şekilde entegre edilmesini sağlayacaktır.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Policy Context */}
        <section>
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">MEB Yapay Zekâ Politika Belgesi ve İlgili Eylem Maddesi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                MEB'in yayımladığı politika belgesinde yer alan aşağıdaki eylem maddesinin hayata 
                geçirilmesi için bu rapor hazırlanmıştır:
              </p>
              <blockquote className="border-l-4 border-primary pl-6 italic text-lg">
                "Yapay Zekâ Uygulamaları Etik Kurulu ve bu kurula bağlı alt komisyonlar kurulacaktır."
              </blockquote>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Bu eylem maddesi, MEB'in eğitimde yapay zeka uygulamalarının etik boyutunu ciddiye 
                aldığını ve bu alanda proaktif bir yaklaşım benimsediğini göstermektedir.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default About

