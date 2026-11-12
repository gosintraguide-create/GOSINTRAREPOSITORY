type StripeEvent = { type: string; data: { object: unknown } };

interface WebhookDependencies {
  secret: string | undefined;
  verify: (body: string, signature: string, secret: string) => Promise<StripeEvent>;
  process: (event: StripeEvent) => Promise<void>;
  onProcessingError?: (error: unknown) => void;
}

// Verify the original request bytes before allowing any booking-side effects.
// A missing configuration must fail closed, including on otherwise valid JSON.
export async function handlePaymentWebhook(
  request: Request,
  dependencies: WebhookDependencies,
): Promise<Response> {
  if (!dependencies.secret) {
    return Response.json({ error: "Webhook signing secret is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Webhook signature is required" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = await dependencies.verify(await request.text(), signature, dependencies.secret);
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    await dependencies.process(event);
  } catch (error) {
    dependencies.onProcessingError?.(error);
    // Stripe must retry transient database/fulfilment failures.
    return Response.json({ error: "Payment fulfillment failed; retry required" }, { status: 500 });
  }

  return Response.json({ received: true });
}
