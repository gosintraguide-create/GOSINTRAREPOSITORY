import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "./ui/card";
import { BlogArticle } from "../lib/blogManager";

interface SEOChecklistProps {
  article: BlogArticle;
}

export function SEOChecklist({ article }: SEOChecklistProps) {
  const checks = [
    {
      label: "Title tag optimized",
      passed: article.seo.title.length >= 50 && article.seo.title.length <= 60,
      detail: `${article.seo.title.length} characters (target: 50-60)`
    },
    {
      label: "Meta description optimized",
      passed: article.seo.description.length >= 150 && article.seo.description.length <= 160,
      detail: `${article.seo.description.length} characters (target: 150-160)`
    },
    {
      label: "Featured image set",
      passed: !!article.featuredImage,
      detail: article.featuredImage ? "✓ Set" : "Missing"
    },
    {
      label: "Multiple tags added",
      passed: article.tags.length >= 3,
      detail: `${article.tags.length} tags (recommended: 3-5)`
    },
    {
      label: "Category assigned",
      passed: !!article.category,
      detail: article.category || "Not set"
    },
    {
      label: "Content length sufficient",
      passed: article.content.split(/\s+/).length >= 500,
      detail: `${article.content.split(/\s+/).length} words (min: 500)`
    },
    {
      label: "Keywords defined",
      passed: article.seo.keywords.split(',').length >= 3,
      detail: `${article.seo.keywords.split(',').length} keywords`
    },
    {
      label: "Author attribution",
      passed: !!article.author,
      detail: article.author || "Not set"
    },
    {
      label: "FAQs included",
      passed: article.faqs && article.faqs.length >= 3,
      detail: article.faqs ? `${article.faqs.length} FAQs` : "None"
    }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const score = Math.round((passedCount / totalCount) * 100);

  // Only show in development/admin mode
  if (typeof window !== 'undefined' && !window.location.search.includes('seo-debug')) {
    return null;
  }

  return (
    <Card className="border-primary/20 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-foreground">SEO Checklist</h3>
        <div className={`rounded-full px-4 py-1 text-sm ${
          score >= 80 ? 'bg-green-100 text-green-700' :
          score >= 60 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          Score: {score}%
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-3">
            {check.passed ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${check.passed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {check.label}
              </p>
              <p className="text-xs text-muted-foreground">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-secondary/30 p-3 text-sm text-muted-foreground">
        <strong>Note:</strong> This checklist is only visible when ?seo-debug is in the URL
      </div>
    </Card>
  );
}
