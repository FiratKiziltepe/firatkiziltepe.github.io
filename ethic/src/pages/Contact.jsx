import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, FileText, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Form submission logic would go here
    console.log('Form submitted:', formData)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'E-posta',
      value: 'yapayzeka.etik@meb.gov.tr',
      description: 'Genel sorular ve başvurular için'
    },
    {
      icon: Phone,
      title: 'Telefon',
      value: '+90 (312) XXX XX XX',
      description: 'Çalışma saatleri içinde'
    },
    {
      icon: MapPin,
      title: 'Adres',
      value: 'MEB Merkez Binası, Ankara',
      description: 'Atatürk Bulvarı No: 98, Kızılay/Ankara'
    },
    {
      icon: Clock,
      title: 'Çalışma Saatleri',
      value: 'Pazartesi - Cuma: 08:30 - 17:30',
      description: 'Resmi tatiller hariç'
    }
  ]

  const contactTypes = [
    {
      icon: MessageSquare,
      title: 'Genel Bilgi',
      description: 'Etik çerçeve ve süreçler hakkında genel sorular'
    },
    {
      icon: FileText,
      title: 'EED Başvurusu',
      description: 'Etik Etki Değerlendirme başvuru süreci'
    },
    {
      icon: Users,
      title: 'Eğitim ve Danışmanlık',
      description: 'Eğitim programları ve danışmanlık hizmetleri'
    }
  ]

  const departments = [
    {
      name: 'Etik Kurul Sekretaryası',
      email: 'etik.kurul@meb.gov.tr',
      responsibility: 'EED başvuruları ve kurul işlemleri'
    },
    {
      name: 'Teknik Değerlendirme',
      email: 'teknik.degerlendirme@meb.gov.tr',
      responsibility: 'Teknik güvenlik ve veri koruma'
    },
    {
      name: 'Pedagojik Değerlendirme',
      email: 'pedagojik.degerlendirme@meb.gov.tr',
      responsibility: 'Eğitim değeri ve pedagojik uygunluk'
    },
    {
      name: 'Hukuki Değerlendirme',
      email: 'hukuki.degerlendirme@meb.gov.tr',
      responsibility: 'Yasal uyum ve etik ilkeler'
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            İletişim
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            MEB Yapay Zeka Etik Çerçevesi ile ilgili sorularınız için 
            bizimle iletişime geçebilirsiniz.
          </p>
        </div>

        {/* Contact Information */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">İletişim Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-2">{info.value}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Form and Types */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Types */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6">İletişim Türleri</h2>
              <div className="space-y-4">
                {contactTypes.map((type, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <type.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription>{type.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Bize Ulaşın</CardTitle>
                  <CardDescription>
                    Sorularınızı ve önerilerinizi aşağıdaki form aracılığıyla iletebilirsiniz.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Ad Soyad *
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Adınızı ve soyadınızı girin"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          E-posta *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="E-posta adresinizi girin"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Kurum/Organizasyon
                      </label>
                      <Input
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        placeholder="Bağlı olduğunuz kurum veya organizasyon"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Konu *
                      </label>
                      <Select onValueChange={(value) => setFormData({...formData, subject: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Konu seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Genel Bilgi</SelectItem>
                          <SelectItem value="eed">EED Başvurusu</SelectItem>
                          <SelectItem value="training">Eğitim ve Danışmanlık</SelectItem>
                          <SelectItem value="technical">Teknik Destek</SelectItem>
                          <SelectItem value="legal">Hukuki Sorular</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Mesaj *
                      </label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Mesajınızı detaylı olarak yazın..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Mesajı Gönder
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Department Contacts */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Birim İletişim Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((dept, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <CardDescription>{dept.responsibility}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <a 
                      href={`mailto:${dept.email}`}
                      className="text-primary hover:underline"
                    >
                      {dept.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Additional Information */}
        <section>
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Önemli Notlar</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Yanıt Süreleri</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Genel sorular: 2-3 iş günü</li>
                    <li>• EED başvuruları: Süreç takvimi uyarınca</li>
                    <li>• Teknik destek: 1-2 iş günü</li>
                    <li>• Acil durumlar: Aynı gün</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Başvuru Gereksinimleri</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• EED başvuruları için resmi form kullanılmalıdır</li>
                    <li>• Teknik sorular için sistem detayları eklenmelidir</li>
                    <li>• Eğitim talepleri için katılımcı sayısı belirtilmelidir</li>
                    <li>• Tüm başvurular kurumsal e-posta ile yapılmalıdır</li>
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

export default Contact

