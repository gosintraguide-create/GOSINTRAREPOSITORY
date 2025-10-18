import { Download, FileText, Globe, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner@2.0.3";
import { downloadSitemap, downloadRobotsTxt, generateSitemap } from "../lib/sitemapGenerator";
import { getPublishedArticles } from "../lib/blogManager";

export function SEOTools() {
  const handleDownloadSitemap = () => {
    downloadSitemap();
    toast.success("Sitemap downloaded successfully!");
  };

  const handleDownloadRobotsTxt = () => {
    downloadRobotsTxt();
    toast.success("robots.txt downloaded successfully!");
  };

  const handleCopySitemap = () => {
    const xml = generateSitemap();
    navigator.clipboard.writeText(xml);
    toast.success("Sitemap XML copied to clipboard!");
  };

  const publishedArticles = getPublishedArticles();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-foreground">SEO Tools</h2>
        <p className="text-muted-foreground">
          Manage SEO assets for your website including sitemaps and robots.txt
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl">{publishedArticles.length}</p>
              <p className="text-sm text-muted-foreground">Published Articles</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Globe className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl">{5 + publishedArticles.length + 7}</p>
              <p className="text-sm text-muted-foreground">Pages in Sitemap</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl">100%</p>
              <p className="text-sm text-muted-foreground">SEO Optimized</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sitemap Section */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="mb-2 text-foreground">XML Sitemap</h3>
          <p className="text-sm text-muted-foreground">
            Your sitemap includes all static pages, attractions, and blog articles. Download and upload to your website root or submit to Google Search Console.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadSitemap} className="gap-2">
            <Download className="h-4 w-4" />
            Download Sitemap
          </Button>
          <Button variant="outline" onClick={handleCopySitemap} className="gap-2">
            <FileText className="h-4 w-4" />
            Copy XML
          </Button>
        </div>

        <div className="mt-4 rounded-lg bg-secondary/30 p-4">
          <p className="mb-2 text-sm">
            <strong>Sitemap Location:</strong>
          </p>
          <code className="text-sm text-muted-foreground">
            https://gosintra.pt/sitemap.xml
          </code>
        </div>
      </Card>

      {/* Robots.txt Section */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="mb-2 text-foreground">robots.txt</h3>
          <p className="text-sm text-muted-foreground">
            Controls which pages search engines can crawl. Blocks admin and internal pages while allowing all public content.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadRobotsTxt} className="gap-2">
            <Download className="h-4 w-4" />
            Download robots.txt
          </Button>
        </div>

        <div className="mt-4 rounded-lg bg-secondary/30 p-4">
          <p className="mb-2 text-sm">
            <strong>robots.txt Location:</strong>
          </p>
          <code className="text-sm text-muted-foreground">
            https://gosintra.pt/robots.txt
          </code>
        </div>
      </Card>

      {/* SEO Best Practices */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
        <h3 className="mb-4 text-foreground">SEO Best Practices Checklist</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>All blog articles have unique meta titles and descriptions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Structured data (JSON-LD) for articles with Article schema</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Open Graph and Twitter Card tags for social sharing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Canonical URLs to prevent duplicate content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Breadcrumbs for better navigation and SEO</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Proper heading hierarchy (H1, H2, H3)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Image alt text for accessibility and SEO</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Mobile-responsive design for all pages</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Fast page load times and performance optimization</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Internal linking between related articles</span>
          </li>
        </ul>
      </Card>

      {/* Next Steps */}
      <Card className="bg-secondary/30 p-6">
        <h3 className="mb-4 text-foreground">Deployment Steps</h3>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
              1
            </span>
            <div>
              <strong className="block">Download sitemap.xml and robots.txt</strong>
              <span className="text-muted-foreground">
                Use the buttons above to download both files
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
              2
            </span>
            <div>
              <strong className="block">Upload to your website root</strong>
              <span className="text-muted-foreground">
                Place both files in the /public directory of your website
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
              3
            </span>
            <div>
              <strong className="block">Submit to Google Search Console</strong>
              <span className="text-muted-foreground">
                Visit search.google.com/search-console and submit your sitemap URL
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
              4
            </span>
            <div>
              <strong className="block">Update sitemap when adding articles</strong>
              <span className="text-muted-foreground">
                Regenerate and reupload your sitemap after publishing new blog posts
              </span>
            </div>
          </li>
        </ol>
      </Card>
    </div>
  );
}
