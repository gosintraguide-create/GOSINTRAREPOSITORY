import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getTermsContent } from "../lib/translations/terms";

interface TermsOfServicePageProps {
  onNavigate: (page: string) => void;
  language: string;
}

export function TermsOfServicePage({ onNavigate, language }: TermsOfServicePageProps) {
  const content = getTermsContent(language);

  return (
    <div className="flex-1 bg-secondary/30">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-white to-accent/5 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("home")}
            className="mb-6 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {content.backToHome}
          </Button>
          <h1 className="mb-3 text-foreground">{content.title}</h1>
          <p className="text-muted-foreground">
            {content.lastUpdated}: {content.date}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Acceptance */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.acceptance.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.acceptance.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Service Description */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.service.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.service.intro}</p>
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.service.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Booking and Payment */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.booking.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.booking.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Pass Validity */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.validity.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.validity.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Cancellation */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.cancellation.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.cancellation.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* User Responsibilities */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.responsibilities.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.responsibilities.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Liability */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.liability.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.liability.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Force Majeure */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.forceMajeure.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.forceMajeure.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Intellectual Property */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.intellectual.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.intellectual.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Modifications */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.modifications.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.modifications.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Governing Law */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.law.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.law.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Contact */}
            <Card className="p-8 bg-secondary/50">
              <h2 className="mb-4 text-foreground">{content.sections.contact.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.contact.intro}</p>
                <div className="rounded-lg bg-white p-4">
                  <p><strong className="text-foreground">Go Sintra</strong></p>
                  <p>Sintra, Portugal</p>
                  <p>Email: info@gosintra.com</p>
                  <p>WhatsApp: +351 932 967 279</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
