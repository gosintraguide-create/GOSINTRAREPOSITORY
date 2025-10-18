import { useState, useEffect } from "react";
import { Link, FileText, MapPin, Home, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { loadArticles } from "../lib/blogManager";
import { DEFAULT_CONTENT } from "../lib/contentManager";

interface InternalLinkHelperProps {
  onInsertLink: (markdown: string) => void;
}

export function InternalLinkHelper({ onInsertLink }: InternalLinkHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    setArticles(loadArticles().filter(a => a.isPublished));
  }, []);

  // Convert attractions object to array
  const attractions = Object.entries(DEFAULT_CONTENT.attractions).map(([id, attraction]) => ({
    id,
    name: attraction.name,
    description: attraction.description,
  }));

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttractions = attractions.filter(attraction =>
    attraction.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const staticPages = [
    { name: "Home", path: "/" },
    { name: "Attractions", path: "/attractions" },
    { name: "Travel Guide (Blog)", path: "/blog" },
    { name: "About Us", path: "/about" },
  ];

  const filteredStaticPages = staticPages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const insertLink = (text: string, url: string) => {
    const markdown = `[${text}](${url})`;
    onInsertLink(markdown);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link className="h-4 w-4" />
          Insert Internal Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert Internal Link</DialogTitle>
          <DialogDescription>
            Browse and search through all blog articles, attractions, and pages to easily insert internal links
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label>Search for content to link</Label>
            <Input
              placeholder="Search articles, attractions, or pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[400px] rounded-lg border">
            <div className="space-y-6 p-4">
              {/* Static Pages */}
              {filteredStaticPages.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    <h4 className="text-foreground">Pages</h4>
                  </div>
                  <div className="space-y-2">
                    {filteredStaticPages.map((page) => (
                      <Card
                        key={page.path}
                        className="cursor-pointer p-3 transition-colors hover:bg-secondary/50"
                        onClick={() => insertLink(page.name, page.path)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-foreground">{page.name}</p>
                            <p className="text-sm text-muted-foreground">{page.path}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Insert
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog Articles */}
              {filteredArticles.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="text-foreground">Blog Articles</h4>
                    <Badge variant="outline">{filteredArticles.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {filteredArticles.map((article) => (
                      <Card
                        key={article.id}
                        className="cursor-pointer p-3 transition-colors hover:bg-secondary/50"
                        onClick={() =>
                          insertLink(article.title, `/blog/${article.slug}`)
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="mb-1 text-foreground">{article.title}</p>
                            <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
                              {article.excerpt}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /blog/{article.slug}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Insert
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Attractions */}
              {filteredAttractions.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="text-foreground">Attractions</h4>
                    <Badge variant="outline">{filteredAttractions.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {filteredAttractions.map((attraction) => (
                      <Card
                        key={attraction.id}
                        className="cursor-pointer p-3 transition-colors hover:bg-secondary/50"
                        onClick={() =>
                          insertLink(attraction.name, `/attractions/${attraction.id}`)
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="mb-1 text-foreground">{attraction.name}</p>
                            <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
                              {attraction.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /attractions/{attraction.id}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Insert
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchTerm &&
                filteredArticles.length === 0 &&
                filteredAttractions.length === 0 &&
                filteredStaticPages.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No results found for "{searchTerm}"
                    </p>
                  </div>
                )}
            </div>
          </ScrollArea>

          {/* Quick Reference */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm text-foreground">
              <BookOpen className="h-4 w-4" />
              Quick Reference
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Markdown syntax:</strong> [Link Text](url)
              </p>
              <p>
                <strong>Example:</strong> [Visit Pena Palace](/attractions/pena-palace)
              </p>
              <p>
                <strong>Tip:</strong> Click any item above to insert a formatted link automatically
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
