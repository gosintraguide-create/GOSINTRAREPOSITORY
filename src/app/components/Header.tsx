import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router";
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
  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      setScrollY(window.scrollY);
      document.body.classList.add('menu-open');
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, scrollY);
      }
    }

    return () => {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
    };
  }, [isMenuOpen]);

  // Close menu on route change (via Escape key or navigation)
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, closeMenu]);

  const navItems = [
    { id: "hop-on-service", label: content.header.hopOnService || "Hop On Service" },
    { id: "attractions", label: t.attractions },
    { id: "private-tours", label: content.header.privateTours },
    { id: "blog", label: content.header.travelGuide },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md shadow-sm" role="banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex h-16 sm:h-20 items-center justify-between lg:justify-between relative">
            {/* Mobile: Menu Button (top left) */}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-secondary lg:hidden relative z-10 flex-shrink-0 min-h-[44px] min-w-[44px]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              ref={menuButtonRef}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Logo - centered on mobile, left-aligned on desktop */}
            <Link
              to="/"
              onClick={closeMenu}
              className="group absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0 flex items-center transition-all hover:opacity-90 flex-shrink-0"
              aria-label="Hop On Sintra - Home"
            >
              <div className="h-[30px] w-auto sm:h-10">
                <Logo />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-2 xl:gap-4 lg:flex lg:ml-6 xl:ml-12 flex-shrink min-w-0" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  className={`transition-all whitespace-nowrap text-sm md:text-base xl:text-lg px-3 py-2 rounded-md flex-shrink-0 ${
                    location.pathname === `/${item.id}`
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  aria-current={location.pathname === `/${item.id}` ? "page" : undefined}
                >
                  {item.label}
                </Link>
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
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex-shrink-0 text-xs xl:text-base px-3 xl:px-6 py-2"
              >
                <Link to="/buy-ticket">{t.buyTicket}</Link>
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
          id="mobile-nav"
          role="navigation"
          aria-label="Mobile navigation"
          className={`overflow-hidden border-t border-border bg-white shadow-lg lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6 lg:px-8 safe-bottom">
            <Button
              asChild
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 mb-3 h-12 text-base"
            >
              <Link to="/buy-ticket" onClick={closeMenu}>{t.buyTicket}</Link>
            </Button>

            {navItems.map((item) => (
              <Link
                key={item.id}
                to={`/${item.id}`}
                onClick={closeMenu}
                className={`block w-full rounded-xl px-4 py-3.5 text-base transition-colors ${
                  location.pathname === `/${item.id}`
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-secondary hover:text-primary"
                }`}
                aria-current={location.pathname === `/${item.id}` ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile quick links */}
            <div className="border-t border-border pt-3 mt-3">
              <Link
                to="/about"
                onClick={closeMenu}
                className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  location.pathname === "/about"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                }`}
              >
                {t.about}
              </Link>
              <Link
                to="/live-chat"
                onClick={closeMenu}
                className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  location.pathname === "/live-chat"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                }`}
              >
                {t.contactInfo || "Contact"}
              </Link>
              <Link
                to="/route-map"
                onClick={closeMenu}
                className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  location.pathname === "/route-map"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
                }`}
              >
                {t.routeMap || "Route Map"}
              </Link>
            </div>

            <div className="pt-3">
              <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}