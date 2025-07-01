import { Link } from 'react-router-dom'
import { BookOpen, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

const Footer = () => {
  const quickLinks = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'Hakkında', href: '/about' },
    { name: 'Etik İlkeler', href: '/principles' },
    { name: 'Etik Kurul', href: '/committee' },
  ]

  const resources = [
    { name: 'EED Modeli', href: '/assessment' },
    { name: 'Yol Haritası', href: '/roadmap' },
    { name: 'Kaynaklar', href: '/resources' },
    { name: 'İletişim', href: '/contact' },
  ]

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-bold">MEB YZ Etik Çerçevesi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Millî Eğitim Bakanlığı Eğitimde Yapay Zeka Uygulamaları Etik Çerçevesi ve Kurul Yapısı Raporu
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Hızlı Erişim</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Kaynaklar</h3>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">İletişim</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>yapayzeka.etik@meb.gov.tr</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+90 (312) XXX XX XX</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>MEB Merkez Binası, Ankara</span>
              </div>
              <a
                href="https://www.meb.gov.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>www.meb.gov.tr</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Millî Eğitim Bakanlığı. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

