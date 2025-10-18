import { useState, useEffect } from "react";
import { Plus, Trash2, Tag as TagIcon, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import {
  loadBlogTags,
  saveBlogTags,
  addTag,
  removeTag,
  resetToDefaultTags,
  getTagsByFrequency,
  DEFAULT_BLOG_TAGS,
} from "../lib/blogTags";
import { loadArticles } from "../lib/blogManager";

export function TagManagement() {
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [tagUsage, setTagUsage] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedTags = loadBlogTags();
    const articles = loadArticles();
    const usage = getTagsByFrequency(articles);
    
    setTags(loadedTags);
    setTagUsage(usage);
  };

  const handleAddTag = () => {
    const success = addTag(newTagInput);
    
    if (success) {
      toast.success("Tag added successfully");
      setNewTagInput("");
      loadData();
    } else {
      if (!newTagInput.trim()) {
        toast.error("Tag cannot be empty");
      } else {
        toast.error("Tag already exists");
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    const isUsed = tagUsage.some(t => t.tag === tag);
    
    if (isUsed) {
      if (!confirm(`This tag is currently used in ${tagUsage.find(t => t.tag === tag)?.count} article(s). Are you sure you want to remove it?`)) {
        return;
      }
    }
    
    removeTag(tag);
    toast.success("Tag removed");
    loadData();
  };

  const handleReset = () => {
    resetToDefaultTags();
    toast.success("Tags reset to defaults");
    setShowResetConfirm(false);
    loadData();
  };

  const getTagUsageCount = (tag: string): number => {
    return tagUsage.find(t => t.tag === tag)?.count || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Blog Tags Manager</h2>
          <p className="text-muted-foreground">
            Manage the master list of tags for better SEO consistency
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowResetConfirm(true)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Add New Tag */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-foreground">
          <Plus className="h-5 w-5" />
          Add New Tag
        </h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value.toLowerCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Enter tag name (lowercase, use hyphens for spaces)"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Example: best-time-to-visit, family-friendly, unesco-heritage
            </p>
          </div>
          <Button onClick={handleAddTag}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Tags</div>
          <div className="text-2xl font-semibold">{tags.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Used in Articles</div>
          <div className="text-2xl font-semibold">{tagUsage.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Unused Tags</div>
          <div className="text-2xl font-semibold">{tags.length - tagUsage.length}</div>
        </Card>
      </div>

      {/* Tags List */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-foreground">
          <TagIcon className="h-5 w-5" />
          All Tags ({tags.length})
        </h3>
        
        {tags.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No tags available. Add your first tag above.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const usageCount = getTagUsageCount(tag);
              const isUsed = usageCount > 0;
              
              return (
                <div
                  key={tag}
                  className="group relative"
                >
                  <Badge
                    variant={isUsed ? "default" : "outline"}
                    className="gap-2 pr-8"
                  >
                    {tag}
                    {isUsed && (
                      <span className="ml-1 rounded-full bg-background px-1.5 text-xs">
                        {usageCount}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      title={isUsed ? `Used in ${usageCount} article(s)` : "Remove tag"}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Most Used Tags */}
      {tagUsage.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-foreground">Most Used Tags</h3>
          <div className="space-y-2">
            {tagUsage.slice(0, 10).map(({ tag, count }) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm">{tag}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(count / tagUsage[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-muted-foreground">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Tags to Defaults?</DialogTitle>
            <DialogDescription>
              This will restore the default tag list ({DEFAULT_BLOG_TAGS.length} tags). 
              Any custom tags you've added will be removed. This won't affect tags already assigned to articles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
