import { useState, useEffect } from "react";
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
}

function CheckoutForm({ amount, onSuccess, onError, customerEmail }: Omit<StripePaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: customerEmail,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(error.message || "Payment failed");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        setErrorMessage("Payment was not completed. Please try again.");
        onError("Payment was not completed");
      }
    } catch (err) {
      console.error("Unexpected payment error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element Container */}
      <div className="rounded-lg border border-border/50 p-4 bg-background">
        <PaymentElement 
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto",
            },
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Security Badges */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">Secure payment powered by Stripe</p>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">Your payment information is encrypted and secure</p>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">Accepts all cards, Apple Pay, and Google Pay</p>
        </div>
      </div>

      {/* Payment Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-200"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay €{amount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Confirmation Message */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          You'll receive your QR codes immediately after payment
        </p>
        <p className="text-xs text-muted-foreground">
          Confirmation will be sent to your email
        </p>
      </div>
    </form>
  );
}

export function StripePaymentForm({ amount, clientSecret, onSuccess, onError, customerEmail }: StripePaymentFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(true);

  useEffect(() => {
    const fetchStripeConfig = async () => {
      try {
        // Try to get from window first (cached)
        const cachedKey = (window as any).STRIPE_PUBLISHABLE_KEY;
        
        if (cachedKey) {
          setStripePromise(loadStripe(cachedKey));
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
          setStripePromise(loadStripe(data.publishableKey));
        } else {
          throw new Error(data.error || "Failed to get Stripe configuration");
        }
      } catch (error) {
        console.error("Error loading Stripe:", error);
        onError("Payment system not configured. Please contact support.");
      } finally {
        setIsLoadingStripe(false);
      }
    };

    fetchStripeConfig();
  }, [onError]);

  if (isLoadingStripe || !stripePromise) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payment system...</p>
        </div>
      </Card>
    );
  }

  const options = {
    clientSecret,
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
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} customerEmail={customerEmail} />
    </Elements>
  );
}
