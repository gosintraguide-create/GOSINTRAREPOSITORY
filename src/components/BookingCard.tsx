import { useState, useEffect } from "react";
import { Calendar, Users, ArrowRight, Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface BookingCardProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  language?: string;
}

export function BookingCard({ onNavigate, basePrice, language = "en" }: BookingCardProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  }, []);

  const totalPrice = (adults * basePrice) + (children * (basePrice * 0.5));

  const handleBookNow = () => {
    // Store booking details in sessionStorage for the booking page
    sessionStorage.setItem('booking-prefill', JSON.stringify({
      date: selectedDate,
      adults,
      children,
    }));
    onNavigate("buy-ticket");
  };

  const updateAdults = (delta: number) => {
    const newValue = adults + delta;
    if (newValue >= 1 && newValue <= 20) {
      setAdults(newValue);
    }
  };

  const updateChildren = (delta: number) => {
    const newValue = children + delta;
    if (newValue >= 0 && newValue <= 20) {
      setChildren(newValue);
    }
  };

  const translations = {
    en: {
      title: "Book Your Day Pass",
      date: "Select Date",
      passengers: "Passengers",
      adults: "Adults",
      children: "Children",
      childrenAge: "Age 5-12, 50% discount",
      total: "Total",
      bookNow: "Book Now",
    },
    pt: {
      title: "Reserve o Seu Passe",
      date: "Selecione a Data",
      passengers: "Passageiros",
      adults: "Adultos",
      children: "Crianças",
      childrenAge: "Idade 5-12, 50% desconto",
      total: "Total",
      bookNow: "Reservar Agora",
    },
    es: {
      title: "Reserva Tu Pase",
      date: "Seleccionar Fecha",
      passengers: "Pasajeros",
      adults: "Adultos",
      children: "Niños",
      childrenAge: "Edad 5-12, 50% descuento",
      total: "Total",
      bookNow: "Reservar Ahora",
    },
    fr: {
      title: "Réservez Votre Pass",
      date: "Sélectionner Date",
      passengers: "Passagers",
      adults: "Adultes",
      children: "Enfants",
      childrenAge: "Âge 5-12, 50% réduction",
      total: "Total",
      bookNow: "Réserver Maintenant",
    },
    de: {
      title: "Buchen Sie Ihren Pass",
      date: "Datum Wählen",
      passengers: "Passagiere",
      adults: "Erwachsene",
      children: "Kinder",
      childrenAge: "Alter 5-12, 50% Rabatt",
      total: "Gesamt",
      bookNow: "Jetzt Buchen",
    },
    nl: {
      title: "Boek Uw Pass",
      date: "Selecteer Datum",
      passengers: "Passagiers",
      adults: "Volwassenen",
      children: "Kinderen",
      childrenAge: "Leeftijd 5-12, 50% korting",
      total: "Totaal",
      bookNow: "Nu Boeken",
    },
    it: {
      title: "Prenota Il Tuo Pass",
      date: "Seleziona Data",
      passengers: "Passeggeri",
      adults: "Adulti",
      children: "Bambini",
      childrenAge: "Età 5-12, 50% sconto",
      total: "Totale",
      bookNow: "Prenota Ora",
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <Card className="w-full bg-white shadow-2xl border-0 overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-white text-center">{t.title}</h3>
      </div>
      
      <div className="p-6 space-y-5">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            {t.date}
          </Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="h-12 text-base"
          />
        </div>

        {/* Passengers */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-foreground">
            <Users className="h-4 w-4 text-primary" />
            {t.passengers}
          </Label>
          
          {/* Adults */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div>
              <div className="font-medium text-foreground">{t.adults}</div>
              <div className="text-sm text-muted-foreground">€{basePrice} each</div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => updateAdults(-1)}
                disabled={adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{adults}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => updateAdults(1)}
                disabled={adults >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div>
              <div className="font-medium text-foreground">{t.children}</div>
              <div className="text-sm text-muted-foreground">{t.childrenAge}</div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => updateChildren(-1)}
                disabled={children <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{children}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => updateChildren(1)}
                disabled={children >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-lg font-semibold text-foreground">{t.total}</span>
          <span className="text-2xl font-bold text-accent">€{totalPrice.toFixed(2)}</span>
        </div>

        {/* Book Now Button */}
        <Button
          onClick={handleBookNow}
          size="lg"
          className="h-14 w-full bg-accent text-lg hover:bg-accent/90"
        >
          {t.bookNow}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}
