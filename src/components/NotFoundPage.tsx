import { useNavigate, useOutletContext } from "react-router";
import { Button } from "./ui/button";
import { Home, ArrowLeft } from "lucide-react";

interface OutletContext {
  language: string;
  onNavigate: (page: string) => void;
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const { onNavigate } = useOutletContext<OutletContext>();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="mb-8 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
          <Button onClick={() => onNavigate("home")} size="lg">
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
