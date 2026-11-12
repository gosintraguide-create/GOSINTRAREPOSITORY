import {useWebsiteText} from '../lib/translations/websiteText';
import { authenticatedFetch as fetch } from "@/lib/authenticatedFetch";
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { MapPin, Users, Clock, Car, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getSession } from "../lib/sessionManager";
import { toast } from 'sonner';
import { getTranslation } from "../lib/translations";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

interface RequestPickupPageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function RequestPickupPage() {
  const wt = useWebsiteText();
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const t = getTranslation(language).components;
  const [step, setStep] = useState<"verify" | "request" | "searching" | "confirmed">("verify");
  const [lastName,setLastName]=useState('');
  const [maxPassengers,setMaxPassengers]=useState(1);
  const [readyInMinutes,setReadyInMinutes]=useState(0);
  const [requestKey,setRequestKey]=useState(()=>crypto.randomUUID());
  const [currentRequest,setCurrentRequest]=useState<any>(null);
  const [history,setHistory]=useState<any[]>([]);
  const [bookingCode, setBookingCode] = useState<string>("");
  const [verificationError, setVerificationError] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [groupSize, setGroupSize] = useState<string>("1");
  const [location, setLocation] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [phonePrefix, setPhonePrefix] = useState<string>("+351");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (step === "searching") {
      setShowSlowMessage(false);
      const timer = setTimeout(() => setShowSlowMessage(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Parse phone number into prefix and number
  const parsePhoneNumber = (fullPhone: string) => {
    if (!fullPhone) return { prefix: "+351", number: "" };
    
    // Common country codes (sorted by length, longest first for accurate matching)
    const prefixes = ["+1", "+7", "+20", "+27", "+30", "+31", "+32", "+33", "+34", "+351", "+352", "+353", "+354", "+355", "+356", "+357", "+358", "+39", "+40", "+41", "+43", "+44", "+45", "+46", "+47", "+48", "+49", "+60", "+61", "+62", "+63", "+64", "+65", "+66", "+81", "+82", "+84", "+86", "+90", "+91", "+92", "+93", "+94", "+95", "+98", "+212", "+213", "+216", "+218", "+220", "+221", "+222", "+223", "+224", "+225", "+226", "+227", "+228", "+229", "+230", "+231", "+232", "+233", "+234", "+235", "+236", "+237", "+238", "+239", "+240", "+241", "+242", "+243", "+244", "+245", "+246", "+248", "+249", "+250", "+251", "+252", "+253", "+254", "+255", "+256", "+257", "+258", "+260", "+261", "+262", "+263", "+264", "+265", "+266", "+267", "+268", "+269", "+290", "+291", "+297", "+298", "+299", "+350", "+370", "+371", "+372", "+373", "+374", "+375", "+376", "+377", "+378", "+380", "+381", "+382", "+383", "+385", "+386", "+387", "+389", "+420", "+421", "+423", "+500", "+501", "+502", "+503", "+504", "+505", "+506", "+507", "+508", "+509", "+590", "+591", "+592", "+593", "+594", "+595", "+596", "+597", "+598", "+599", "+670", "+672", "+673", "+674", "+675", "+676", "+677", "+678", "+679", "+680", "+681", "+682", "+683", "+684", "+685", "+686", "+687", "+688", "+689", "+690", "+691", "+692", "+850", "+852", "+853", "+855", "+856", "+880", "+886", "+960", "+961", "+962", "+963", "+964", "+965", "+966", "+967", "+968", "+970", "+971", "+972", "+973", "+974", "+975", "+976", "+977", "+992", "+993", "+994", "+995", "+996", "+998"];
    
    for (const prefix of prefixes) {
      if (fullPhone.startsWith(prefix)) {
        return {
          prefix,
          number: fullPhone.slice(prefix.length).trim().replace(/\s/g, "")
        };
      }
    }
    
    // Default to Portugal if no match
    return { prefix: "+351", number: fullPhone.replace(/^\+/, "").replace(/\s/g, "") };
  };

  useEffect(() => {
    // Check if user is logged in, auto-fill and skip verification
    const session = getSession();
    if (session) {
      setBookingCode(session.bookingId);
      setCustomerName(session.customerName);
      setLastName(session.lastName);
      setMaxPassengers(session.passes);
      
      // Parse phone number into prefix and number
      if (session.customerPhone) {
        const parsed = parsePhoneNumber(session.customerPhone);
        setPhonePrefix(parsed.prefix);
        setPhoneNumber(parsed.number);
      }
      
      setGroupSize(String(session.passes));
      setIsVerified(true);
      setStep("request");
    }
  }, []);

  const locations = [
    { id: "sintra-station", name: "Sintra Train Station" },
    { id: "pena-palace", name: "Pena Palace" },
    { id: "quinta-regaleira", name: "Quinta da Regaleira" },
    { id: "moorish-castle", name: "Moorish Castle" },
    { id: "monserrate-palace", name: "Monserrate Palace" },
    { id: "sintra-palace", name: "Sintra National Palace" },
    { id: "town-center", name: "Historic Town Center" },
  ];

  const getVehicleType = (size: number) => {
    if (size <= 2) return "Tuk Tuk (2 passengers)";
    if (size <= 4) return "UMM Jeep (4 passengers)";
    if (size <= 6) return "Premium Van (6 passengers)";
    return `${Math.ceil(size / 6)} vehicles`;
  };

  const getVehicleDescription = (size: number) => {
    if (size <= 6) return getVehicleType(size);
    
    const vans = Math.floor(size / 6);
    const remaining = size % 6;
    
    if (remaining === 0) {
      return `${vans} Premium Van${vans > 1 ? 's' : ''} (6 passengers each)`;
    }
    
    let description = `${vans} Premium Van${vans > 1 ? 's' : ''}`;
    if (remaining <= 2) {
      description += ` + 1 Tuk Tuk (${remaining} passenger${remaining > 1 ? 's' : ''})`;
    } else if (remaining <= 4) {
      description += ` + 1 UMM Jeep (${remaining} passengers)`;
    } else {
      description += ` + 1 Premium Van (${remaining} passengers)`;
    }
    
    return description;
  };

  const handleVerifyBooking = async () => {
    if (!bookingCode.trim() || !lastName.trim()) {
      setVerificationError(wt("Please enter your booking code and last name"));
      return;
    }

    setVerificationError("");

    try {
      // Verify booking code with backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingCode.trim().toUpperCase(), lastName:lastName.trim(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.booking) {
          setIsVerified(true);
          setCustomerName(result.booking.customerName || "");
          
          // Parse phone number into prefix and number
          if (result.booking.customerPhone) {
            const parsed = parsePhoneNumber(result.booking.customerPhone);
            setPhonePrefix(parsed.prefix);
            setPhoneNumber(parsed.number);
          }
          
          setMaxPassengers(result.booking.passes || 1);
          setGroupSize(String(result.booking.passes || 1));
          setStep("request");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setVerificationError(wt("Invalid booking code. Please check and try again."));
        }
      } else {
        setVerificationError(response.status === 401 ? wt("Please sign in to your booking first, then return here to request a pickup.") : wt("Unable to verify booking. Please try again."));
      }
    } catch (error) {
      setVerificationError(wt("Connection error. Please check your internet and try again."));
    }
  };

  const handleRequestPickup = async () => {
    if (!location || !destination || location===destination || !groupSize || !customerName || !phoneNumber) return;
    
    setStep("searching");
    
    const customerPhone = `${phonePrefix} ${phoneNumber}`;
    
    const requestData = {
      bookingId:bookingCode.trim().toUpperCase(), requestKey, readyInMinutes,
      customerName,
      customerPhone,
      pickupLocation: locations.find(l => l.id === location)?.name || location,
      destination: locations.find(l => l.id === destination)?.name || destination || "",
      groupSize: parseInt(groupSize),
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unable to send request.");
      }

      const result = await response.json();

      if (result.success) {
        setCurrentRequest(result.request);
        setStep("confirmed");
      } else {
        throw new Error(result.error || 'Failed to create pickup request');
      }
    } catch (error) {
      setStep("request");
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      toast.error(
        isTimeout
          ? wt("We could not confirm the request. It may have been saved. Please contact us via WhatsApp before sending another.")
          : error instanceof Error ? error.message : wt("Unable to send request. Please try again or contact us via WhatsApp."),
        { duration: 6000 }
      );
    }
  };

  useEffect(()=>{
    if(!isVerified||!bookingCode)return;
    let cancelled=false;
    const refresh=async()=>{
      try{
        const response=await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pickup-requests/mine?bookingId=${encodeURIComponent(bookingCode.trim().toUpperCase())}`);
        const data=await response.json();
        if(response.ok&&!cancelled){
          setHistory(data.requests||[]);
          setCurrentRequest(previous=>data.requests?.find((r:any)=>r.id===previous?.id)||previous);
        }
      }catch{}
    };
    void refresh();const timer=setInterval(refresh,15000);return()=>{cancelled=true;clearInterval(timer);};
  },[isVerified,bookingCode,step]);

  if (step === "verify") {
    return (
      <div className="flex-1 bg-secondary/30">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 sm:py-28">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
                <Car className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              {t.requestPickupPage.verifyBooking}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t.requestPickupPage.verifyBookingDescription}
            </p>
          </div>
        </section>

        {/* Verification Form */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <Card className="overflow-hidden border-border p-6 shadow-lg sm:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="booking-code">{wt("Booking Code")}</Label>
                  <Input
                    id="booking-code"
                    type="text"
                    placeholder={wt("e.g., GST-ABC123")}
                    value={bookingCode}
                    onChange={(e) => {
                      setBookingCode(e.target.value.toUpperCase());
                      setVerificationError("");
                    }}
                    className="border-border text-center text-lg tracking-wider"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyBooking();
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground">{wt("You received this code in your booking confirmation email")}</p>
                </div>

                <div className="space-y-2"><Label htmlFor="pickup-last-name">{wt("Last name on booking")}</Label><Input id="pickup-last-name" autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)} /></div>
                {verificationError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                      <div><p className="text-sm text-red-600">{verificationError}</p><Button variant="outline" className="mt-2" onClick={() => onNavigate("login")}>{wt("Sign in to booking")}</Button></div>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleVerifyBooking}
                  disabled={!bookingCode.trim() || !lastName.trim()}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />{wt("Verify Booking")}</Button>

                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{wt("Don't have a booking?")}</span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{wt("Pickup requests are only available to customers with purchased day passes.")}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onNavigate("buy-ticket")}
                  >{wt("Purchase Day Pass")}</Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  if (step === "searching") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Car className="h-16 w-16 animate-pulse text-accent" />
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Users className="h-3 w-3" />
              </div>
            </div>
          </div>
          <h2 className="mb-2 text-foreground">{wt("Sending Your Request...")}</h2>
          <p className="mb-4 text-muted-foreground">{wt("Saving the pickup request for your group of")}<strong>{groupSize} {parseInt(groupSize) === 1 ? 'passenger' : 'passengers'}</strong>
          </p>
          {showSlowMessage && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">{wt("Taking longer than expected...")}</p>
              <p className="text-sm text-muted-foreground">{wt("Please wait for the result before sending another request.")}</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (step === "confirmed") {
    const active=['pending','accepted'].includes(currentRequest?.status);
    return <div className="min-h-screen bg-secondary/30 p-6"><Card className="mx-auto max-w-lg p-6 space-y-4">
      <h1>{currentRequest?.status==='accepted'?wt('Driver assigned'):currentRequest?.status==='completed'?wt('Ride completed'):currentRequest?.status==='cancelled'?wt('Request cancelled'):wt('Pickup request received')}</h1>
      <p>{wt(currentRequest?.pickupLocation || "")} → {wt(currentRequest?.destination || "")}</p>
      <p>{currentRequest?.groupSize} {wt("passengers · Reference:")} {currentRequest?.id}</p>
      {currentRequest?.acceptedByName && <p>{wt("Driver:")} {currentRequest.acceptedByName}</p>}
      {currentRequest?.status==='pending' && <p>{wt("The team will assign your pickup. An arrival time has not been confirmed.")}</p>}
      {currentRequest?.readyAt && <p>{wt("Ready at")} {new Date(currentRequest.readyAt).toLocaleTimeString(language,{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Lisbon'})} {wt("(Sintra time)")}</p>}
      <Button disabled={active} onClick={()=>{setRequestKey(crypto.randomUUID());setCurrentRequest(null);setStep('request');}}>{wt("Request another ride")}</Button>
      <Button variant="outline" onClick={()=>onNavigate('home')}>{wt("Done")}</Button>
    </Card></div>;
  }

  return (
    <div className="flex-1 bg-secondary/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 sm:py-28">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/20">
              <Car className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">{wt("Request a Pickup")}</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">{wt("Choose your group size and stops to request a pickup from the team. Assignment and arrival time depend on availability.")}</p>
        </div>
      </section>

      {/* Request Form */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {history.length>0 && <Card className="mb-4 p-4"><h2>{wt("Your recent requests")}</h2>{history.map(r=><button key={r.id} className="block w-full py-3 text-left" onClick={()=>{setCurrentRequest(r);setStep('confirmed');}}>{wt(r.pickupLocation)} → {wt(r.destination)} · {wt(({pending:'Pickup request received',accepted:'Driver assigned',completed:'Ride completed',cancelled:'Request cancelled'} as Record<string,string>)[r.status] || 'Pickup request received')}</button>)}</Card>}
          <div className="mb-4"><Label htmlFor="pickup-ready">{wt("When will you be ready?")}</Label><select id="pickup-ready" className="block w-full border rounded p-3" value={readyInMinutes} onChange={e=>setReadyInMinutes(Number(e.target.value))}><option value={0}>{wt("Now")}</option><option value={15}>{wt("In 15 minutes")}</option></select></div>
          <Card className="overflow-hidden border-border p-6 shadow-lg sm:p-8">
            <div className="space-y-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customer-name">{t.requestPickupPage.enterName}</Label>
                <Input
                  id="customer-name"
                  type="text"
                  placeholder={t.requestPickupPage.enterName}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="border-border"
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-2">
                <Label htmlFor="customer-phone">{wt("Phone Number")}</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="+351 912 345 678"
                  value={`${phonePrefix}${phoneNumber}`}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d+\s-]/g, '');
                    const prefixMatch = raw.match(/^(\+\d{1,4})/);
                    if (prefixMatch) {
                      const prefix = prefixMatch[1];
                      setPhonePrefix(prefix);
                      setPhoneNumber(raw.slice(prefix.length).replace(/\D/g, ''));
                    } else {
                      setPhonePrefix("+351");
                      setPhoneNumber(raw.replace(/\D/g, ''));
                    }
                  }}
                  className="border-border"
                />
              </div>

              {/* Group Size */}
              <div className="space-y-2">
                <Label htmlFor="group-size" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />{wt("Number of Passengers")}</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-12 border-border"
                    onClick={() => setGroupSize(String(Math.max(1, parseInt(groupSize) - 1)))}
                  >
                    -
                  </Button>
                  <Input
                    id="group-size"
                    type="number"
                    min="1"
                    max={maxPassengers}
                    value={groupSize}
                    onChange={(e) => setGroupSize(String(Math.max(1, parseInt(e.target.value) || 1)))}
                    className="border-border text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-12 border-border"
                    onClick={() => setGroupSize(String(Math.min(maxPassengers, parseInt(groupSize) + 1)))}
                  >
                    +
                  </Button>
                </div>
                {groupSize && parseInt(groupSize) <= 6 ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Car className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <p>{wt("Your group may need more than one vehicle. The team will confirm the arrangements based on availability.")}</p>
                    </div>
                  </div>
                ) : groupSize && parseInt(groupSize) === 7 ? (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                      <p>{wt("Your group may need more than one vehicle. The team will confirm the arrangements based on availability.")}</p>
                    </div>
                  </div>
                ) : groupSize && parseInt(groupSize) > 7 ? (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                      <p>{wt("Your group may need more than one vehicle. The team will confirm the arrangements based on availability.")}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Current Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />{wt("Your Current Location")}</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder={wt("Select your location")} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {wt(loc.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />{wt("Destination")}</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger id="destination">
                    <SelectValue placeholder={wt("Where would you like to go?")} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((loc) => loc.id !== location)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {wt(loc.name)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground">{wt("Choose where you would like to go.")}</p>
              </div>

              {/* Info Box */}
              <div className="rounded-lg border border-border bg-white p-6">
                <div className="mb-3 flex items-center gap-3 text-primary">
                  <Clock className="h-5 w-5" />
                  <span>{wt("Service Hours")}</span>
                </div>
                <p className="text-muted-foreground">
                  {getTranslation(language).company.operatingHours}
                </p>
              </div>

              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent/90"
                onClick={handleRequestPickup}
                disabled={!location || !destination || location===destination || !groupSize || !customerName || !phoneNumber || Number(groupSize)>maxPassengers}
              >
                <Car className="mr-2 h-5 w-5" />{wt("Request Pickup")}</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-foreground">{wt("How Vehicle Coordination Works")}</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-all group-hover:shadow-xl">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-foreground">{wt("1. Tell Us Your Group Size")}</h3>
              <p className="text-muted-foreground">{wt("Select how many passengers need a ride (1-50 people)")}</p>
            </div>
            <div className="group text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all group-hover:shadow-xl">
                  <Car className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-foreground">{wt("2. We Coordinate Vehicles")}</h3>
              <p className="text-muted-foreground">{wt("Drivers receive your request and coordinate appropriate vehicles for your group")}</p>
            </div>
            <div className="group text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-all group-hover:shadow-xl">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-foreground">{wt("3. Vehicles Arrive")}</h3>
              <p className="text-muted-foreground">{wt("Your vehicle(s) arrive shortly, coordinated for groups over 6")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RequestPickupPage;
