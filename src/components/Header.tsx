import { Menu, X, Ticket } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { LanguageSelector } from "./LanguageSelector";
import Frame from "../imports/Frame";
import { getUITranslation } from "../lib/translations";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function Header({ currentPage, onNavigate, language, onLanguageChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = getUITranslation(language);

  const navItems = [
    { id: "attractions", label: t.attractions },
    { id: "private-tours", label: "Private Tours" },
    { id: "blog", label: "Travel Guide" },
    { id: "manage-booking", label: t.manageBooking || "My Booking" },
    { id: "about", label: t.about },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-[rgba(195,108,55,0)]">
          <div className="flex h-20 items-center justify-between md:justify-between">
            {/* Logo - centered on mobile, left-aligned on desktop */}
            <button
              onClick={() => {
                onNavigate("home");
                setIsMenuOpen(false);
              }}
              className="group absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0 flex items-center transition-all hover:opacity-90"
            >
              <div className="h-7 w-auto sm:h-8">
                <Frame />
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 md:flex ml-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`transition-all ${
                    currentPage === item.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={onLanguageChange}
              />
              <Button 
                size="lg"
                className="ml-2 bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={() => onNavigate("buy-ticket")}
              >
                <Ticket className="mr-2 h-5 w-5" />
                {t.buyTicket}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-secondary md:hidden relative z-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t border-border bg-white/95 backdrop-blur-sm md:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-6 sm:px-6 lg:px-8">
              <Button
                onClick={() => {
                  onNavigate("buy-ticket");
                  setIsMenuOpen(false);
                }}
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 mb-4"
              >
                <Ticket className="mr-2 h-5 w-5" />
                {t.buyTicket}
              </Button>
              
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full rounded-xl px-4 py-3 text-left transition-colors ${
                    currentPage === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-4">
                <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}