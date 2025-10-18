import { Users, Mail, MapPin, Clock, Heart, Shield, Target, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { loadContent, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";

export function AboutPage() {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    setContent(loadContent());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message! We'll get back to you soon.");
  };

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 sm:py-28">
        <div className="absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Users className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            {content.about.title}
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {content.about.subtitle}
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-6 text-foreground">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.about.story.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-lg shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMHBhbGFjZXxlbnwxfHx8fDE3NjAxNDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Sintra Palace"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="border-y border-border bg-secondary/30 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-foreground">Our Mission</h2>
          <p className="text-muted-foreground">
            {content.about.mission}
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-foreground">What We Stand For</h2>
            <p className="text-muted-foreground">Our commitment to every traveler</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {content.about.values.map((value, index) => {
              const IconComponent = 
                index === 0 ? Shield :
                index === 1 ? Heart :
                Target;
              
              return (
                <Card key={index} className="border-border p-8 text-center transition-all hover:shadow-lg">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 sm:py-28" id="contact">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-foreground">Get in Touch</h2>
            <p className="text-muted-foreground">Questions? We're here to help</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-foreground">Email</h4>
                <p className="text-muted-foreground">{content.company.email}</p>
                <p className="text-muted-foreground">Response within 24 hours</p>
              </Card>

              <Card className="border-border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-foreground">Location</h4>
                <p className="text-muted-foreground">{content.company.location}</p>
              </Card>

              <Card className="border-border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2 text-foreground">Hours</h4>
                <p className="text-muted-foreground">{content.company.operatingHours}</p>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border p-8">
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-foreground">Send a Message</h3>
                  </div>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name" className="text-foreground">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        className="mt-2 border-border"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="mt-2 border-border"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-foreground">Subject</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="How can we help?"
                      className="mt-2 border-border"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-foreground">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Your message..."
                      className="mt-2 min-h-[150px] border-border"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Send Message
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border bg-secondary/30 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">What's included in the day pass?</h4>
              <p className="text-muted-foreground">
                Unlimited rides on all participating vehicles (tuk-tuks, UMM jeeps) for one full day
                from your selected start time. Guaranteed seating in every vehicle. You can optionally add attraction entrance tickets and guided tours at 10 AM and 2 PM for extra fees.
              </p>
            </Card>

            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">Can I buy attraction tickets with my pass?</h4>
              <p className="text-muted-foreground">
                Yes! During booking, you can add entrance tickets to popular attractions like Pena Palace, Quinta da Regaleira, and more. This saves you time – no waiting in ticket lines at each location.
              </p>
            </Card>

            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">What are guided tours?</h4>
              <p className="text-muted-foreground">
                Our 10 AM and 2 PM departures offer guided tours where your driver stops at key attractions to share expert commentary about Sintra's history and hidden gems. Just €5 extra per person – book during checkout.
              </p>
            </Card>

            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">How do I use my QR code?</h4>
              <p className="text-muted-foreground">
                Simply show your QR code (sent via email) to any Go Sintra driver before boarding.
                They'll scan it to verify your pass.
              </p>
            </Card>

            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">How often do vehicles depart?</h4>
              <p className="text-muted-foreground">
                Vehicles depart every 10-15 minutes from all major attractions during operating
                hours (9:00 AM - 8:00 PM). No need to follow rigid schedules. You can also use our live chat feature to request a car at your current location.
              </p>
            </Card>

            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">Can I share my pass with others?</h4>
              <p className="text-muted-foreground">
                No, each pass is valid for one person only. Each person in your group needs their
                own day pass.
              </p>
            </Card>

            <Card className="border-border p-6">
              <h4 className="mb-2 text-foreground">What if I lose my QR code?</h4>
              <p className="text-muted-foreground">
                Contact us at info@gosintra.pt with your booking details and we'll resend your QR
                code immediately.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}