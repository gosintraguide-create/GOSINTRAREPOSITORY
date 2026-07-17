import { useState, useRef } from "react";
import { marked } from "marked";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ImageSelector } from "./ImageSelector";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Minus,
  Eye,
  EyeOff,
} from "lucide-react";

interface RichMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function renderMarkdown(content: string): string {
  const html = marked(content) as string;
  return html.replace(/<h([1-3])>([^<]+)<\/h[1-3]>/g, (_, level, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}

type ToolbarItem =
  | { divider: true }
  | { icon: React.ReactNode; title: string; action: () => void };

export function RichMarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 420,
}: RichMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // --- cursor helpers ---

  const getSel = () => {
    const ta = textareaRef.current;
    if (!ta) return { start: 0, end: 0, selected: "", before: "", after: "" };
    return {
      start: ta.selectionStart,
      end: ta.selectionEnd,
      selected: value.substring(ta.selectionStart, ta.selectionEnd),
      before: value.substring(0, ta.selectionStart),
      after: value.substring(ta.selectionEnd),
    };
  };

  const setCursor = (pos: number) => {
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) { ta.focus(); ta.setSelectionRange(pos, pos); }
    }, 0);
  };

  // Wrap selected text (or placeholder) with before/after markers
  const wrapWith = (before: string, after: string, ph = "text") => {
    const { start, selected, before: pre, after: post } = getSel();
    const word = selected || ph;
    onChange(pre + before + word + after + post);
    setCursor(start + before.length + word.length);
  };

  // Prepend prefix to current line (toggle if already present)
  const prependLine = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const lineEndRaw = value.indexOf("\n", pos);
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
    const line = value.substring(lineStart, lineEnd);
    const newLine = line.startsWith(prefix) ? line.substring(prefix.length) : prefix + line;
    onChange(value.substring(0, lineStart) + newLine + value.substring(lineEnd));
    setCursor(lineStart + newLine.length);
  };

  const insertBlock = (block: string) => {
    const { start, before, after } = getSel();
    const gap = before.endsWith("\n\n") ? "" : before.length === 0 ? "" : "\n\n";
    const gapAfter = after.startsWith("\n\n") ? "" : "\n\n";
    onChange(before + gap + block + gapAfter + after);
    setCursor(start + gap.length + block.length);
  };

  // --- link ---
  const openLinkDialog = () => {
    setLinkText(getSel().selected || "");
    setLinkUrl("");
    setLinkDialogOpen(true);
  };

  const confirmLink = () => {
    if (!linkUrl) return;
    const { before, after } = getSel();
    onChange(before + `[${linkText || linkUrl}](${linkUrl})` + after);
    setLinkDialogOpen(false);
  };

  // --- image ---
  const handleImageSelected = (url: string) => {
    insertBlock(`![Image](${url})`);
    setImageDialogOpen(false);
  };

  // --- toolbar definition ---
  const toolbar: ToolbarItem[] = [
    { icon: <span className="text-xs font-bold">H1</span>, title: "Heading 1", action: () => prependLine("# ") },
    { icon: <span className="text-xs font-bold">H2</span>, title: "Heading 2", action: () => prependLine("## ") },
    { icon: <span className="text-xs font-bold">H3</span>, title: "Heading 3", action: () => prependLine("### ") },
    { divider: true },
    { icon: <Bold className="h-3.5 w-3.5" />, title: "Bold", action: () => wrapWith("**", "**", "bold text") },
    { icon: <Italic className="h-3.5 w-3.5" />, title: "Italic", action: () => wrapWith("*", "*", "italic text") },
    { icon: <Quote className="h-3.5 w-3.5" />, title: "Block quote", action: () => prependLine("> ") },
    { divider: true },
    { icon: <List className="h-3.5 w-3.5" />, title: "Bullet list", action: () => prependLine("- ") },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, title: "Numbered list", action: () => prependLine("1. ") },
    { divider: true },
    { icon: <Link className="h-3.5 w-3.5" />, title: "Insert link", action: openLinkDialog },
    { icon: <Image className="h-3.5 w-3.5" />, title: "Insert image", action: () => setImageDialogOpen(true) },
    { icon: <Minus className="h-3.5 w-3.5" />, title: "Divider line", action: () => insertBlock("---") },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-2 py-1.5">
        {toolbar.map((item, i) =>
          "divider" in item ? (
            <div key={i} className="mx-1 h-5 w-px bg-border" />
          ) : (
            <button
              key={i}
              type="button"
              title={item.title}
              onMouseDown={(e) => { e.preventDefault(); item.action(); }}
              className="flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-secondary transition-colors"
            >
              {item.icon}
            </button>
          )
        )}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowPreview((v) => !v); }}
          className="ml-auto flex items-center gap-1.5 rounded border border-border bg-white px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
        >
          {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      {/* Panes */}
      <div className={`grid ${showPreview ? "grid-cols-2 divide-x divide-border" : "grid-cols-1"}`}>
        {/* Editor */}
        <div className="relative">
          <div className="border-b border-border bg-secondary/20 px-3 py-1 text-xs text-muted-foreground">
            Editor
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Start writing your article here...\n\nTip: Use the toolbar above to format text without any markdown knowledge."}
            className="w-full resize-none bg-white p-4 font-mono text-sm leading-relaxed focus:outline-none"
            style={{ minHeight: `${minHeight}px` }}
            spellCheck
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="flex flex-col">
            <div className="border-b border-border bg-secondary/20 px-3 py-1 text-xs text-muted-foreground">
              Preview
            </div>
            <div
              className="prose prose-article max-w-none overflow-auto p-4 text-sm"
              style={{ minHeight: `${minHeight}px` }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value || "") }}
            />
          </div>
        )}
      </div>

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Link text</Label>
              <Input
                className="mt-1"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. Visit Pena Palace"
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                className="mt-1"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => e.key === "Enter" && confirmLink()}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmLink} disabled={!linkUrl}>Insert</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image picker dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <ImageSelector
            label="Choose an image to insert"
            description="The image will be inserted at your cursor position"
            value=""
            onChange={handleImageSelected}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
