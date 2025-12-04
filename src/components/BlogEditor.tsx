import { useState, useEffect, useRef } from "react";
import { toast } from "sonner@2.0.3";
import {
  loadArticles,
  loadCategories,
  saveArticles,
  saveArticlesToServer,
  generateSlug,
  estimateReadTime,
  type BlogArticle,
  DEFAULT_ARTICLES,
} from "../lib/blogManager";
import { InternalLinkHelper } from "./InternalLinkHelper";
import { loadBlogTags } from "../lib/blogTags";
import { ImageSelector } from "./ImageSelector";
import { Alert, AlertDescription } from "./ui/alert";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit, Trash2, Save, Calendar, Tag as TagIcon } from "lucide-react";

export function BlogEditor() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setArticles(loadArticles());
    setCategories(loadCategories());
    setAvailableTags(loadBlogTags());
  }, []);

  const createNewArticle = (): BlogArticle => {
    return {
      id: `article-${Date.now()}`,
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      author: "Hop On Sintra Team",
      publishDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      featuredImage: "",
      category: categories[0]?.slug || "",
      tags: [],
      isPublished: false,
      readTimeMinutes: 1,
      seo: {
        title: "",
        description: "",
        keywords: "",
      },
    };
  };

  const handleCreateNew = () => {
    setEditingArticle(createNewArticle());
    setIsEditing(true);
  };

  const handleEdit = (article: BlogArticle) => {
    setEditingArticle({ ...article });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingArticle) return;

    // Validation
    if (!editingArticle.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!editingArticle.content.trim()) {
      toast.error("Content is required");
      return;
    }

    // Generate slug if not set
    if (!editingArticle.slug) {
      editingArticle.slug = generateSlug(editingArticle.title);
    }

    // Calculate read time
    editingArticle.readTimeMinutes = estimateReadTime(editingArticle.content);

    // Update last modified
    editingArticle.lastModified = new Date().toISOString().split('T')[0];

    // Auto-generate SEO fields if empty
    if (!editingArticle.seo.title) {
      editingArticle.seo.title = editingArticle.title;
    }
    if (!editingArticle.seo.description) {
      editingArticle.seo.description = editingArticle.excerpt;
    }

    // Save to articles list
    const existingIndex = articles.findIndex(a => a.id === editingArticle.id);
    let newArticles;
    
    if (existingIndex >= 0) {
      // Update existing
      newArticles = [...articles];
      newArticles[existingIndex] = editingArticle;
    } else {
      // Add new
      newArticles = [...articles, editingArticle];
    }

    setArticles(newArticles);
    saveArticles(newArticles);
    saveArticlesToServer(newArticles, projectId, publicAnonKey);
    setIsEditing(false);
    setEditingArticle(null);
    toast.success("Article saved successfully!");
  };

  const handleDelete = (id: string) => {
    setArticleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!articleToDelete) return;

    const newArticles = articles.filter(a => a.id !== articleToDelete);
    setArticles(newArticles);
    saveArticles(newArticles);
    saveArticlesToServer(newArticles, projectId, publicAnonKey);
    setShowDeleteConfirm(false);
    setArticleToDelete(null);
    toast.success("Article deleted");
  };

  const handleAddTag = (tag: string) => {
    if (!editingArticle) return;

    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) return;
    
    if (!editingArticle.tags.includes(normalizedTag)) {
      setEditingArticle({
        ...editingArticle,
        tags: [...editingArticle.tags, normalizedTag],
      });
      setTagSearchQuery("");
    } else {
      toast.error("Tag already added to this article");
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      tags: editingArticle.tags.filter(t => t !== tag),
    });
  };

  const getFilteredTags = () => {
    if (!editingArticle) return [];
    
    const query = tagSearchQuery.toLowerCase();
    const selectedTags = editingArticle.tags || [];
    
    return availableTags
      .filter(tag => !selectedTags.includes(tag))
      .filter(tag => !query || tag.includes(query))
      .slice(0, 20); // Limit to 20 suggestions
  };

  const handleResetToDefaults = () => {
    if (confirm("This will reset all articles to the default set. Are you sure?")) {
      setArticles(DEFAULT_ARTICLES);
      saveArticles(DEFAULT_ARTICLES);
      saveArticlesToServer(DEFAULT_ARTICLES, projectId, publicAnonKey);
      toast.success("Articles reset to defaults");
    }
  };

  const handleInsertLink = (markdown: string) => {
    if (!editingArticle || !contentTextareaRef.current) return;

    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingArticle.content;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newContent = before + markdown + after;
    setEditingArticle({ ...editingArticle, content: newContent });

    // Set cursor position after inserted link
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + markdown.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);

    toast.success("Link inserted!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Blog Articles Manager</h2>
          <p className="text-muted-foreground">
            Create and manage travel guides and articles about Sintra
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="mb-4 text-muted-foreground">No articles yet</p>
            <Button onClick={handleCreateNew}>Create Your First Article</Button>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-foreground">{article.title}</h3>
                    {article.isPublished ? (
                      <Badge className="bg-green-500">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.publishDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TagIcon className="h-4 w-4" />
                      {categories.find(c => c.slug === article.category)?.name || article.category}
                    </div>
                    <div>
                      {article.readTimeMinutes} min read
                    </div>
                    <div>
                      {article.tags.length} tags
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(article)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle?.id.startsWith('article-') ? 'Create New Article' : 'Edit Article'}
            </DialogTitle>
            <DialogDescription>
              {editingArticle?.id.startsWith('article-') 
                ? 'Create and publish a new blog article for your travel guide' 
                : 'Edit your blog article content, SEO settings, and publishing options'}
            </DialogDescription>
          </DialogHeader>

          {editingArticle && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={editingArticle.title}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      })
                    }
                    placeholder="e.g., How to Get to Sintra from Lisbon"
                  />
                </div>

                <div>
                  <Label>URL Slug</Label>
                  <Input
                    value={editingArticle.slug}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, slug: e.target.value })
                    }
                    placeholder="auto-generated from title"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    URL: /blog/{editingArticle.slug}
                  </p>
                </div>

                <div>
                  <Label>Excerpt *</Label>
                  <Textarea
                    value={editingArticle.excerpt}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, excerpt: e.target.value })
                    }
                    placeholder="Brief summary of the article (2-3 sentences)"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={editingArticle.category}
                      onValueChange={(value) =>
                        setEditingArticle({ ...editingArticle, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Author</Label>
                    <Input
                      value={editingArticle.author}
                      onChange={(e) =>
                        setEditingArticle({ ...editingArticle, author: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Publish Date</Label>
                    <Input
                      type="date"
                      value={editingArticle.publishDate}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          publishDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingArticle.isPublished}
                      onCheckedChange={(checked) =>
                        setEditingArticle({ ...editingArticle, isPublished: checked })
                      }
                    />
                    <Label>Published</Label>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <h4 className="font-medium">Images</h4>
                  <ImageSelector
                    label="Hero Image"
                    description="Large image shown at the top of the article page"
                    value={editingArticle.heroImage || ""}
                    onChange={(url) =>
                      setEditingArticle({
                        ...editingArticle,
                        heroImage: url,
                      })
                    }
                  />
                  <ImageSelector
                    label="Thumbnail Image"
                    description="Small image shown in blog post listings and cards"
                    value={editingArticle.thumbnailImage || ""}
                    onChange={(url) =>
                      setEditingArticle({
                        ...editingArticle,
                        thumbnailImage: url,
                      })
                    }
                  />
                  <div>
                    <Label>Featured Image URL (Legacy - Optional)</Label>
                    <Input
                      value={editingArticle.featuredImage || ""}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          featuredImage: e.target.value,
                        })
                      }
                      placeholder="https://images.unsplash.com/..."
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      For backwards compatibility or external image URLs
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <p className="mb-2 text-sm text-muted-foreground">
                  Select tags from the predefined list for better SEO consistency
                </p>
                
                {/* Search/Filter Tags */}
                <div className="mb-3">
                  <Input
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder="Search available tags..."
                    className="mb-2"
                  />
                  
                  {/* Available Tags to Add */}
                  {tagSearchQuery && (
                    <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background p-2">
                      {getFilteredTags().length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {getFilteredTags().map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => handleAddTag(tag)}
                            >
                              + {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="py-2 text-center text-sm text-muted-foreground">
                          No matching tags found
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Tags */}
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    Selected Tags ({editingArticle.tags.length})
                  </div>
                  <div className="flex min-h-[60px] flex-wrap gap-2 rounded-md border border-border p-3">
                    {editingArticle.tags.length === 0 ? (
                      <p className="w-full text-center text-sm text-muted-foreground">
                        No tags selected. Search above to add tags.
                      </p>
                    ) : (
                      editingArticle.tags.map((tag) => (
                        <Badge key={tag} variant="default" className="gap-2">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Add Popular Tags */}
                <div className="mt-2">
                  <p className="mb-2 text-sm text-muted-foreground">Quick add:</p>
                  <div className="flex flex-wrap gap-1">
                    {["sintra", "travel-tips", "planning", "attractions", "guide", "lisbon"]
                      .filter(tag => !editingArticle.tags.includes(tag))
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer text-xs hover:bg-primary/10"
                          onClick={() => handleAddTag(tag)}
                        >
                          + {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Article Content * (Markdown supported)</Label>
                  <InternalLinkHelper onInsertLink={handleInsertLink} />
                </div>
                
                <Alert className="mb-3 border-primary/30 bg-primary/5">
                  <AlertDescription className="text-sm">
                    💡 <strong>Tip:</strong> Use the "Insert Internal Link" button to easily link to other blog articles, attractions, or pages. Click it to browse all available content!
                  </AlertDescription>
                </Alert>

                <Textarea
                  ref={contentTextareaRef}
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, content: e.target.value })
                  }
                  placeholder="Write your article content here using Markdown formatting...&#10;&#10;# Your Article Title&#10;&#10;Start writing your content here. Use the 'Insert Internal Link' button above to easily add links to other articles and attractions.&#10;&#10;## Section Heading&#10;&#10;Write more content..."
                  rows={15}
                  className="font-mono"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Supports Markdown: # Heading, ## Subheading, **bold**, *italic*, [link](url), etc.
                </p>
              </div>

              {/* SEO */}
              <div className="space-y-4 rounded-lg border border-border p-4">
                <h4 className="text-foreground">SEO Settings</h4>
                <div>
                  <Label>SEO Title</Label>
                  <Input
                    value={editingArticle.seo.title}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        seo: { ...editingArticle.seo, title: e.target.value },
                      })
                    }
                    placeholder="Auto-filled from article title"
                  />
                </div>
                <div>
                  <Label>SEO Description</Label>
                  <Textarea
                    value={editingArticle.seo.description}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        seo: { ...editingArticle.seo, description: e.target.value },
                      })
                    }
                    placeholder="Auto-filled from excerpt"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>SEO Keywords</Label>
                  <Input
                    value={editingArticle.seo.keywords}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        seo: { ...editingArticle.seo, keywords: e.target.value },
                      })
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The article will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}