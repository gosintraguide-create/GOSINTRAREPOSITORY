import { useState, useEffect } from "react";
import { ArrowRight, Ticket } from "lucide-react";
import { Button } from "./ui/button";

interface FloatingCTAProps {
  onNavigate: (page: string) => void;
}

export function FloatingCTA({ onNavigate }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
      
    </div>
  );
}