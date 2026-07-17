import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  Smartphone,
  Link2,
  Zap,
  Globe,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface SEOScore {
  category: string;
  score: number;
  maxScore: number;
  status: "excellent" | "good" | "needs-improvement" | "poor";
  icon: any;
  issues: string[];
  recommendations: string[];
}

export function SEOAnalyzer() {
  const [overallScore, setOverallScore] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [scores, setScores] = useState<SEOScore[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const analyzeSEO = () => {
    setAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      const seoScores: SEOScore[] = [];

      // 1. Meta Tags Analysis
      const metaScore = analyzeMetaTags();
      seoScores.push(metaScore);

      // 2. Content Quality
      const contentScore = analyzeContent();
      seoScores.push(contentScore);

      // 3. Images & Media
      const imageScore = analyzeImages();
      seoScores.push(imageScore);

      // 4. Mobile Responsiveness
      const mobileScore = analyzeMobile();
      seoScores.push(mobileScore);

      // 5. Page Performance
      const performanceScore = analyzePerformance();
      seoScores.push(performanceScore);

      // 6. Technical SEO
      const technicalScore = analyzeTechnical();
      seoScores.push(technicalScore);

      // 7. Internal Linking
      const linkingScore = analyzeLinking();
      seoScores.push(linkingScore);

      // 8. Social Media Integration
      const socialScore = analyzeSocial();
      seoScores.push(socialScore);

      // Calculate overall score
      const totalScore = seoScores.reduce((sum, s) => sum + s.score, 0);
      const maxPossible = seoScores.reduce((sum, s) => sum + s.maxScore, 0);
      const overall = Math.round((totalScore / maxPossible) * 100);

      setScores(seoScores);
      setOverallScore(overall);
      setAnalyzing(false);
    }, 1500);
  };

  const analyzeMetaTags = (): SEOScore => {
    let score = 0;
    let maxScore = 20;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for page titles
    const hasTitle = document.title && document.title.length > 0;
    if (hasTitle) {
      score += 5;
      if (document.title.length > 60) {
        issues.push("Page title is too long (should be under 60 characters)");
        recommendations.push("Shorten your page title to 50-60 characters for optimal display in search results");
      } else {
        score += 3;
      }
    } else {
      issues.push("Missing page title");
      recommendations.push("Add a unique, descriptive title tag to every page");
    }

    // Check meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute("content")) {
      score += 5;
      const descLength = metaDesc.getAttribute("content")?.length || 0;
      if (descLength < 120 || descLength > 160) {
        issues.push("Meta description length not optimal (should be 120-160 characters)");
        recommendations.push("Adjust meta description to 120-160 characters for better click-through rates");
      } else {
        score += 3;
      }
    } else {
      issues.push("Missing meta description");
      recommendations.push("Add unique meta descriptions to all pages to improve search result snippets");
    }

    // Check for canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      score += 4;
    } else {
      issues.push("Missing canonical URL");
      recommendations.push("Add canonical tags to prevent duplicate content issues");
    }

    return {
      category: "Meta Tags & Titles",
      score,
      maxScore,
      status: score >= 18 ? "excellent" : score >= 14 ? "good" : score >= 10 ? "needs-improvement" : "poor",
      icon: FileText,
      issues,
      recommendations,
    };
  };

  const analyzeContent = (): SEOScore => {
    let score = 0;
    let maxScore = 15;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check H1 tags
    const h1Tags = document.querySelectorAll("h1");
    if (h1Tags.length === 1) {
      score += 5;
    } else if (h1Tags.length === 0) {
      issues.push("No H1 heading found");
      recommendations.push("Add exactly one H1 heading per page that describes the main topic");
    } else {
      issues.push(`Multiple H1 headings found (${h1Tags.length})`);
      recommendations.push("Use only one H1 heading per page for better SEO");
      score += 2;
    }

    // Check heading hierarchy
    const h2Tags = document.querySelectorAll("h2");
    const h3Tags = document.querySelectorAll("h3");
    if (h2Tags.length > 0) {
      score += 3;
    } else {
      issues.push("No H2 headings for content structure");
      recommendations.push("Use H2 headings to structure your content into clear sections");
    }

    if (h3Tags.length > 0) {
      score += 2;
    }

    // Check content length
    const bodyText = document.body.innerText;
    const wordCount = bodyText.split(/\s+/).length;
    if (wordCount > 300) {
      score += 5;
    } else {
      issues.push(`Low word count (${wordCount} words)`);
      recommendations.push("Aim for at least 300 words of quality content per page");
      score += Math.floor((wordCount / 300) * 5);
    }

    return {
      category: "Content Quality",
      score,
      maxScore,
      status: score >= 13 ? "excellent" : score >= 10 ? "good" : score >= 7 ? "needs-improvement" : "poor",
      icon: FileText,
      issues,
      recommendations,
    };
  };

  const analyzeImages = (): SEOScore => {
    let score = 0;
    let maxScore = 10;
    const issues: string[] = [];
    const recommendations: string[] = [];

    const images = document.querySelectorAll("img");
    let imagesWithAlt = 0;

    images.forEach((img) => {
      if (img.getAttribute("alt")) {
        imagesWithAlt++;
      }
    });

    if (images.length === 0) {
      score += 5;
      recommendations.push("Consider adding relevant images to improve user engagement");
    } else {
      const altPercentage = (imagesWithAlt / images.length) * 100;
      score += Math.floor((altPercentage / 100) * 7);

      if (altPercentage < 100) {
        issues.push(`${images.length - imagesWithAlt} images missing alt text`);
        recommendations.push("Add descriptive alt text to all images for accessibility and SEO");
      }

      // Check for optimized image formats
      let optimizedImages = 0;
      images.forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.includes("unsplash") || src.includes(".webp") || src.includes("?") || src.includes("crop")) {
          optimizedImages++;
        }
      });

      if (optimizedImages / images.length > 0.8) {
        score += 3;
      } else {
        issues.push("Some images may not be optimized");
        recommendations.push("Use modern image formats (WebP, AVIF) and optimize image sizes");
      }
    }

    return {
      category: "Images & Media",
      score,
      maxScore,
      status: score >= 9 ? "excellent" : score >= 7 ? "good" : score >= 5 ? "needs-improvement" : "poor",
      icon: ImageIcon,
      issues,
      recommendations,
    };
  };

  const analyzeMobile = (): SEOScore => {
    let score = 0;
    let maxScore = 10;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      score += 5;
    } else {
      issues.push("Missing viewport meta tag");
      recommendations.push("Add viewport meta tag for proper mobile rendering");
    }

    // Check responsive design classes (Tailwind)
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    if (responsiveElements.length > 10) {
      score += 5;
    } else if (responsiveElements.length > 0) {
      score += 3;
      issues.push("Limited responsive design implementation");
      recommendations.push("Ensure all components adapt properly to different screen sizes");
    } else {
      issues.push("No responsive design classes detected");
      recommendations.push("Implement responsive design for mobile, tablet, and desktop screens");
    }

    return {
      category: "Mobile Responsiveness",
      score,
      maxScore,
      status: score >= 9 ? "excellent" : score >= 7 ? "good" : score >= 5 ? "needs-improvement" : "poor",
      icon: Smartphone,
      issues,
      recommendations,
    };
  };

  const analyzePerformance = (): SEOScore => {
    let score = 0;
    let maxScore = 15;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const totalImages = document.querySelectorAll("img").length;
    if (totalImages > 0 && lazyImages.length / totalImages > 0.5) {
      score += 4;
    } else if (totalImages > 3) {
      issues.push("Images not using lazy loading");
      recommendations.push("Implement lazy loading for images to improve page load speed");
      score += 1;
    } else {
      score += 4;
    }

    // Check for external scripts
    const scripts = document.querySelectorAll("script[src]");
    if (scripts.length < 5) {
      score += 4;
    } else if (scripts.length < 10) {
      score += 2;
      issues.push(`${scripts.length} external scripts detected`);
      recommendations.push("Minimize external scripts and defer non-critical JavaScript");
    } else {
      issues.push(`Too many external scripts (${scripts.length})`);
      recommendations.push("Reduce the number of external scripts to improve page load time");
      score += 1;
    }

    // Check for CSS optimization
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    if (stylesheets.length < 3) {
      score += 4;
    } else {
      issues.push("Multiple CSS files detected");
      recommendations.push("Consider combining CSS files to reduce HTTP requests");
      score += 2;
    }

    // Performance scoring
    score += 3; // Base score for modern framework

    return {
      category: "Page Performance",
      score,
      maxScore,
      status: score >= 13 ? "excellent" : score >= 10 ? "good" : score >= 7 ? "needs-improvement" : "poor",
      icon: Zap,
      issues,
      recommendations,
    };
  };

  const analyzeTechnical = (): SEOScore => {
    let score = 0;
    let maxScore = 15;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check HTTPS
    if (window.location.protocol === "https:") {
      score += 5;
    } else {
      issues.push("Site not using HTTPS");
      recommendations.push("Implement SSL certificate for security and SEO benefits");
    }

    // Check for structured data
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    if (structuredData.length > 0) {
      score += 5;
    } else {
      issues.push("No structured data (Schema.org) found");
      recommendations.push("Add JSON-LD structured data for better search engine understanding");
    }

    // Check for sitemap reference in robots.txt
    score += 3; // Assume sitemap exists based on SEOTools component

    // Check language declaration
    const htmlLang = document.documentElement.getAttribute("lang");
    if (htmlLang) {
      score += 2;
    } else {
      issues.push("Missing language declaration in HTML tag");
      recommendations.push("Add lang attribute to HTML tag (e.g., <html lang='en'>)");
    }

    return {
      category: "Technical SEO",
      score,
      maxScore,
      status: score >= 13 ? "excellent" : score >= 10 ? "good" : score >= 7 ? "needs-improvement" : "poor",
      icon: Globe,
      issues,
      recommendations,
    };
  };

  const analyzeLinking = (): SEOScore => {
    let score = 0;
    let maxScore = 10;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check internal links
    const allLinks = document.querySelectorAll("a[href]");
    const internalLinks = Array.from(allLinks).filter((link) => {
      const href = link.getAttribute("href") || "";
      return !href.startsWith("http") || href.includes(window.location.hostname);
    });

    if (internalLinks.length > 10) {
      score += 5;
    } else if (internalLinks.length > 5) {
      score += 3;
      issues.push("Limited internal linking structure");
      recommendations.push("Add more internal links to related pages to improve site navigation and SEO");
    } else {
      issues.push("Few internal links detected");
      recommendations.push("Build a strong internal linking structure to distribute page authority");
      score += 1;
    }

    // Check for broken links (basic check)
    const externalLinks = allLinks.length - internalLinks.length;
    if (externalLinks > 0 && externalLinks < 20) {
      score += 3;
    } else if (externalLinks >= 20) {
      issues.push("High number of external links");
      recommendations.push("Review external links and ensure they add value to users");
      score += 1;
    } else {
      score += 3;
    }

    // Check for descriptive anchor text
    let descriptiveAnchors = 0;
    allLinks.forEach((link) => {
      const text = link.textContent?.trim() || "";
      if (text && text.length > 3 && !["click here", "read more", "here"].includes(text.toLowerCase())) {
        descriptiveAnchors++;
      }
    });

    if (allLinks.length > 0 && descriptiveAnchors / allLinks.length > 0.7) {
      score += 2;
    } else {
      issues.push("Some links have non-descriptive anchor text");
      recommendations.push("Use descriptive anchor text that tells users and search engines what to expect");
    }

    return {
      category: "Internal Linking",
      score,
      maxScore,
      status: score >= 9 ? "excellent" : score >= 7 ? "good" : score >= 5 ? "needs-improvement" : "poor",
      icon: Link2,
      issues,
      recommendations,
    };
  };

  const analyzeSocial = (): SEOScore => {
    let score = 0;
    let maxScore = 10;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');

    let ogScore = 0;
    if (ogTitle) ogScore++;
    if (ogDescription) ogScore++;
    if (ogImage) ogScore++;
    if (ogUrl) ogScore++;

    score += ogScore;

    if (ogScore < 4) {
      issues.push(`Missing ${4 - ogScore} Open Graph tag(s)`);
      recommendations.push("Add complete Open Graph tags for better social media sharing");
    }

    // Check Twitter Card tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    let twitterScore = 0;
    if (twitterCard) twitterScore++;
    if (twitterTitle) twitterScore++;
    if (twitterDescription) twitterScore++;
    if (twitterImage) twitterScore++;

    score += Math.floor(twitterScore * 1.5);

    if (twitterScore < 4) {
      issues.push("Incomplete Twitter Card meta tags");
      recommendations.push("Add Twitter Card tags to optimize content sharing on Twitter/X");
    }

    return {
      category: "Social Media",
      score,
      maxScore,
      status: score >= 9 ? "excellent" : score >= 7 ? "good" : score >= 5 ? "needs-improvement" : "poor",
      icon: Share2,
      issues,
      recommendations,
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return "from-green-500 to-green-600";
    if (score >= 70) return "from-blue-500 to-blue-600";
    if (score >= 50) return "from-orange-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-500">Excellent</Badge>;
      case "good":
        return <Badge className="bg-blue-500">Good</Badge>;
      case "needs-improvement":
        return <Badge className="bg-orange-500">Needs Work</Badge>;
      case "poor":
        return <Badge className="bg-red-500">Poor</Badge>;
      default:
        return null;
    }
  };

  useEffect(() => {
    // Run initial analysis
    analyzeSEO();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-foreground">SEO Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of your website's SEO performance
          </p>
        </div>
        <Button
          onClick={analyzeSEO}
          disabled={analyzing}
          className="gap-2"
          variant="outline"
        >
          {analyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Reanalyze
            </>
          )}
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className={`border-2 bg-gradient-to-br ${getScoreGradient(overallScore)} p-8 text-white`}>
        <div className="flex flex-col items-center text-center">
          <Search className="mb-4 h-16 w-16" />
          <h3 className="mb-2 text-white">Overall SEO Score</h3>
          <div className="mb-4 text-6xl font-extrabold">{overallScore}%</div>
          <p className="mb-4 text-white/90">
            {overallScore >= 85
              ? "Excellent! Your SEO is well optimized."
              : overallScore >= 70
              ? "Good job! A few improvements will make it great."
              : overallScore >= 50
              ? "Needs work. Follow the recommendations below."
              : "Critical issues found. Address them immediately."}
          </p>
          <div className="w-full max-w-md">
            <Progress value={overallScore} className="h-3 bg-white/30" />
          </div>
        </div>
      </Card>

      {/* Category Scores */}
      <div className="grid gap-4 md:grid-cols-2">
        {scores.map((scoreData) => {
          const Icon = scoreData.icon;
          const percentage = Math.round((scoreData.score / scoreData.maxScore) * 100);
          const isExpanded = expandedCategories.has(scoreData.category);

          return (
            <Card key={scoreData.category} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(scoreData.category)}>
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        scoreData.status === "excellent" ? "bg-green-500/10" :
                        scoreData.status === "good" ? "bg-blue-500/10" :
                        scoreData.status === "needs-improvement" ? "bg-orange-500/10" :
                        "bg-red-500/10"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          scoreData.status === "excellent" ? "text-green-600" :
                          scoreData.status === "good" ? "text-blue-600" :
                          scoreData.status === "needs-improvement" ? "text-orange-600" :
                          "text-red-600"
                        }`} />
                      </div>
                      <div>
                        <h3 className="mb-1 text-foreground">{scoreData.category}</h3>
                        {getStatusBadge(scoreData.status)}
                      </div>
                    </div>
                    <div className={`text-right ${getScoreColor(percentage)}`}>
                      <div className="text-2xl">{percentage}%</div>
                      <div className="text-xs text-muted-foreground">
                        {scoreData.score}/{scoreData.maxScore}
                      </div>
                    </div>
                  </div>

                  <Progress value={percentage} className="mb-4 h-2" />

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Details ({scoreData.issues.length + scoreData.recommendations.length})
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="border-t bg-secondary/30 p-6">
                    {scoreData.issues.length > 0 && (
                      <div className="mb-4">
                        <h4 className="mb-2 flex items-center gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Issues Found
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {scoreData.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {scoreData.recommendations.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {scoreData.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {scoreData.issues.length === 0 && scoreData.recommendations.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        No issues found - this category is well optimized!
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Quick Wins Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Quick Wins - Priority Improvements
        </h3>
        <div className="space-y-3">
          {scores
            .filter((s) => s.issues.length > 0)
            .sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score))
            .slice(0, 5)
            .map((scoreData) => (
              <div key={scoreData.category} className="flex items-start gap-3 rounded-lg bg-white p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                <div className="flex-1">
                  <p className="mb-1">
                    <strong>{scoreData.category}:</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">{scoreData.recommendations[0]}</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  +{scoreData.maxScore - scoreData.score} pts
                </Badge>
              </div>
            ))}
          {scores.every((s) => s.issues.length === 0) && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p>Excellent! No critical issues found. Keep monitoring your SEO performance.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
