import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";
import { Logo } from "./Logo";
import { getUITranslation, getTranslation } from "../lib/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface FooterProps {
  onNavigate?: (page: string) => void;
  language?: string;
}

export function Footer({ onNavigate, language = "en" }: FooterProps) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const t = getUITranslation(language);
  const legacyContent = getTranslation(language);

  useEffect(() => {
    setContent(loadContent());
  }, []);

  return (
    <footer className="border-t border-border bg-gradient-to-b from-white to-secondary/30 py-10 sm:py-12 safe-bottom" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="mb-4 h-8 w-auto">
              <Logo />
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Your friendly hop-on/hop-off adventure through Sintra's magical landscapes.
            </p>
          </div>

          <div>
            <h3 className="mb-3 sm:mb-4 text-foreground text-base">{legacyContent.footer.quickLinks}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <button className="w-full text-left py-1 transition-colors hover:text-primary" onClick={() => onNavigate?.('hop-on-service')}>
                  Hop On Service
                </button>
              </li>
              <li>
                <button className="w-full text-left py-1 transition-colors hover:text-primary" onClick={() => onNavigate?.('attractions')}>
                  {legacyContent.footer.attractions}
                </button>
              </li>
              <li>
                <button className="w-full text-left py-1 transition-colors hover:text-primary" onClick={() => onNavigate?.('blog')}>
                  {legacyContent.footer.travelGuide}
                </button>
              </li>
              <li>
                <button className="w-full text-left py-1 transition-colors hover:text-primary" onClick={() => onNavigate?.('buy-ticket')}>
                  {legacyContent.footer.buyDayPass}
                </button>
              </li>
              <li>
                <button className="w-full text-left py-1 transition-colors hover:text-primary" onClick={() => onNavigate?.('about')}>
                  {t.about}
                </button>
              </li>
              <li>
                <button className="w-full text-left py-1 transition-colors hover:text-primary" onClick={() => onNavigate?.('route-map')}>
                  {t.routeMap || "Route Map"}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 sm:mb-4 text-foreground text-base">{t.contactInfo}</h3>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{content.company.location}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${content.company.email}`} className="hover:text-primary transition-colors break-all">
                  {content.company.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{content.company.operatingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:pt-8 md:flex-row">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            {legacyContent.footer.allRightsReserved}
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <button 
              onClick={() => onNavigate?.("privacy-policy")} 
              className="text-muted-foreground hover:text-accent transition-colors text-sm py-1"
            >
              {legacyContent.footer.privacyPolicy}
            </button>
            <button 
              onClick={() => onNavigate?.("terms-of-service")} 
              className="text-muted-foreground hover:text-accent transition-colors text-sm py-1"
            >
              {legacyContent.footer.terms}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-accent transition-colors text-sm py-1">
                {legacyContent.footer.reservedArea}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onNavigate?.("admin")}>
                  {legacyContent.footer.adminPortal}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate?.("driver-portal")}>
                  {legacyContent.footer.driverPortal}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </footer>
  );
}