import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getPrivacyContent } from "../lib/translations";

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
  language: string;
}

export function PrivacyPolicyPage({ onNavigate, language }: PrivacyPolicyPageProps) {
  const content = getPrivacyContent(language);

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
            {/* Introduction */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.introduction.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.introduction.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Data We Collect */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.dataCollection.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.dataCollection.intro}</p>
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.dataCollection.items.map((item: any, idx: number) => (
                    <li key={idx}>
                      <strong className="text-foreground">{item.title}:</strong> {item.description}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* How We Use Data */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.dataUse.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.dataUse.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Data Sharing */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.dataSharing.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.dataSharing.intro}</p>
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.dataSharing.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Cookies */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.cookies.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.cookies.intro}</p>
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.cookies.items.map((item: any, idx: number) => (
                    <li key={idx}>
                      <strong className="text-foreground">{item.type}:</strong> {item.description}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Your Rights (GDPR) */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.rights.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.rights.intro}</p>
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.rights.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Data Security */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.security.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.security.content.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Third-Party Services */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.thirdParty.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>{content.sections.thirdParty.intro}</p>
                <ul className="list-disc space-y-2 pl-6">
                  {content.sections.thirdParty.items.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Children's Privacy */}
            <Card className="p-8">
              <h2 className="mb-4 text-foreground">{content.sections.children.title}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.sections.children.content.map((paragraph: string, idx: number) => (
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
                  <p><strong className="text-foreground">Hop On Sintra</strong></p>
                  <p>Sintra, Portugal</p>
                  <p>Email: privacy@hoponsintra.com</p>
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