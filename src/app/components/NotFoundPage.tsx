import { useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { Button } from "./ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

interface OutletContext {
  language: string;
  onNavigate: (page: string) => void;
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const { onNavigate } = useOutletContext<OutletContext>();

  // Set noindex meta for 404 page via direct DOM manipulation
  useEffect(() => {
    document.title = "Page Not Found - Hop On Sintra";
    
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", "noindex, nofollow");

    return () => {
      // Reset robots on unmount so other pages get proper indexing
      robotsMeta?.setAttribute("content", "index, follow");
    };
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="text-center max-w-md mx-auto">
        <h1 className="mb-3 text-5xl sm:text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-3 text-xl sm:text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="mb-6 sm:mb-8 text-muted-foreground text-sm sm:text-base">
          Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" size="lg" className="h-11">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => onNavigate("home")} size="lg" className="h-11">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onNavigate("attractions")} className="text-sm">
              Attractions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("buy-ticket")} className="text-sm">
              Buy Day Pass
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("live-chat")} className="text-sm">
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}