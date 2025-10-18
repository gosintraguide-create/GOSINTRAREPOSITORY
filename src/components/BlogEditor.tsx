import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Edit, Eye, EyeOff, Calendar, Tag as TagIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import {
  loadArticles,
  loadCategories,
  saveArticles,
  generateSlug,
  estimateReadTime,
  type BlogArticle,
  DEFAULT_ARTICLES,
} from "../lib/blogManager";

export function BlogEditor() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setArticles(loadArticles());
    setCategories(loadCategories());
  }, []);

  const createNewArticle = (): BlogArticle => {
    return {
      id: `article-${Date.now()}`,
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      author: "Go Sintra Team",
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
    setShowDeleteConfirm(false);
    setArticleToDelete(null);
    toast.success("Article deleted");
  };

  const handleAddTag = () => {
    if (!editingArticle || !tagInput.trim()) return;

    const tag = tagInput.trim().toLowerCase();
    if (!editingArticle.tags.includes(tag)) {
      setEditingArticle({
        ...editingArticle,
        tags: [...editingArticle.tags, tag],
      });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      tags: editingArticle.tags.filter(t => t !== tag),
    });
  };

  const handleResetToDefaults = () => {
    if (confirm("This will reset all articles to the default set. Are you sure?")) {
      setArticles(DEFAULT_ARTICLES);
      saveArticles(DEFAULT_ARTICLES);
      toast.success("Articles reset to defaults");
    }
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

                <div>
                  <Label>Featured Image URL</Label>
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
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="mb-2 flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingArticle.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-2">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <Label>Article Content * (Markdown supported)</Label>
                <Textarea
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, content: e.target.value })
                  }
                  placeholder="Write your article content here using Markdown formatting..."
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
          </DialogHeader>
          <p className="text-muted-foreground">
            This action cannot be undone. The article will be permanently deleted.
          </p>
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
