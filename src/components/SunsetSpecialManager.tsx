import { useState, useEffect } from "react";
import { Sunset, Save, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";

interface SunsetSpecialSettings {
  enabled: boolean;
  title: string;
  description: string;
  departureTime: string;
  duration: string;
  limitedSeats: number;
  availabilityHour: number;
  instructions: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
}

const DEFAULT_SETTINGS: SunsetSpecialSettings = {
  enabled: true,
  title: "Sunset Drive to Cabo da Roca",
  description: "Experience the breathtaking sunset at Europe's westernmost point with a professional guide.",
  departureTime: "6:00 PM",
  duration: "2 Hours",
  limitedSeats: 8,
  availabilityHour: 14,
  instructions: "Please arrive 10 minutes before departure time at the main pickup point. Bring warm clothing as it can be windy at the coast. This experience departs at 6:00 PM and includes transportation, a professional guide, and approximately 45 minutes at Cabo da Roca to enjoy the sunset.",
  images: [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
      alt: "Sunset at Cabo da Roca"
    },
    {
      url: "https://images.unsplash.com/photo-1495954484750-af469f2f9be5?w=1200&q=80",
      alt: "Westernmost point of Europe"
    },
    {
      url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
      alt: "Golden hour coastal views"
    },
    {
      url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80",
      alt: "Breathtaking Atlantic sunset"
    }
  ]
};

export function SunsetSpecialManager() {
  const [settings, setSettings] = useState<SunsetSpecialSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("sunset-special-settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse sunset special settings:", e);
      }
    }
  }, []);

  const saveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("sunset-special-settings", JSON.stringify(settings));
      toast.success("Sunset special settings saved!");
      
      // Trigger a storage event to update the carousel component
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Failed to save settings:", e);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const addImage = () => {
    setSettings({
      ...settings,
      images: [
        ...settings.images,
        { url: "", alt: "" }
      ]
    });
  };

  const removeImage = (index: number) => {
    const newImages = settings.images.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      images: newImages
    });
  };

  const updateImage = (index: number, field: "url" | "alt", value: string) => {
    const newImages = [...settings.images];
    newImages[index] = {
      ...newImages[index],
      [field]: value
    };
    setSettings({
      ...settings,
      images: newImages
    });
  };

  return (
    <Card className="border-border p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sunset className="h-6 w-6 text-orange-500" />
          <h2 className="text-foreground">Today's Special: Sunset Drive</h2>
        </div>
        <div className="h-1 w-16 rounded-full bg-accent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Manage the special sunset drive carousel that appears on the homepage
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="mt-2"
              placeholder="Sunset Drive to Cabo da Roca"
            />
          </div>

          <div>
            <Label htmlFor="departureTime">Departure Time</Label>
            <Input
              id="departureTime"
              value={settings.departureTime}
              onChange={(e) => setSettings({ ...settings, departureTime: e.target.value })}
              className="mt-2"
              placeholder="6:00 PM"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={settings.duration}
              onChange={(e) => setSettings({ ...settings, duration: e.target.value })}
              className="mt-2"
              placeholder="2 Hours"
            />
          </div>

          <div>
            <Label htmlFor="limitedSeats">Limited Seats</Label>
            <Input
              id="limitedSeats"
              type="number"
              min="1"
              value={settings.limitedSeats}
              onChange={(e) => setSettings({ ...settings, limitedSeats: parseInt(e.target.value) || 0 })}
              className="mt-2"
              placeholder="8"
            />
          </div>

          <div>
            <Label htmlFor="availabilityHour">
              Availability Hour (24-hour format)
              <span className="block text-xs text-muted-foreground mt-1">
                Tickets become available at this hour each day
              </span>
            </Label>
            <Input
              id="availabilityHour"
              type="number"
              min="0"
              max="23"
              value={settings.availabilityHour}
              onChange={(e) => setSettings({ ...settings, availabilityHour: parseInt(e.target.value) || 0 })}
              className="mt-2"
              placeholder="14"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {settings.availabilityHour}:00 ({settings.availabilityHour === 0 ? '12' : settings.availabilityHour > 12 ? settings.availabilityHour - 12 : settings.availabilityHour} {settings.availabilityHour >= 12 ? 'PM' : 'AM'})
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={settings.description}
            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            className="mt-2"
            rows={3}
            placeholder="Experience the breathtaking sunset..."
          />
        </div>

        {/* Instructions */}
        <div>
          <Label htmlFor="instructions">
            Customer Instructions
            <span className="block text-xs text-muted-foreground mt-1">
              Instructions shown to customers on the purchase page
            </span>
          </Label>
          <Textarea
            id="instructions"
            value={settings.instructions}
            onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
            className="mt-2"
            rows={4}
            placeholder="Please arrive 10 minutes before departure time..."
          />
        </div>

        {/* Carousel Images */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Carousel Images</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>

          <div className="space-y-4">
            {settings.images.map((image, index) => (
              <Card key={index} className="p-4 border-border">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`image-url-${index}`} className="text-sm">
                        Image URL
                      </Label>
                      <Input
                        id={`image-url-${index}`}
                        value={image.url}
                        onChange={(e) => updateImage(index, "url", e.target.value)}
                        className="mt-1"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor={`image-alt-${index}`} className="text-sm">
                        Alt Text
                      </Label>
                      <Input
                        id={`image-alt-${index}`}
                        value={image.alt}
                        onChange={(e) => updateImage(index, "alt", e.target.value)}
                        className="mt-1"
                        placeholder="Description of the image"
                      />
                    </div>
                    {image.url && (
                      <div className="rounded-lg overflow-hidden border border-border">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {settings.images.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No images added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Image" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            <strong>Preview:</strong> Changes will be reflected on the homepage carousel after saving. 
            The carousel will automatically rotate through the images every 4 seconds.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
