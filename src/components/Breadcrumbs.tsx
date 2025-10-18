import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="transition-colors hover:text-primary"
              >
                {index === 0 && <Home className="mr-1 inline h-4 w-4" />}
                {item.label}
              </button>
            ) : (
              <span className="text-foreground">
                {index === 0 && <Home className="mr-1 inline h-4 w-4" />}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
