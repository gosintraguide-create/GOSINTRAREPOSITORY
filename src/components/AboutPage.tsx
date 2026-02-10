import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { Users, Car, Award, Camera, Heart, Shield, Target } from "lucide-react";
import {
  loadContentWithLanguage,
  type WebsiteContent,
  DEFAULT_CONTENT,
} from "../lib/contentManager";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function AboutPage() {
  const { language = "en" } = useOutletContext<OutletContext>();
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    setContent(loadContentWithLanguage(language));
  }, [language]);

  const perks = [
    { icon: Users, title: "Small Groups", description: "Just 2-6 guests per vehicle for a cozy, personal experience" },
    { icon: Car, title: "Professional Guides", description: "Every driver is a certified local expert who loves Sintra" },
    { icon: Award, title: "Guaranteed Seats", description: "Pre-booked comfort with no waiting or standing" },
    { icon: Camera, title: "Your Pace", description: "Hop on & off as much as you want all day long" },
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="bg-primary py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            className="mb-6 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-xl sm:h-24 sm:w-24">
              <Heart className="h-10 w-10 text-accent sm:h-12 sm:w-12" />
            </div>
          </motion.div>

          <motion.h1
            className="mb-4 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {content.about.title}
          </motion.h1>

          <motion.p
            className="mx-auto max-w-2xl text-xl text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {content.about.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4">Our Journey</Badge>
              <h2 className="mb-6 text-foreground">How Hop On Sintra Was Born</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.about.story.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="overflow-hidden rounded-2xl shadow-2xl"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMHBhbGFjZXxlbnwxfHx8fDE3NjAxNDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Sintra Palace"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="border-y border-border bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4">Our Mission</Badge>
          <h2 className="mb-6 text-foreground">What Drives Us</h2>
          <p className="text-xl text-muted-foreground">
            {content.about.mission}
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4">What Makes Us Special</Badge>
            <h2 className="mb-4 text-foreground">The Hop On Sintra Difference</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We've reimagined how you explore Sintra—no crowded buses, no rigid schedules!
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((perk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <perk.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-foreground">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground">{perk.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="border-y border-border bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="mb-4 text-foreground">What We Stand For</h2>
            <p className="text-muted-foreground">Every decision we make is guided by these principles</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {content.about.values.map((value, index) => {
              const IconComponent = 
                index === 0 ? Shield :
                index === 1 ? Heart :
                Target;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className="h-full p-8 text-center transition-all hover:shadow-lg">
                    <div className="mb-6 flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="mb-3 text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="mb-4 text-foreground">Common Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about Hop On Sintra</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What's included in the day pass?",
                a: "Unlimited rides on all participating vehicles (tuk-tuks, UMM jeeps) with professional driver-guides for one full day. Guaranteed seating in every vehicle. You can optionally add attraction entrance tickets and guided tours at 10 AM and 2 PM."
              },
              {
                q: "Can I buy attraction tickets with my pass?",
                a: "Yes! During booking, you can add entrance tickets to popular attractions like Pena Palace, Quinta da Regaleira, and more. This saves you time – no waiting in ticket lines."
              },
              {
                q: "What are guided tours?",
                a: "Our 10 AM and 2 PM departures offer guided tours where your professional driver-guide stops at key attractions to share expert commentary about Sintra's history and hidden gems. Just €5 extra per person."
              },
              {
                q: "How do I use my QR code?",
                a: "Simply show your QR code (sent via email) to any Hop On Sintra driver before boarding. They'll scan it to verify your pass."
              },
              {
                q: "How often do vehicles depart?",
                a: "Vehicles with professional driver-guides depart every 30 minutes from all major attractions during operating hours (9:00 AM - 7:00 PM)."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 transition-all hover:shadow-lg">
                  <h4 className="mb-2 text-foreground">{faq.q}</h4>
                  <p className="text-muted-foreground">{faq.a}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}