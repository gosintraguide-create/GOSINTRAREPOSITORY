import { useState, useEffect } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  language?: string;
  inline?: boolean;
}

export function TableOfContents({ content, language = "en", inline = false }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  
  // Import translations
  const translations = {
    en: "Table of Contents",
    pt: "Índice",
    es: "Tabla de Contenidos",
    fr: "Table des Matières",
    de: "Inhaltsverzeichnis",
    nl: "Inhoudsopgave",
    it: "Sommario",
  };
  
  const tableOfContentsLabel = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const extractedHeadings: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Only include H1, H2, H3
      if (level <= 3) {
        extractedHeadings.push({ id, text, level });
      }
    }

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    // Track active section on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Offset for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (headings.length < 5) {
    return null; // Don't show TOC for articles with fewer than 5 headings
  }

  // Inline mode — simple indented list, no card/toggle
  if (inline) {
    return (
      <div style={{
        background: "#faf7f2",
        border: "1px solid rgba(180,140,80,0.2)",
        borderRadius: "10px",
        padding: "20px 24px",
        marginBottom: "36px",
      }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#a08050",
          textTransform: "uppercase" as const,
          letterSpacing: "1px",
          margin: "0 0 12px",
        }}>
          {tableOfContentsLabel}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 16}px`, marginBottom: "6px" }}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                style={{
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: activeId === heading.id ? "#1a1a1a" : "#666",
                  fontWeight: activeId === heading.id ? 600 : 400,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left" as const,
                  transition: "color 0.15s ease",
                }}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Sidebar mode — card with toggle (kept for potential future use)
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-secondary/30 p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-foreground">{tableOfContentsLabel}</h3>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {isOpen && (
        <nav className="p-4">
          <ul className="space-y-2">
            {headings.map((heading) => (
              <li
                key={heading.id}
                style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`block w-full text-left text-sm transition-colors ${
                    activeId === heading.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </Card>
  );
}