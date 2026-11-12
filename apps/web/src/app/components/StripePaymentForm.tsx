import {WebsiteLanguageContext, useWebsiteText} from '../lib/translations/websiteText';
import { useState, useEffect, useRef, useContext } from "react";
import { authenticatedFetch as fetch } from "@/lib/authenticatedFetch";
import { loadStripe, Stripe, StripeElements } from "@stripe/stripe-js";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, CreditCard, Shield, Lock } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface StripePaymentFormProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

function CheckoutForm({ amount, onSuccess, onError, customerEmail, clientSecret }: StripePaymentFormProps) {
  const wt = useWebsiteText();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);
  const [now, setNow] = useState(Date.now());
  const deadline = Date.parse(sessionStorage.getItem('checkout-hold:' + clientSecret.split('_secret_')[0]) || '');
  const expired = Number.isFinite(deadline) && now >= deadline;
  const remainingMinutes = Math.max(1, Math.ceil((deadline - now) / 60000));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || expired) {
      return;
    }

    // Prevent double submissions
    if (hasSubmittedRef.current || isProcessing) {
      console.log("⚠️ Payment submission already in progress, ignoring duplicate request");
      return;
    }

    hasSubmittedRef.current = true;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Validate the form before submitting
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error("Form validation error:", submitError);
        setErrorMessage(submitError.message || wt("Please complete all required fields"));
        onError(submitError.message || wt("Please complete all required fields"));
        hasSubmittedRef.current = false;
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: customerEmail,
          payment_method_data: customerEmail ? {
            billing_details: {
              email: customerEmail,
            },
          } : undefined,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        
        // Check if the error is because payment was already succeeded
        if (error.type === 'invalid_request_error' && 
            error.code === 'payment_intent_unexpected_state' &&
            error.payment_intent?.status === 'succeeded') {
          console.log("✅ Payment already succeeded, proceeding with success callback");
          onSuccess(error.payment_intent.id);
          return;
        }
        
        // Provide user-friendly error messages
        let userMessage = error.message || wt("Payment could not be confirmed. Check your booking before trying again.");
        if (error.code === 'incomplete_cvc') {
          userMessage = wt("Please enter your card's security code (CVC)");
        } else if (error.code === 'incomplete_number') {
          userMessage = wt("Please enter a complete card number");
        } else if (error.code === 'incomplete_expiry') {
          userMessage = wt("Please enter your card's expiration date");
        }
        
        setErrorMessage(userMessage);
        onError(userMessage);
        hasSubmittedRef.current = false; // Allow retry on error
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("✅ Payment succeeded:", paymentIntent.id);
        onSuccess(paymentIntent.id);
      } else {
        console.warn("⚠️ Payment not completed, status:", paymentIntent?.status);
        setErrorMessage(wt("Payment was not completed. Please try again."));
        onError(wt("Payment was not completed. Please try again."));
        hasSubmittedRef.current = false; // Allow retry
      }
    } catch (err) {
      console.error("Unexpected payment error:", err);
      const message = wt("Payment could not be confirmed. Check your booking before trying again.");
      setErrorMessage(message);
      onError(message);
      hasSubmittedRef.current = false; // Allow retry on error
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Number.isFinite(deadline) && (
        <Alert>
          <AlertDescription>{expired
            ? "Your checkout window has ended. If you have not submitted payment, go back and restart checkout to check availability. If payment is processing, please wait and do not pay again."
            : `Your places are reserved for this checkout. Please complete payment within ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`}</AlertDescription>
        </Alert>
      )}
      {/* Payment Element Container */}
      <div className="rounded-lg border border-border/50 p-4 bg-background">
        <PaymentElement 
          options={{
            layout: {
              type: "accordion",
              defaultCollapsed: false,
              radios: "never",
              spacedAccordionItems: true
            },
            fields: {
              billingDetails: {
                email: customerEmail ? 'never' : 'auto',
              }
            }
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage && wt(errorMessage)}</AlertDescription>
        </Alert>
      )}

      {/* Security Badges */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">{wt("Secure payment powered by Stripe")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">{wt("Your payment information is encrypted and secure")}</p>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">{wt("Accepts all cards, Apple Pay, and Google Pay")}</p>
        </div>
      </div>

      {/* Payment Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-200"
        disabled={!stripe || isProcessing || expired}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />{wt("Processing Payment...")}</>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />{wt("Pay €")}{amount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Confirmation Message */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">{wt("You'll receive your QR codes immediately after payment")}</p>
        <p className="text-xs text-muted-foreground">{wt("Confirmation will be sent to your email")}</p>
      </div>
    </form>
  );
}

export function StripePaymentForm({ amount, clientSecret, onSuccess, onError, customerEmail }: StripePaymentFormProps) {
  const language = useContext(WebsiteLanguageContext);
  const wt = useWebsiteText();
  // Use ref to store stripePromise so it never changes
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize once
    if (stripePromiseRef.current) {
      return;
    }

    const fetchStripeConfig = async () => {
      try {
        // Try to get from window first (cached)
        const cachedKey = (window as any).STRIPE_PUBLISHABLE_KEY;

        if (cachedKey) {
          stripePromiseRef.current = loadStripe(cachedKey);
          setIsLoadingStripe(false);
          return;
        }

        // Try build-time env variable (set via Vercel environment variables)
        const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
        if (envKey) {
          (window as any).STRIPE_PUBLISHABLE_KEY = envKey;
          stripePromiseRef.current = loadStripe(envKey);
          setIsLoadingStripe(false);
          return;
        }

        // Fetch from server
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/stripe-config`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );

        const data = await response.json();
        
        if (data.success && data.publishableKey) {
          // Cache in window for subsequent uses
          (window as any).STRIPE_PUBLISHABLE_KEY = data.publishableKey;
          stripePromiseRef.current = loadStripe(data.publishableKey);
        } else {
          throw new Error(data.error || "Failed to get Stripe configuration");
        }
      } catch (error) {
        console.error("Error loading Stripe:", error);
        setLoadError(wt("Payment system not configured. Please contact support."));
        onError(wt("Payment system not configured. Please contact support."));
      } finally {
        setIsLoadingStripe(false);
      }
    };

    fetchStripeConfig();
  }, []); // Empty deps - only run once

  if (loadError) {
    return (
      <Card className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{wt(loadError)}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (isLoadingStripe || !stripePromiseRef.current) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{wt("Loading payment system...")}</p>
        </div>
      </Card>
    );
  }

  const options = {
    clientSecret,
    locale: language as 'en' | 'pt' | 'es' | 'fr' | 'de' | 'nl' | 'it',
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0A4D5C',
        colorBackground: '#ffffff',
        colorText: '#2d3436',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromiseRef.current} options={options}>
      <CheckoutForm amount={amount} clientSecret={clientSecret} onSuccess={onSuccess} onError={onError} customerEmail={customerEmail} />
    </Elements>
  );
}
