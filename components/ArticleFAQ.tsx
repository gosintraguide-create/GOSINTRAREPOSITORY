import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "./ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

interface ArticleFAQProps {
  faqs: FAQItem[];
  articleUrl: string;
}

export function ArticleFAQ({ faqs, articleUrl }: ArticleFAQProps) {
  useEffect(() => {
    // Add FAQ schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    // Check if FAQ schema already exists
    let faqSchemaElement = document.querySelector('script[type="application/ld+json"][data-faq="true"]');
    if (!faqSchemaElement) {
      faqSchemaElement = document.createElement("script");
      faqSchemaElement.setAttribute("type", "application/ld+json");
      faqSchemaElement.setAttribute("data-faq", "true");
      document.head.appendChild(faqSchemaElement);
    }

    faqSchemaElement.textContent = JSON.stringify(faqSchema);

    return () => {
      // Cleanup on unmount
      if (faqSchemaElement && faqSchemaElement.parentNode) {
        faqSchemaElement.parentNode.removeChild(faqSchemaElement);
      }
    };
  }, [faqs, articleUrl]);

  if (faqs.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-foreground">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
