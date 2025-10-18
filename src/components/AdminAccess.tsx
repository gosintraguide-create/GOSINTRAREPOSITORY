import { Settings, Users } from "lucide-react";

interface AdminAccessProps {
  onNavigate: (page: string) => void;
}

export function AdminAccess({ onNavigate }: AdminAccessProps) {
  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2 sm:bottom-6 sm:left-6">
      {/* Admin Button */}
      <button
        onClick={() => onNavigate("admin")}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-lg transition-all hover:scale-110 hover:border-primary hover:text-primary hover:shadow-xl"
        aria-label="Admin access"
        title="Admin Console"
      >
        <Settings className="h-5 w-5" />
      </button>
      
      {/* Operations Button - Navigate to driver login */}
      <button
        onClick={() => onNavigate("driver-login")}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-lg transition-all hover:scale-110 hover:border-accent hover:text-accent hover:shadow-xl"
        aria-label="Driver login"
        title="Driver Login (Operations Portal)"
      >
        <Users className="h-5 w-5" />
      </button>
    </div>
  );
}
