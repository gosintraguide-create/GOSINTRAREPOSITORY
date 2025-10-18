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
      <div>
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-sm">Secure payment powered by Stripe</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4 text-primary" />
          <p className="text-sm">Your payment information is encrypted and secure</p>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent hover:bg-accent/90"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay €{amount.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-center text-muted-foreground">
        You'll receive your QR codes immediately after payment
      </p>
    </form>
  );
}

export function StripePaymentForm({ amount, clientSecret, onSuccess, onError, customerEmail }: StripePaymentFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    // Get Stripe publishable key from environment or window
    const publishableKey = (window as any).STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error("Stripe publishable key not configured");
      onError("Payment system not configured. Please contact support.");
      return;
    }

    setStripePromise(loadStripe(publishableKey));
  }, [onError]);

  if (!stripePromise) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
