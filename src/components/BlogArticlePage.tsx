import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { motion } from "motion/react";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function BlogArticlePage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const { slug } = useParams<{ slug: string }>();

  // Placeholder article - in a real app this would come from your CMS
  const article = {
    id: slug,
    title: "Discovering Sintra's Hidden Gems",
    excerpt: "Explore the lesser-known treasures of Sintra",
    content: `
      <p>Sintra is famous for its palaces and castles, but there's so much more to discover beyond the main attractions.</p>
      <p>In this guide, we'll take you through some of the hidden gems that many visitors miss.</p>
    `,
    author: "Hop On Sintra Team",
    date: "2025-02-10",
    readTime: "5 min read",
    category: "Travel Tips",
    heroImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920",
  };

  return (
    <div className="flex-1">
      {/* Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("blog")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <ImageWithFallback
          src={article.heroImage}
          alt={article.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      {/* Article Content */}
      <article className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4">{article.category}</Badge>
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              {article.title}
            </h1>

            {/* Meta Information */}
            <div className="mb-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime}</span>
              </div>
            </div>

            {/* Article Body */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </motion.div>
        </div>
      </article>
    </div>
  );
}
