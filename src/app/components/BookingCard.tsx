import { useState, useEffect } from "react";
import { Calendar, ArrowRight, Minus, Plus, MessageCircle, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { getTranslation } from "../lib/translations";

interface BookingCardProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  language?: string;
}

export function BookingCard({ onNavigate, basePrice, language = "en" }: BookingCardProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [quantity, setQuantity] = useState(2);
  const [contactOpen, setContactOpen] = useState(false);
  const t = getTranslation(language).productComponents;

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  }, []);

  const totalPrice = quantity * basePrice;

  const handleBookNow = () => {
    // Store booking details in sessionStorage for the booking page
    sessionStorage.setItem('booking-prefill', JSON.stringify({
      date: selectedDate,
      quantity,
    }));
    onNavigate("buy-ticket");
  };

  const updateQuantity = (delta: number) => {
    const newValue = quantity + delta;
    if (newValue >= 1 && newValue <= 20) {
      setQuantity(newValue);
    }
  };

  return (
    <Card className="w-full bg-white shadow-2xl border-0 overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-white text-center">{t.bookingCard.title}</h3>
      </div>
      
      <div className="p-6 space-y-5">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            {t.bookingCard.selectDate}
          </Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="h-12 text-base"
          />
        </div>

        {/* Quantity */}
        <div className="space-y-3">
          <Label className="text-foreground">
            {t.bookingCard.quantity}
          </Label>
          
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div>
              <div className="text-sm text-muted-foreground">€{basePrice} {t.each}</div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => updateQuantity(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => updateQuantity(1)}
                disabled={quantity >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-lg font-semibold text-foreground">{t.bookingCard.total}</span>
          <span className="text-2xl font-bold text-accent">€{totalPrice.toFixed(2)}</span>
        </div>

        {/* Book Now Button */}
        <Button
          onClick={handleBookNow}
          size="lg"
          className="h-14 w-full bg-accent text-lg hover:bg-accent/90"
        >
          {t.bookingCard.bookNow}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Contact CTA */}
        <div className="mt-3 text-center">
          <button
            onClick={() => setContactOpen(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
          >
            Have questions? Contact us
          </button>
        </div>

        {/* Contact modal */}
        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent className="max-w-xs rounded-2xl p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground">
                We're here to help
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how you'd like to reach us
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href="https://wa.me/351932967279"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                onClick={() => setContactOpen(false)}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp
              </a>
              <a
                href="mailto:info@hoponsintra.com"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                onClick={() => setContactOpen(false)}
              >
                <Mail className="h-4 w-4 shrink-0" />
                info@hoponsintra.com
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}