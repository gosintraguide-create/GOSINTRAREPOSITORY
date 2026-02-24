import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  href?: string; // For SEO structured data
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Generate JSON-LD BreadcrumbList for Google via direct DOM manipulation
  useEffect(() => {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href
          ? `https://www.hoponsintra.com${item.href}`
          : undefined,
      })),
    };

    let script = document.querySelector('script[data-breadcrumb-ld]');
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-breadcrumb-ld", "true");
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(breadcrumbSchema);

    return () => {
      script?.remove();
    };
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 overflow-x-auto">
      <ol className="flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground whitespace-nowrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="transition-colors hover:text-primary py-1 flex items-center gap-1"
              >
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{item.label}</span>
                {index === 0 && <span className="sm:hidden">Home</span>}
              </button>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none flex items-center gap-1">
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}