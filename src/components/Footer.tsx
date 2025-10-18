import { Mail, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";
import Frame from "../imports/Frame";
import { getUITranslation } from "../lib/translations";

interface FooterProps {
  onNavigate?: (page: string) => void;
  language?: string;
}

export function Footer({ onNavigate, language = "en" }: FooterProps) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const t = getUITranslation(language);

  useEffect(() => {
    setContent(loadContent());
  }, []);

  return (
    <footer className="border-t border-border bg-gradient-to-b from-white to-secondary/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 h-8 w-auto">
              <Frame />
            </div>
            <p className="text-muted-foreground">
              Your friendly hop-on/hop-off adventure through Sintra's magical landscapes.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-primary" onClick={(e) => { e.preventDefault(); onNavigate?.('attractions'); }}>
                  Attractions
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary" onClick={(e) => { e.preventDefault(); onNavigate?.('blog'); }}>
                  Travel Guide
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary" onClick={(e) => { e.preventDefault(); onNavigate?.('buy-ticket'); }}>
                  Buy Day Pass
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary" onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }}>
                  {t.about}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-foreground">{t.contactInfo}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>{content.company.location}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>{content.company.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>{content.company.operatingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {content.company.name}. All rights reserved. Made with ❤️ for travelers.
          </p>
          <div className="flex gap-6">
            <button 
              onClick={() => onNavigate("privacy-policy")} 
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => onNavigate("terms-of-service")} 
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}