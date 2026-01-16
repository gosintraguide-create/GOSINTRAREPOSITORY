import { getTranslation, getUITranslation } from "../lib/translations";

// Force rebuild - pricing moved to Quick Details card

interface PrivateTour {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  duration: string;
  price: string;
  priceSubtext?: string;
  features: string[];
  badge?: string;
  badgeColor?: "primary" | "accent";
  buttonText: string;
  buttonVariant?: "default" | "outline";
  published: boolean;
  order: number;
  heroImage?: string;
}

interface PrivateTourDetailPageProps {
  onNavigate: (page: string) => void;
  tourId: string;
  language?: string;
}

export function PrivateTourDetailPage({
  onNavigate,
  tourId,
  language = "en",
}: PrivateTourDetailPageProps) {
  const content = getTranslation(language);
  const uiT = getUITranslation(language);
  const [tour, setTour] = useState<PrivateTour | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    numberOfPeople: "",
    preferredDate: undefined as Date | undefined,
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTour();
  }, [tourId]);

  const loadTour = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const foundTour = (data.tours || []).find((t: PrivateTour) => t.id === tourId);
        if (foundTour && foundTour.published) {
          setTour(foundTour);
        }
      }
    } catch (error) {
      console.error("Error loading tour:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitTourRequest = async () => {
    if (!tour) return;

    // Validation
    if (!formData.customerName || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tourTitle: tour.title,
            customerName: formData.customerName,
            email: formData.email,
            phone: formData.phone,
            preferredDate: formData.preferredDate?.toISOString(),
            numberOfPeople: formData.numberOfPeople ? parseInt(formData.numberOfPeople) : undefined,
            message: formData.message,
          }),
        }
      );

      if (response.ok) {
        toast.success("Request submitted! We'll contact you soon.");
        setShowRequestDialog(false);
        setFormData({
          customerName: "",
          email: "",
          phone: "",
          numberOfPeople: "",
          preferredDate: undefined,
          message: "",
        });
      } else {
        toast.error("Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting tour request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading tour details...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4">Tour Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            This tour is not available or has been removed.
          </p>
          <Button onClick={() => onNavigate("private-tours")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Tours
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Back Button - Fixed at top */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("private-tours")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Tours
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[300px] overflow-hidden sm:h-[400px]">
        <ImageWithFallback
          src={tour.heroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&h=900&fit=crop"}
          alt={tour.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      {/* Title & Badge Section */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {tour.badge && (
                <Badge
                  className={`mb-3 ${
                    tour.badgeColor === "accent"
                      ? "bg-accent text-white"
                      : "bg-primary text-white"
                  }`}
                >
                  {tour.badge}
                </Badge>
              )}
              <h1 className="mb-3 text-foreground">{tour.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg">{tour.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-lg">Private group experience</span>
                </div>
              </div>
            </div>
            
            {/* Removed pricing box - now in Quick Details card */}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-secondary/10 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Tour Details */}
            <div className="lg:col-span-2">
              <Card className="mb-8 p-6 sm:p-8">
                <h2 className="mb-4 text-foreground">About This Tour</h2>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {tour.longDescription || tour.description}
                </p>
              </Card>

              <Card className="mb-8 p-6 sm:p-8">
                <h2 className="mb-6 text-foreground">What's Included</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tour.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                        tour.badgeColor === "accent"
                          ? "bg-accent"
                          : "bg-primary"
                      }`}>
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-l-4 border-l-primary p-6 sm:p-8">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Important Information
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Private tours are customizable to your preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Prices may vary based on group size and specific requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Hotel pickup and drop-off can be arranged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Contact us to discuss your ideal itinerary</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-2 border-primary p-6">
                {/* Price Display - Mobile */}
                <div className="mb-6 block text-center sm:hidden">
                  <p className="mb-1 text-sm text-muted-foreground">Starting from</p>
                  <p className="mb-1 text-3xl font-bold text-primary">
                    {tour.price}
                  </p>
                  {tour.priceSubtext && (
                    <p className="text-sm text-muted-foreground">
                      {tour.priceSubtext}
                    </p>
                  )}
                </div>

                <div className="mb-6 space-y-4 border-t border-border pt-6 sm:border-t-0 sm:pt-0">
                  <h3 className="font-semibold text-foreground">Quick Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Duration</p>
                        <p className="text-muted-foreground">{tour.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Group Type</p>
                        <p className="text-muted-foreground">Private experience</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                      <p className="mb-1 text-xs text-muted-foreground">Starting from</p>
                      <p className="mb-0.5 text-2xl font-bold text-primary">
                        {tour.price}
                      </p>
                      {tour.priceSubtext && (
                        <p className="text-xs text-muted-foreground">
                          {tour.priceSubtext}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  className="mb-3 w-full"
                  size="lg"
                  onClick={() => setShowRequestDialog(true)}
                >
                  Request This Tour
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => onNavigate("live-chat")}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat With Us
                </Button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  We'll respond within 24 hours with a personalized quote
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tour Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request This Private Tour</DialogTitle>
            <DialogDescription>
              Fill in your details and we'll get back to you shortly with a personalized quote for "{tour.title}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">Tour</p>
              <p className="text-lg font-semibold text-foreground">{tour.title}</p>
              <p className="text-sm text-muted-foreground">{tour.price} • {tour.duration}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder="John Doe"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+351 123 456 789"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="people">Number of People</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="people"
                    type="number"
                    min="1"
                    value={formData.numberOfPeople}
                    onChange={(e) =>
                      setFormData({ ...formData, numberOfPeople: e.target.value })
                    }
                    placeholder="2"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label>Preferred Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.preferredDate
                        ? formData.preferredDate.toLocaleDateString()
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.preferredDate}
                      onSelect={(date) =>
                        setFormData({ ...formData, preferredDate: date })
                      }
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="message">Additional Information (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Tell us about your preferences, special requirements, or any questions..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={submitTourRequest}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}