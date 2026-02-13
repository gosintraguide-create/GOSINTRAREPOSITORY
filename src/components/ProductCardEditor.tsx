import { useState } from "react";
import { Edit, Trash2, Plus, Image as ImageIcon, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ImageSelector } from "./ImageSelector";

interface ProductCardEditorProps {
  content: any;
  updateContent: (path: string[], value: any) => void;
  updateArrayItem: (path: string[], index: number, field: string, value: any) => void;
  addArrayItem: (path: string[], template: any) => void;
  removeArrayItem: (path: string[], index: number) => void;
}

export function ProductCardEditor({
  content,
  updateContent,
  updateArrayItem,
  addArrayItem,
  removeArrayItem,
}: ProductCardEditorProps) {
  const [editingCard, setEditingCard] = useState<"daypass" | "travelGuide" | "monuments" | null>(null);

  const cardTitles = {
    daypass: "Full Day Pass Card",
    travelGuide: "Travel Guide Card",
    monuments: "Monuments Card",
  };

  const getCardData = (cardType: "daypass" | "travelGuide" | "monuments") => {
    return content.homepage.productCards?.[cardType];
  };

  const handleEditCard = (cardType: "daypass" | "travelGuide" | "monuments") => {
    setEditingCard(cardType);
  };

  const handleCloseDialog = () => {
    setEditingCard(null);
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="mb-4 text-foreground">Product Cards (Carousels)</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Edit the three product cards with image carousels and text content
        </p>
        
        <div className="space-y-3">
          {/* Day Pass Card Button */}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => handleEditCard("daypass")}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {cardTitles.daypass}
            </span>
            <Edit className="h-4 w-4" />
          </Button>

          {/* Travel Guide Card Button */}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => handleEditCard("travelGuide")}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {cardTitles.travelGuide}
            </span>
            <Edit className="h-4 w-4" />
          </Button>

          {/* Monuments Card Button */}
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => handleEditCard("monuments")}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {cardTitles.monuments}
            </span>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Edit Dialog */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {cardTitles[editingCard]}</DialogTitle>
              <DialogDescription>
                Update the images and text content for this card
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Text Content Section */}
              <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                <h4 className="text-foreground">Text Content</h4>
                
                <div>
                  <Label>Title</Label>
                  <Input
                    value={getCardData(editingCard)?.title || ""}
                    onChange={(e) =>
                      updateContent(
                        ["homepage", "productCards", editingCard, "title"],
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={getCardData(editingCard)?.description || ""}
                    onChange={(e) =>
                      updateContent(
                        ["homepage", "productCards", editingCard, "description"],
                        e.target.value
                      )
                    }
                  />
                </div>

                {/* Day Pass has features array, others have content text */}
                {editingCard === "daypass" ? (
                  <div>
                    <Label>Features (bullet points)</Label>
                    <div className="space-y-2">
                      {getCardData(editingCard)?.features?.map((feature: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...getCardData(editingCard).features];
                              newFeatures[index] = e.target.value;
                              updateContent(
                                ["homepage", "productCards", editingCard, "features"],
                                newFeatures
                              );
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeArrayItem(
                                ["homepage", "productCards", editingCard, "features"],
                                index
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          addArrayItem(
                            ["homepage", "productCards", editingCard, "features"],
                            ""
                          )
                        }
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Feature
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Content Text</Label>
                    <Textarea
                      value={getCardData(editingCard)?.content || ""}
                      onChange={(e) =>
                        updateContent(
                          ["homepage", "productCards", editingCard, "content"],
                          e.target.value
                        )
                      }
                      rows={4}
                    />
                  </div>
                )}

                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={getCardData(editingCard)?.buttonText || ""}
                    onChange={(e) =>
                      updateContent(
                        ["homepage", "productCards", editingCard, "buttonText"],
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                <h4 className="text-foreground">Carousel Images</h4>
                <p className="text-sm text-muted-foreground">
                  Add or edit images for the carousel
                </p>
                
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Images are automatically shared across all languages. Upload once and they'll appear everywhere!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {getCardData(editingCard)?.images?.map((image: any, index: number) => (
                    <div
                      key={index}
                      className="space-y-2 rounded border border-border bg-background p-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label>Image {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeArrayItem(
                              ["homepage", "productCards", editingCard, "images"],
                              index
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <ImageSelector
                        label="Image"
                        description="Select an image from your uploaded images"
                        value={image.src}
                        onChange={(url) =>
                          updateArrayItem(
                            ["homepage", "productCards", editingCard, "images"],
                            index,
                            "src",
                            url
                          )
                        }
                      />
                      <div>
                        <Label className="text-xs">Alt Text</Label>
                        <Input
                          value={image.alt}
                          onChange={(e) =>
                            updateArrayItem(
                              ["homepage", "productCards", editingCard, "images"],
                              index,
                              "alt",
                              e.target.value
                            )
                          }
                          placeholder="Image description"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addArrayItem(
                        ["homepage", "productCards", editingCard, "images"],
                        { src: "", alt: "" }
                      )
                    }
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCloseDialog}>Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}