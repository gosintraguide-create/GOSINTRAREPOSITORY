import { useState } from "react";
import { Mail, MessageCircle, X } from "lucide-react";

interface LiveChatWidgetProps {
  language?: string;
}

export function LiveChatWidget({ language: _language = "en" }: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating contact button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        aria-label="Contact us"
      >
        {isOpen ? (
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        ) : (
          <Mail className="h-6 w-6 sm:h-7 sm:w-7" />
        )}
      </button>

      {/* Contact popup */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-72 rounded-2xl border border-border bg-background p-5 shadow-2xl sm:bottom-24 sm:right-6">
          <h3 className="mb-1 text-base font-semibold text-foreground">We're here to help</h3>
          <p className="mb-4 text-sm text-muted-foreground">Choose how you'd like to reach us</p>

          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/351932967279"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              WhatsApp
            </a>
            <a
              href="mailto:hoponsintra@gmail.com"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="h-4 w-4 shrink-0" />
              hoponsintra@gmail.com
            </a>
          </div>
        </div>
      )}
    </>
  );
}
