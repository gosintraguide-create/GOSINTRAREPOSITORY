// Build a purchase snapshot from trusted prices and explicitly allowed fields.
export function priceTicket(input: any, config: any) {
  const money = (value: unknown) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error("Invalid configured price");
    return Math.round(value * 100);
  };
  if (!config) throw new Error("Ticket pricing is unavailable");
  if (!Array.isArray(input?.passengers) || input.passengers.length < 1 || input.passengers.length > 50) throw new Error("Invalid passengers");
  const passengers = input.passengers.map((p: any) => {
    if (!p || !["Adult", "Child"].includes(p.type) || typeof p.name !== "string") throw new Error("Invalid passenger");
    return { name: p.name, type: p.type };
  });
  if (!input.contactInfo?.email || !input.contactInfo?.name || !/^\d{4}-\d{2}-\d{2}$/.test(input.selectedDate) || typeof input.timeSlot !== "string") throw new Error("Missing booking details");
  if (input.guidedTour) throw new Error("Guided day-pass tours are unavailable");
  const adultPrice = money(config.basePrice);
  const childPrice = money(config.childPrice || config.basePrice * 0.6);
  const adultCount = passengers.filter((p: any) => p.type === "Adult").length;
  const childCount = passengers.length - adultCount;
  const selections = input.selectedAttractions ?? [];
  if (!Array.isArray(selections)) throw new Error("Invalid attractions");
  const seen = new Set();
  const selectedAttractions = selections.map((item: any) => {
    const attraction = config.attractions?.[item?.id];
    if (!attraction || seen.has(item.id)) throw new Error("Unknown or duplicate attraction");
    seen.add(item.id);
    return { id: item.id, name: attraction.name, tickets: passengers.length, price: money(attraction.price) * passengers.length / 100 };
  });
  const passCents = adultPrice * adultCount + childPrice * childCount;
  const attractionCents = selectedAttractions.reduce((sum: number, a: any) => sum + Math.round(a.price * 100), 0);
  const amountCents = passCents + attractionCents;
  if (!Number.isSafeInteger(amountCents) || amountCents < 50) throw new Error("Invalid ticket total");
  return {
    contactInfo: { name: input.contactInfo.name, email: input.contactInfo.email, phone: input.contactInfo.phone },
    selectedDate: input.selectedDate, timeSlot: input.timeSlot, pickupLocation: input.pickupLocation,
    passengers, selectedAttractions, guidedTour: null, totalPrice: amountCents / 100,
    pricing: { adultCount, childCount, adultPrice: adultPrice / 100, childPrice: childPrice / 100,
      adultTotal: adultCount * adultPrice / 100, childTotal: childCount * childPrice / 100,
      passTotal: passCents / 100, guidedTourTotal: 0, attractionsTotal: attractionCents / 100 },
    paymentQuote: { version: 1, amountCents, currency: "eur" },
  };
}

export function verifyTicketPayment(intent: any, pending: any, kind = "ticket") {
  const quote = pending?.paymentQuote;
  if (!quote || quote.version !== 1 || !Number.isSafeInteger(quote.amountCents) || quote.amountCents < 50) throw new Error("No trusted ticket quote found; manual payment review required");
  if (intent.status !== "succeeded" || intent.currency !== "eur" || intent.amount !== quote.amountCents || intent.amount_received !== quote.amountCents || intent.metadata?.purchaseKind !== kind) throw new Error("Payment does not match this purchase");
}

function quote(amount: number) {
  const amountCents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(amountCents) || amountCents < 50) throw new Error("Purchase price is unavailable");
  return { version: 1, amountCents, currency: "eur" };
}

export function priceTour(input: any, tour: any) {
  if (!input || !tour || tour.id !== input.tourId) throw new Error("Tour not found");
  const count = input.customerInfo?.numberOfPeople;
  if (!Number.isInteger(count) || count < 1 || count > 20 || !input.customerInfo?.email || !input.customerInfo?.name || typeof input.tourDate !== "string" || !Number.isFinite(Date.parse(input.tourDate))) throw new Error("Invalid tour details");
  if (tour.pricingMode === "quote-only" || (tour.allowQuoteRequest && tour.maxGroupSize && count > tour.maxGroupSize)) throw new Error("This tour requires a quote");
  const people = Math.max(count, tour.minPeople ?? 1);
  let amount: number;
  switch (tour.pricingMode) {
    case "per-person": amount = tour.perPersonPrice * people; break;
    case "fixed": amount = tour.fixedPrice; break;
    case "group-tiers": amount = tour.groupTiers?.find((t: any) => people >= t.minPeople && people <= t.maxPeople)?.price; break;
    default: {
      if (tour.pricingMode) throw new Error("Unknown tour pricing mode");
      const match = String(tour.price).replace(/,/g, "").match(/[\d.]+/);
      amount = match ? Number(match[0]) : NaN;
    }
  }
  const paymentQuote = quote(amount);
  const { name, email, phone, language, specialRequests } = input.customerInfo;
  return { tourId: tour.id, tourTitle: tour.title, tourDate: input.tourDate,
    customerInfo: { name, email, phone, language, specialRequests, numberOfPeople: count },
    amount: paymentQuote.amountCents / 100, paymentQuote };
}

export function priceAddon(input: any, booking: any, unitPrice: number) {
  if (!input || !booking || booking.id !== input.bookingId || booking.status === "cancelled" || booking.paymentStatus !== "paid") throw new Error("A paid booking is required");
  const quantity = booking.passengers?.length;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new Error("Invalid passenger quantity");
  const sunsetDate = booking.selectedDate?.split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sunsetDate)) throw new Error("Invalid sunset date");
  const paymentQuote = quote(unitPrice * quantity);
  return { bookingId: booking.id, sunsetDate, quantity, amount: paymentQuote.amountCents / 100, paymentQuote };
}
