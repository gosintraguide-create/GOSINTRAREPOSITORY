// A clock expiring is not proof that money cannot still arrive.
// Keep capacity until Stripe confirms cancellation, or consume it on fulfillment.
export async function reconcileCheckoutHold(
  hold: { payment_id: string; kind: string },
  deps: {
    retrieve: (id: string) => Promise<{ status: string }>;
    cancel: (id: string) => Promise<{ status: string }>;
    release: (id: string) => Promise<void>;
    finalize: (id: string, kind: string) => Promise<unknown>;
  },
) {
  const payment = await deps.retrieve(hold.payment_id);
  if (payment.status === "succeeded") {
    await deps.finalize(hold.payment_id, hold.kind);
    return "fulfilled";
  }
  if (payment.status === "canceled") {
    await deps.release(hold.payment_id);
    return "released";
  }
  if (["requires_payment_method", "requires_confirmation", "requires_action"].includes(payment.status)) {
    const canceled = await deps.cancel(hold.payment_id);
    if (canceled.status === "canceled") {
      await deps.release(hold.payment_id);
      return "released";
    }
  }
  return "retained";
}
