import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { UserProfile } from "./UserProfile";
import { getUITranslation, getTranslation } from "../lib/translations";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function Header({ currentPage, onNavigate, language, onLanguageChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const t = getUITranslation(language);
  const content = getTranslation(language);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open - REMOVED since it's no longer a modal
  // useEffect(() => {
  //   if (isMenuOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = 'unset';
  //   }
    
  //   return () => {
  //     document.body.style.overflow = 'unset';
  //   };\n  // }, [isMenuOpen]);

  const navItems = [
    { id: "hop-on-service", label: content.header.hopOnService || "Hop On Service" },
    { id: "attractions", label: t.attractions },
    { id: "private-tours", label: content.header.privateTours },
    { id: "blog", label: content.header.travelGuide },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex h-20 items-center justify-between lg:justify-between relative">
            {/* Mobile: Menu Button (top left) */}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-secondary lg:hidden relative z-10 flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              ref={menuButtonRef}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Logo - centered on mobile, left-aligned on desktop */}
            <button
              onClick={() => {
                onNavigate("home");
                setIsMenuOpen(false);
              }}
              className="group absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 flex items-center transition-all hover:opacity-90 flex-shrink-0"
            >
              <div className="h-[30px] w-auto sm:h-10">
                <Logo />
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-2 xl:gap-4 lg:flex lg:ml-6 xl:ml-12 flex-shrink min-w-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`transition-all whitespace-nowrap text-sm md:text-base xl:text-lg px-3 py-2 rounded-md flex-shrink-0 ${
                    currentPage === item.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex-shrink-0">
                <LanguageSelector
                  currentLanguage={language}
                  onLanguageChange={onLanguageChange}
                />
              </div>
              <div className="flex-shrink-0">
                <UserProfile onNavigate={onNavigate} language={language} />
              </div>
              <Button 
                size="lg"
                className="bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex-shrink-0 text-xs xl:text-base px-3 xl:px-6 py-2"
                onClick={() => onNavigate("buy-ticket")}
              >
                {t.buyTicket}
              </Button>
            </nav>

            {/* Mobile: User Profile (top right) */}
            <div className="lg:hidden relative z-10 flex-shrink-0">
              <UserProfile onNavigate={onNavigate} language={language} />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          ref={menuRef}
          className={`overflow-hidden border-t border-border bg-white shadow-lg md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-6 sm:px-6 lg:px-8">
            <Button
              onClick={() => {
                onNavigate("buy-ticket");
                setIsMenuOpen(false);
              }}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 mb-4"
            >
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
      </header>
    </>
  );
}