import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, FileText, Home, Info, MapPin, ShoppingCart, User, Phone, Settings, Trash2, Plus, ToggleLeft, ToggleRight, Languages, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { toast } from "sonner@2.0.3";
import {
  loadComprehensiveContent,
  saveComprehensiveContent,
  saveComprehensiveContentAsync,
  saveTranslatedContent,
  saveIncrementalTranslation,
  getTranslationStatus,
  DEFAULT_COMPREHENSIVE_CONTENT,
  type ComprehensiveContent,
} from "../lib/comprehensiveContent";
import {
  loadContent as loadMainContent,
  saveContentAsync as saveMainContentAsync,
  type WebsiteContent,
} from "../lib/contentManager";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { ImageSelector } from "./ImageSelector";
import { SUPPORTED_LANGUAGES } from "../lib/autoTranslate";
import { ProductCardEditor } from "./ProductCardEditor";

export function ContentEditor() {
  const [content, setContent] = useState<ComprehensiveContent>(DEFAULT_COMPREHENSIVE_CONTENT);
  const [mainContent, setMainContent] = useState<WebsiteContent>(loadMainContent());
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    language: string;
    progress: number;
  } | null>(null);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [translationStatus, setTranslationStatus] = useState(getTranslationStatus());

  useEffect(() => {
    const loadedContent = loadComprehensiveContent();
    setContent(loadedContent);
    setMainContent(loadMainContent());
    // Load autoTranslateEnabled from server settings
    setAutoTranslateEnabled(loadedContent.adminSettings?.autoTranslateEnabled ?? false);
  }, []);

  const handleSave = async () => {
    try {
      // Update content with current admin settings
      const updatedContent = {
        ...content,
        adminSettings: {
          autoTranslateEnabled,
        },
      };
      
      // Save main content first
      const mainResult = await saveMainContentAsync(mainContent);
      
      // Decide whether to auto-translate
      if (autoTranslateEnabled) {
        setIsTranslating(true);
        toast.info("Saving content and updating translations...");
        
        // Use incremental translation (only translate changed content)
        const result = await saveIncrementalTranslation(updatedContent, 'en', (language, progress) => {
          setTranslationProgress({ language, progress });
        });
        
        setIsTranslating(false);
        setTranslationProgress(null);
        
        if (result.success && mainResult.success) {
          setHasChanges(false);
          setTranslationStatus(getTranslationStatus());
          toast.success("Content saved and translations updated!");
          window.dispatchEvent(new Event('content-updated'));
        } else {
          const errors = [];
          if (!result.success) errors.push(result.error);
          if (!mainResult.success) errors.push(mainResult.error);
          toast.error(`Some errors occurred: ${errors.join(', ')}`);
        }
      } else {
        // Save without translation
        const result = await saveComprehensiveContentAsync(updatedContent);
        
        if (result.success && mainResult.success) {
          setHasChanges(false);
          toast.success("All content saved successfully!");
          window.dispatchEvent(new Event('content-updated'));
        } else {
          const errors = [];
          if (!result.success) errors.push(result.error);
          if (!mainResult.success) errors.push(mainResult.error);
          toast.error(`Failed to save: ${errors.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setIsTranslating(false);
      setTranslationProgress(null);
      toast.error("Failed to save content. Please try again.");
    }
  };

  const handleAutoTranslateToggle = async (checked: boolean) => {
    setAutoTranslateEnabled(checked);
    
    // Immediately save the setting to the server
    try {
      const updatedContent = {
        ...content,
        adminSettings: {
          autoTranslateEnabled: checked,
        },
      };
      
      await saveComprehensiveContentAsync(updatedContent);
      setContent(updatedContent);
      toast.success(checked ? "Auto-translate enabled" : "Auto-translate disabled");
    } catch (error) {
      console.error('Error saving auto-translate setting:', error);
      toast.error("Failed to save setting");
      // Revert the toggle if save failed
      setAutoTranslateEnabled(!checked);
    }
  };

  const handleTranslateNow = async () => {
    if (confirm("This will translate all current content to all supported languages. This may take a few minutes. Continue?")) {
      try {
        setIsTranslating(true);
        toast.info("Translating content to all languages...");
        
        const result = await saveTranslatedContent(content, 'en', (language, progress) => {
          setTranslationProgress({ language, progress });
        });
        
        setIsTranslating(false);
        setTranslationProgress(null);
        
        if (result.success) {
          setTranslationStatus(getTranslationStatus());
          toast.success("All content translated successfully!");
        } else {
          toast.error(`Translation failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Translation error:', error);
        setIsTranslating(false);
        setTranslationProgress(null);
        toast.error("Translation failed. Please try again.");
      }
    }
  };

  const toggleFeatureFlag = async (flag: keyof NonNullable<WebsiteContent['featureFlags']>) => {
    const newMainContent = {
      ...mainContent,
      featureFlags: {
        ...mainContent.featureFlags,
        [flag]: !mainContent.featureFlags?.[flag],
      },
    };
    setMainContent(newMainContent);
    
    try {
      const result = await saveMainContentAsync(newMainContent);
      if (result.success) {
        toast.success(`Feature ${flag === 'enableAttractionTickets' ? 'Attraction Tickets' : flag} ${newMainContent.featureFlags?.[flag] ? 'enabled' : 'disabled'}!`);
      } else {
        toast.error(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving feature flag:', error);
      toast.error("Failed to save feature flag.");
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all content to defaults? This cannot be undone.")) {
      setContent(DEFAULT_COMPREHENSIVE_CONTENT);
      
      try {
        const result = await saveComprehensiveContentAsync(DEFAULT_COMPREHENSIVE_CONTENT);
        
        if (result.success) {
          setHasChanges(false);
          toast.success("Content reset to defaults and saved to database!");
        } else {
          toast.error(`Content reset locally but database save failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Error resetting content:', error);
        toast.error("Content reset locally but database save failed.");
      }
    }
  };

  const updateContent = (path: string[], value: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current: any = newContent;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      setHasChanges(true);
      return newContent;
    });
    
    // Also update mainContent for fields that exist in both
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      let exists = true;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
          exists = false;
          break;
        }
        current = current[path[i]];
      }
      
      if (exists && current[path[path.length - 1]] !== undefined) {
        current[path[path.length - 1]] = value;
      }
      
      return newMainContent;
    });
  };

  const updateArrayItem = (path: string[], index: number, field: string, value: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      let current: any = newContent;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      
      current[index][field] = value;
      setHasChanges(true);
      return newContent;
    });
    
    // Also update mainContent for fields that exist in both
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      let exists = true;
      
      for (let i = 0; i < path.length; i++) {
        if (current[path[i]] === undefined) {
          exists = false;
          break;
        }
        current = current[path[i]];
      }
      
      if (exists && current[index] !== undefined) {
        current[index][field] = value;
      }
      
      return newMainContent;
    });
  };

  const addArrayItem = (path: string[], template: any) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      let current: any = newContent;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      
      current.push(template);
      setHasChanges(true);
      return newContent;
    });
    
    // Also update mainContent for fields that exist in both
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      let exists = true;
      
      for (let i = 0; i < path.length; i++) {
        if (current[path[i]] === undefined) {
          exists = false;
          break;
        }
        current = current[path[i]];
      }
      
      if (exists && Array.isArray(current)) {
        current.push(template);
      }
      
      return newMainContent;
    });
  };

  const removeArrayItem = (path: string[], index: number) => {
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      let current: any = newContent;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      
      current.splice(index, 1);
      setHasChanges(true);
      return newContent;
    });
    
    // Also update mainContent for fields that exist in both
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      let exists = true;
      
      for (let i = 0; i < path.length; i++) {
        if (current[path[i]] === undefined) {
          exists = false;
          break;
        }
        current = current[path[i]];
      }
      
      if (exists && Array.isArray(current)) {
        current.splice(index, 1);
      }
      
      return newMainContent;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Content Editor</h2>
          <p className="text-muted-foreground">
            Edit every word on your website in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2 hidden">
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSave} 
            className="gap-2" 
            disabled={!hasChanges || isTranslating}
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save {autoTranslateEnabled && "& Translate"}
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes. Don't forget to save before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Translation Progress */}
      {isTranslating && translationProgress && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Translating to {translationProgress.language}... {Math.round(translationProgress.progress)}%
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div>
        <Input
          placeholder="Search for content to edit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Auto-Translation Settings */}
      <Card className="border-border p-6">
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-2 text-foreground">
            <Languages className="h-5 w-5 text-primary" />
            Automatic Translation
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatically translate content to all 7 supported languages when you save
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Auto-translate toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex-1">
              <Label htmlFor="auto-translate" className="cursor-pointer text-base text-foreground">
                Auto-Translate on Save
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Automatically translate content when clicking "Save & Translate"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={autoTranslateEnabled ? "default" : "outline"}>
                {autoTranslateEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                id="auto-translate"
                checked={autoTranslateEnabled}
                onCheckedChange={handleAutoTranslateToggle}
              />
            </div>
          </div>

          {/* Translation Status */}
          <div className="rounded-lg border border-border bg-secondary/10 p-4">
            <h4 className="mb-3 text-sm font-medium text-foreground">Translation Status</h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {SUPPORTED_LANGUAGES.map(lang => {
                const exists = translationStatus.exists[lang];
                const languageNames: { [key: string]: string } = {
                  en: 'English',
                  pt: 'Portuguese',
                  es: 'Spanish',
                  fr: 'French',
                  de: 'German',
                  nl: 'Dutch',
                  it: 'Italian',
                };
                
                return (
                  <div
                    key={lang}
                    className="flex items-center gap-2 rounded border border-border bg-background p-2"
                  >
                    {exists ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className="text-sm">
                      {languageNames[lang]}
                    </span>
                  </div>
                );
              })}
            </div>
            {translationStatus.lastTranslated && (
              <p className="mt-3 text-xs text-muted-foreground">
                Last translated: {new Date(translationStatus.lastTranslated).toLocaleString()}
              </p>
            )}
          </div>

          {/* Manual translation button */}
          <Button
            variant="outline"
            onClick={handleTranslateNow}
            className="w-full gap-2"
            disabled={isTranslating}
          >
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate All Content Now
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Feature Flags */}
      <Card className="border-border p-6">
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5 text-primary" />
            Feature Flags
          </h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable features on the website
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex-1">
              <Label htmlFor="attraction-tickets" className="cursor-pointer text-base text-foreground">
                Attraction Ticket Sales
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Allow customers to purchase attraction tickets during day pass booking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={mainContent.featureFlags?.enableAttractionTickets ? "default" : "outline"}>
                {mainContent.featureFlags?.enableAttractionTickets ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                id="attraction-tickets"
                checked={mainContent.featureFlags?.enableAttractionTickets || false}
                onCheckedChange={() => toggleFeatureFlag('enableAttractionTickets')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
          <TabsTrigger value="company">
            <Settings className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="homepage">
            <Home className="mr-2 h-4 w-4" />
            Home
          </TabsTrigger>
          <TabsTrigger value="howItWorks">
            <Info className="mr-2 h-4 w-4" />
            How It Works
          </TabsTrigger>
          <TabsTrigger value="attractions">
            <MapPin className="mr-2 h-4 w-4" />
            Attractions
          </TabsTrigger>
          <TabsTrigger value="buyTicket">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy Ticket
          </TabsTrigger>
          <TabsTrigger value="other">
            <User className="mr-2 h-4 w-4" />
            Other Pages
          </TabsTrigger>
          <TabsTrigger value="common">
            <FileText className="mr-2 h-4 w-4" />
            Common
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Company Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={content.company.name}
                  onChange={(e) => updateContent(["company", "name"], e.target.value)}
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  value={content.company.email}
                  onChange={(e) => updateContent(["company", "email"], e.target.value)}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={content.company.phone}
                  onChange={(e) => updateContent(["company", "phone"], e.target.value)}
                />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input
                  value={content.company.whatsappNumber}
                  onChange={(e) => updateContent(["company", "whatsappNumber"], e.target.value)}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={content.company.location}
                  onChange={(e) => updateContent(["company", "location"], e.target.value)}
                />
              </div>
              <div>
                <Label>Operating Hours</Label>
                <Input
                  value={content.company.operatingHours}
                  onChange={(e) => updateContent(["company", "operatingHours"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Navigation Labels</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Home</Label>
                <Input
                  value={content.navigation.home}
                  onChange={(e) => updateContent(["navigation", "home"], e.target.value)}
                />
              </div>
              <div>
                <Label>How It Works</Label>
                <Input
                  value={content.navigation.howItWorks}
                  onChange={(e) => updateContent(["navigation", "howItWorks"], e.target.value)}
                />
              </div>
              <div>
                <Label>Attractions</Label>
                <Input
                  value={content.navigation.attractions}
                  onChange={(e) => updateContent(["navigation", "attractions"], e.target.value)}
                />
              </div>
              <div>
                <Label>Buy Ticket</Label>
                <Input
                  value={content.navigation.buyTicket}
                  onChange={(e) => updateContent(["navigation", "buyTicket"], e.target.value)}
                />
              </div>
              <div>
                <Label>About</Label>
                <Input
                  value={content.navigation.about}
                  onChange={(e) => updateContent(["navigation", "about"], e.target.value)}
                />
              </div>
              <div>
                <Label>Manage Booking</Label>
                <Input
                  value={content.navigation.manageBooking}
                  onChange={(e) => updateContent(["navigation", "manageBooking"], e.target.value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Homepage Tab */}
        <TabsContent value="homepage" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.homepage.hero.title}
                  onChange={(e) => updateContent(["homepage", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Textarea
                  value={content.homepage.hero.subtitle}
                  onChange={(e) => updateContent(["homepage", "hero", "subtitle"], e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Call to Action Button</Label>
                <Input
                  value={content.homepage.hero.ctaButton}
                  onChange={(e) => updateContent(["homepage", "hero", "ctaButton"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hero Images</h3>
            <div className="space-y-4">
              <div>
                <Label>Main Hero Background Image</Label>
                <p className="mb-2 text-sm text-muted-foreground">
                  Large hero image shown at the top (e.g., tuk tuk with palace)
                </p>
                <Input
                  value={content.homepage.hero.heroImage || ""}
                  onChange={(e) => updateContent(["homepage", "hero", "heroImage"], e.target.value)}
                  placeholder="Enter Unsplash image URL"
                />
                {content.homepage.hero.heroImage && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-border">
                    <img 
                      src={content.homepage.hero.heroImage} 
                      alt="Hero preview" 
                      className="h-32 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Benefit Pills</h3>
            <div className="space-y-4">
              {mainContent.homepage.hero.benefitPills.map((pill, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label>Icon Name (Lucide)</Label>
                    <Input
                      value={pill.icon}
                      onChange={(e) => 
                        updateArrayItem(["homepage", "hero", "benefitPills"], index, "icon", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Text</Label>
                    <Input
                      value={pill.text}
                      onChange={(e) => 
                        updateArrayItem(["homepage", "hero", "benefitPills"], index, "text", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeArrayItem(["homepage", "hero", "benefitPills"], index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => 
                  addArrayItem(["homepage", "hero", "benefitPills"], { icon: "Star", text: "New Benefit" })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Benefit Pill
              </Button>
            </div>
          </Card>

          <ProductCardEditor
            content={content}
            updateContent={updateContent}
            updateArrayItem={updateArrayItem}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Final CTA Section</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              This is the bottom call-to-action section with the booking button
            </p>
            <div className="space-y-4">
              <div>
                <Label>CTA Title</Label>
                <Input
                  value={mainContent.homepage.finalCtaTitle}
                  onChange={(e) => 
                    updateContent(["homepage", "finalCtaTitle"], e.target.value)
                  }
                />
              </div>
              <div>
                <Label>CTA Subtitle</Label>
                <Textarea
                  value={mainContent.homepage.finalCtaSubtitle}
                  onChange={(e) => 
                    updateContent(["homepage", "finalCtaSubtitle"], e.target.value)
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>CTA Button Text</Label>
                <Input
                  value={mainContent.homepage.finalCtaButton}
                  onChange={(e) => 
                    updateContent(["homepage", "finalCtaButton"], e.target.value)
                  }
                  placeholder="e.g., Get Your Day Pass"
                />
              </div>
              <div>
                <Label>CTA Subtext (below button)</Label>
                <Input
                  value={mainContent.homepage.finalCtaSubtext}
                  onChange={(e) => 
                    updateContent(["homepage", "finalCtaSubtext"], e.target.value)
                  }
                  placeholder="e.g., No booking fees"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="howItWorks" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.howItWorks.hero.title}
                  onChange={(e) => updateContent(["howItWorks", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea
                  value={content.howItWorks.hero.subtitle}
                  onChange={(e) => updateContent(["howItWorks", "hero", "subtitle"], e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Steps</h3>
            <Accordion type="single" collapsible className="w-full">
              {content.howItWorks.steps.map((step, index) => (
                <AccordionItem key={index} value={`step-${index}`}>
                  <AccordionTrigger>
                    Step {step.number}: {step.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Icon Name</Label>
                        <Input
                          value={step.icon}
                          onChange={(e) => 
                            updateArrayItem(["howItWorks", "steps"], index, "icon", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => 
                            updateArrayItem(["howItWorks", "steps"], index, "title", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={step.description}
                          onChange={(e) => 
                            updateArrayItem(["howItWorks", "steps"], index, "description", e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">What Makes Us Special</h3>
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={content.howItWorks.whatMakesUsSpecial.title}
                  onChange={(e) => updateContent(["howItWorks", "whatMakesUsSpecial", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={content.howItWorks.whatMakesUsSpecial.subtitle}
                  onChange={(e) => updateContent(["howItWorks", "whatMakesUsSpecial", "subtitle"], e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="mb-4">Features</h4>
              <Accordion type="single" collapsible className="w-full">
                {content.howItWorks.whatMakesUsSpecial.features.map((feature, index) => (
                  <AccordionItem key={index} value={`special-${index}`}>
                    <AccordionTrigger>
                      {feature.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Icon Name</Label>
                          <Input
                            value={feature.icon}
                            onChange={(e) => 
                              updateArrayItem(["howItWorks", "whatMakesUsSpecial", "features"], index, "icon", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => 
                              updateArrayItem(["howItWorks", "whatMakesUsSpecial", "features"], index, "title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={feature.description}
                            onChange={(e) => 
                              updateArrayItem(["howItWorks", "whatMakesUsSpecial", "features"], index, "description", e.target.value)
                            }
                            rows={3}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeArrayItem(["howItWorks", "whatMakesUsSpecial", "features"], index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Feature
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => 
                  addArrayItem(["howItWorks", "whatMakesUsSpecial", "features"], {
                    title: "New Feature",
                    description: "Description here",
                    icon: "Star"
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">FAQ Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={content.howItWorks.frequentlyAskedQuestions.title}
                  onChange={(e) => updateContent(["howItWorks", "frequentlyAskedQuestions", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={content.howItWorks.frequentlyAskedQuestions.subtitle}
                  onChange={(e) => updateContent(["howItWorks", "frequentlyAskedQuestions", "subtitle"], e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="mb-4">Questions</h4>
              <Accordion type="single" collapsible className="w-full">
                {content.howItWorks.frequentlyAskedQuestions.questions.map((qa, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>
                      {qa.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Question</Label>
                          <Input
                            value={qa.question}
                            onChange={(e) => 
                              updateArrayItem(["howItWorks", "frequentlyAskedQuestions", "questions"], index, "question", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Answer</Label>
                          <Textarea
                            value={qa.answer}
                            onChange={(e) => 
                              updateArrayItem(["howItWorks", "frequentlyAskedQuestions", "questions"], index, "answer", e.target.value)
                            }
                            rows={4}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeArrayItem(["howItWorks", "frequentlyAskedQuestions", "questions"], index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Question
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => 
                  addArrayItem(["howItWorks", "frequentlyAskedQuestions", "questions"], {
                    question: "New question?",
                    answer: "Answer here"
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Attractions Tab */}
        <TabsContent value="attractions" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.attractions.hero.title}
                  onChange={(e) => updateContent(["attractions", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={content.attractions.hero.subtitle}
                  onChange={(e) => updateContent(["attractions", "hero", "subtitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={content.attractions.hero.description}
                  onChange={(e) => updateContent(["attractions", "hero", "description"], e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Listing Intro</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.attractions.listingIntro.title}
                  onChange={(e) => updateContent(["attractions", "listingIntro", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={content.attractions.listingIntro.description}
                  onChange={(e) => updateContent(["attractions", "listingIntro", "description"], e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Attraction Detail Page Labels</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Back Button</Label>
                <Input
                  value={content.attractions.attractionDetailPage.backButton}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "backButton"], e.target.value)}
                />
              </div>
              <div>
                <Label>Opening Hours Label</Label>
                <Input
                  value={content.attractions.attractionDetailPage.openingHours}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "openingHours"], e.target.value)}
                />
              </div>
              <div>
                <Label>Duration Label</Label>
                <Input
                  value={content.attractions.attractionDetailPage.duration}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "duration"], e.target.value)}
                />
              </div>
              <div>
                <Label>Ticket Price Label</Label>
                <Input
                  value={content.attractions.attractionDetailPage.ticketPrice}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "ticketPrice"], e.target.value)}
                />
              </div>
              <div>
                <Label>Highlights Title</Label>
                <Input
                  value={content.attractions.attractionDetailPage.highlightsTitle}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "highlightsTitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Tips Title</Label>
                <Input
                  value={content.attractions.attractionDetailPage.tipsTitle}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "tipsTitle"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Individual Attractions</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Edit detailed information for each attraction. Click to expand and edit.
            </p>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(content.attractions.attractionDetails).map(([key, attraction]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger>
                    {attraction.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={attraction.name}
                          onChange={(e) => 
                            updateContent(["attractions", "attractionDetails", key, "name"], e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Short Description</Label>
                        <Textarea
                          value={attraction.shortDescription}
                          onChange={(e) => 
                            updateContent(["attractions", "attractionDetails", key, "shortDescription"], e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Long Description</Label>
                        <Textarea
                          value={attraction.longDescription}
                          onChange={(e) => 
                            updateContent(["attractions", "attractionDetails", key, "longDescription"], e.target.value)
                          }
                          rows={5}
                        />
                      </div>
                      <div>
                        <Label>Hours</Label>
                        <Input
                          value={attraction.hours}
                          onChange={(e) => 
                            updateContent(["attractions", "attractionDetails", key, "hours"], e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Recommended Duration</Label>
                        <Input
                          value={attraction.duration}
                          onChange={(e) => 
                            updateContent(["attractions", "attractionDetails", key, "duration"], e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Ticket Price (€)</Label>
                        <Input
                          type="number"
                          value={attraction.price}
                          onChange={(e) => 
                            updateContent(["attractions", "attractionDetails", key, "price"], parseFloat(e.target.value))
                          }
                        />
                      </div>
                      {attraction.parkOnlyPrice !== undefined && (
                        <div>
                          <Label>Park Only Price (€)</Label>
                          <Input
                            type="number"
                            value={attraction.parkOnlyPrice}
                            onChange={(e) => 
                              updateContent(["attractions", "attractionDetails", key, "parkOnlyPrice"], parseFloat(e.target.value))
                            }
                          />
                        </div>
                      )}
                      <div className="border-t pt-4">
                        <h4 className="mb-4 font-medium">Highlights</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Enter one highlight per line
                        </p>
                        <Textarea
                          value={attraction.highlights.join("\n")}
                          onChange={(e) => {
                            const highlights = e.target.value.split("\n").filter((h: string) => h.trim());
                            updateContent(["attractions", "attractionDetails", key, "highlights"], highlights);
                          }}
                          rows={5}
                          placeholder="Panoramic views&#10;Historic architecture&#10;Beautiful gardens"
                        />
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="mb-4 font-medium">Visitor Tips (Pro Tips)</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Enter one tip per line
                        </p>
                        <Textarea
                          value={attraction.tips.join("\n")}
                          onChange={(e) => {
                            const tips = e.target.value.split("\n").filter((t: string) => t.trim());
                            updateContent(["attractions", "attractionDetails", key, "tips"], tips);
                          }}
                          rows={5}
                          placeholder="Arrive early to avoid crowds&#10;Wear comfortable shoes&#10;Bring water"
                        />
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="mb-4 font-medium">Images</h4>
                        <div className="space-y-4">
                          <ImageSelector
                            label="Hero Image"
                            description="Large image shown at the top of the attraction detail page"
                            value={attraction.heroImage || ""}
                            onChange={(url) => 
                              updateContent(["attractions", "attractionDetails", key, "heroImage"], url)
                            }
                          />
                          <ImageSelector
                            label="Card Image"
                            description="Image shown on attraction cards in listings"
                            value={attraction.cardImage || ""}
                            onChange={(url) => 
                              updateContent(["attractions", "attractionDetails", key, "cardImage"], url)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </TabsContent>

        {/* Buy Ticket Tab */}
        <TabsContent value="buyTicket" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.buyTicket.hero.title}
                  onChange={(e) => updateContent(["buyTicket", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea
                  value={content.buyTicket.hero.subtitle}
                  onChange={(e) => updateContent(["buyTicket", "hero", "subtitle"], e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Step Labels</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Step 1</Label>
                <Input
                  value={content.buyTicket.steps.step1}
                  onChange={(e) => updateContent(["buyTicket", "steps", "step1"], e.target.value)}
                />
              </div>
              <div>
                <Label>Step 2</Label>
                <Input
                  value={content.buyTicket.steps.step2}
                  onChange={(e) => updateContent(["buyTicket", "steps", "step2"], e.target.value)}
                />
              </div>
              <div>
                <Label>Step 3</Label>
                <Input
                  value={content.buyTicket.steps.step3}
                  onChange={(e) => updateContent(["buyTicket", "steps", "step3"], e.target.value)}
                />
              </div>
              <div>
                <Label>Step 4</Label>
                <Input
                  value={content.buyTicket.steps.step4}
                  onChange={(e) => updateContent(["buyTicket", "steps", "step4"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Date Selection Form</h3>
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={content.buyTicket.dateSelection.title}
                  onChange={(e) => updateContent(["buyTicket", "dateSelection", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>"Select Date" Label</Label>
                <Input
                  value={content.buyTicket.dateSelection.selectDate}
                  onChange={(e) => updateContent(["buyTicket", "dateSelection", "selectDate"], e.target.value)}
                />
              </div>
              <div>
                <Label>"Select Time" Label</Label>
                <Input
                  value={content.buyTicket.dateSelection.selectTime}
                  onChange={(e) => updateContent(["buyTicket", "dateSelection", "selectTime"], e.target.value)}
                />
              </div>
              <div>
                <Label>Continue Button</Label>
                <Input
                  value={content.buyTicket.dateSelection.continueButton}
                  onChange={(e) => updateContent(["buyTicket", "dateSelection", "continueButton"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Passenger Selection Form</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Full Name Label</Label>
                <Input
                  value={content.buyTicket.passengersSelection.fullName}
                  onChange={(e) => updateContent(["buyTicket", "passengersSelection", "fullName"], e.target.value)}
                />
              </div>
              <div>
                <Label>Full Name Placeholder</Label>
                <Input
                  value={content.buyTicket.passengersSelection.fullNamePlaceholder}
                  onChange={(e) => updateContent(["buyTicket", "passengersSelection", "fullNamePlaceholder"], e.target.value)}
                />
              </div>
              <div>
                <Label>Email Label</Label>
                <Input
                  value={content.buyTicket.passengersSelection.email}
                  onChange={(e) => updateContent(["buyTicket", "passengersSelection", "email"], e.target.value)}
                />
              </div>
              <div>
                <Label>Email Placeholder</Label>
                <Input
                  value={content.buyTicket.passengersSelection.emailPlaceholder}
                  onChange={(e) => updateContent(["buyTicket", "passengersSelection", "emailPlaceholder"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Payment Form</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Order Summary</Label>
                <Input
                  value={content.buyTicket.payment.orderSummary}
                  onChange={(e) => updateContent(["buyTicket", "payment", "orderSummary"], e.target.value)}
                />
              </div>
              <div>
                <Label>Day Pass Label</Label>
                <Input
                  value={content.buyTicket.payment.dayPass}
                  onChange={(e) => updateContent(["buyTicket", "payment", "dayPass"], e.target.value)}
                />
              </div>
              <div>
                <Label>Total Label</Label>
                <Input
                  value={content.buyTicket.payment.total}
                  onChange={(e) => updateContent(["buyTicket", "payment", "total"], e.target.value)}
                />
              </div>
              <div>
                <Label>Pay Now Button</Label>
                <Input
                  value={content.buyTicket.payment.payNowButton}
                  onChange={(e) => updateContent(["buyTicket", "payment", "payNowButton"], e.target.value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Other Pages Tab */}
        <TabsContent value="other" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">About Page</h3>
            <div className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.about.hero.title}
                  onChange={(e) => updateContent(["about", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Input
                  value={content.about.hero.subtitle}
                  onChange={(e) => updateContent(["about", "hero", "subtitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Mission Title</Label>
                <Input
                  value={content.about.mission.title}
                  onChange={(e) => updateContent(["about", "mission", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Mission Description</Label>
                <Textarea
                  value={content.about.mission.description}
                  onChange={(e) => updateContent(["about", "mission", "description"], e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Manage Booking Page</h3>
            <div className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.manageBooking.hero.title}
                  onChange={(e) => updateContent(["manageBooking", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Input
                  value={content.manageBooking.hero.subtitle}
                  onChange={(e) => updateContent(["manageBooking", "hero", "subtitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Login Button Text</Label>
                <Input
                  value={content.manageBooking.loginSection.loginButton}
                  onChange={(e) => updateContent(["manageBooking", "loginSection", "loginButton"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Request Pickup Page</h3>
            <div className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.requestPickup.hero.title}
                  onChange={(e) => updateContent(["requestPickup", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Input
                  value={content.requestPickup.hero.subtitle}
                  onChange={(e) => updateContent(["requestPickup", "hero", "subtitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Request Button</Label>
                <Input
                  value={content.requestPickup.form.requestButton}
                  onChange={(e) => updateContent(["requestPickup", "form", "requestButton"], e.target.value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Common Tab */}
        <TabsContent value="common" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Common Buttons</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(content.common.buttons).map(([key, value]) => (
                <div key={key}>
                  <Label>{key}</Label>
                  <Input
                    value={value}
                    onChange={(e) => updateContent(["common", "buttons", key], e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Common Labels</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(content.common.labels).map(([key, value]) => (
                <div key={key}>
                  <Label>{key}</Label>
                  <Input
                    value={value}
                    onChange={(e) => updateContent(["common", "labels", key], e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Footer</h3>
            <div className="space-y-6">
              <div>
                <h4 className="mb-3">Quick Links Section</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Section Title</Label>
                    <Input
                      value={content.footer.quickLinks.title}
                      onChange={(e) => updateContent(["footer", "quickLinks", "title"], e.target.value)}
                    />
                  </div>
                  {Object.entries(content.footer.quickLinks).filter(([key]) => key !== 'title').map(([key, value]) => (
                    <div key={key}>
                      <Label>{key}</Label>
                      <Input
                        value={value}
                        onChange={(e) => updateContent(["footer", "quickLinks", key], e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-3">Contact Info Section</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(content.footer.contactInfo).map(([key, value]) => (
                    <div key={key}>
                      <Label>{key}</Label>
                      <Input
                        value={value}
                        onChange={(e) => updateContent(["footer", "contactInfo", key], e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Copyright Text</Label>
                <Input
                  value={content.footer.copyright}
                  onChange={(e) => updateContent(["footer", "copyright"], e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">SEO Meta Tags</h3>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(content.seo).map(([page, seoData]) => (
                <AccordionItem key={page} value={page}>
                  <AccordionTrigger>
                    {page.charAt(0).toUpperCase() + page.slice(1)} Page
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>SEO Title</Label>
                        <Input
                          value={seoData.title}
                          onChange={(e) => updateContent(["seo", page, "title"], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>SEO Description</Label>
                        <Textarea
                          value={seoData.description}
                          onChange={(e) => updateContent(["seo", page, "description"], e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>SEO Keywords</Label>
                        <Input
                          value={seoData.keywords}
                          onChange={(e) => updateContent(["seo", page, "keywords"], e.target.value)}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
