import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { FlagGB, FlagPT, FlagES, FlagFR, FlagDE } from "./FlagIcons";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  FlagComponent: React.ComponentType<{ className?: string }>;
}

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", FlagComponent: FlagGB },
  { code: "pt", name: "Portuguese", nativeName: "Português", FlagComponent: FlagPT },
  { code: "es", name: "Spanish", nativeName: "Español", FlagComponent: FlagES },
  { code: "fr", name: "French", nativeName: "Français", FlagComponent: FlagFR },
  { code: "de", name: "German", nativeName: "Deutsch", FlagComponent: FlagDE },
];

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const selectedLanguage = languages.find((lang) => lang.code === currentLanguage) || languages[0];
  const SelectedFlag = selectedLanguage.FlagComponent;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        <SelectedFlag className="w-5 h-4 rounded-sm border border-border/50" />
        <span className="text-sm">{selectedLanguage.code.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => {
          const FlagComponent = language.FlagComponent;
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => onLanguageChange(language.code)}
              className={`flex cursor-pointer items-center gap-3 ${
                currentLanguage === language.code ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <FlagComponent className="w-6 h-4 rounded-sm border border-border/50" />
              <span className="text-foreground">{language.nativeName}</span>
              {currentLanguage === language.code && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}