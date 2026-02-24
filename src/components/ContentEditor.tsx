import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, FileText, Home, Info, MapPin, ShoppingCart, User, Phone, Settings, Trash2, Plus, ToggleLeft, ToggleRight, Languages, Check, Loader2, Globe } from "lucide-react";
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
  loadComprehensiveContentForLanguage,
  saveComprehensiveContent,
  saveComprehensiveContentForLanguage,
  saveComprehensiveContentAsync,
  saveTranslatedContent,
  saveIncrementalTranslation,
  getTranslationStatus,
  initializeAllTranslationsFromEnglish,
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
import { MultiImageSelector } from "./MultiImageSelector";
import { ProductCardEditor } from "./ProductCardEditor";

// Supported languages with display names and flags
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
];

export function ContentEditor() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [content, setContent] = useState<ComprehensiveContent>(DEFAULT_COMPREHENSIVE_CONTENT);
  const [contentByLanguage, setContentByLanguage] = useState<Record<string, ComprehensiveContent>>({});
  const [modifiedLanguages, setModifiedLanguages] = useState<Set<string>>(new Set());
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

  // Load all languages on initial mount
  useEffect(() => {
    const allContent: Record<string, ComprehensiveContent> = {};
    SUPPORTED_LANGUAGES.forEach(lang => {
      allContent[lang.code] = loadComprehensiveContentForLanguage(lang.code);
    });
    setContentByLanguage(allContent);
    setContent(allContent['en'] || DEFAULT_COMPREHENSIVE_CONTENT);
    setMainContent(loadMainContent());
    
    // Load autoTranslateEnabled from server settings
    setAutoTranslateEnabled(allContent['en'].adminSettings?.autoTranslateEnabled ?? false);
  }, []);

  // When switching languages, update the current content from the cache
  useEffect(() => {
    if (contentByLanguage[currentLanguage]) {
      setContent(contentByLanguage[currentLanguage]);
    }
  }, [currentLanguage, contentByLanguage]);

  const handleSave = async () => {
    try {
      // Save all modified languages
      const languagesToSave = Array.from(modifiedLanguages);
      
      if (languagesToSave.length === 0) {
        toast.info("No changes to save");
        return;
      }

      // Save main content first
      const mainResult = await saveMainContentAsync(mainContent);
      
      // Save each modified language
      for (const langCode of languagesToSave) {
        if (langCode === 'en') {
          // English content - handle auto-translate and database save
          const updatedContent = {
            ...contentByLanguage[langCode],
            adminSettings: {
              autoTranslateEnabled,
            },
          };
          
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
            
            if (!result.success) {
              toast.error(`Translation failed: ${result.error}`);
            }
          } else {
            // Save without translation
            const result = await saveComprehensiveContentAsync(updatedContent);
            
            if (!result.success) {
              toast.error(`Failed to save English: ${result.error}`);
            }
          }
        } else {
          // Save non-English language directly
          saveComprehensiveContentForLanguage(contentByLanguage[langCode], langCode);
        }
      }
      
      // Clear modified languages and mark as saved
      setModifiedLanguages(new Set());
      setHasChanges(false);
      setTranslationStatus(getTranslationStatus());
      
      if (mainResult.success) {
        toast.success(`Saved changes for ${languagesToSave.length} language(s)!`);
        window.dispatchEvent(new Event('content-updated'));
      } else {
        toast.error(`Some errors occurred: ${mainResult.error}`);
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
        ...contentByLanguage['en'],
        adminSettings: {
          autoTranslateEnabled: checked,
        },
      };
      
      await saveComprehensiveContentAsync(updatedContent);
      
      // Update both content and contentByLanguage cache
      setContent(updatedContent);
      setContentByLanguage(prev => ({
        ...prev,
        'en': updatedContent,
      }));
      
      toast.success(checked ? "Auto-translate enabled" : "Auto-translate disabled");
    } catch (error) {
      console.error('Error saving auto-translate setting:', error);
      toast.error("Failed to save setting");
      // Revert the toggle if save failed
      setAutoTranslateEnabled(!checked);
    }
  };

  const handleInitializeTranslations = () => {
    if (confirm("This will copy the current English content to all language slots without translation. This is useful for manual translation. Continue?")) {
      try {
        initializeAllTranslationsFromEnglish();
        setTranslationStatus(getTranslationStatus());
        toast.success("All language slots initialized with English content!");
      } catch (error) {
        console.error('Error initializing translations:', error);
        toast.error("Failed to initialize translations");
      }
    }
  };

  const handleTranslateNow = async () => {
    if (confirm("This will translate all current content to all supported languages. This may take a few minutes. Continue?")) {
      try {
        setIsTranslating(true);
        toast.info("Translating content to all languages...");
        
        const result = await saveTranslatedContent(contentByLanguage['en'], 'en', (language, progress) => {
          setTranslationProgress({ language, progress });
        });
        
        setIsTranslating(false);
        setTranslationProgress(null);
        
        if (result.success) {
          // Reload all translations after translating
          const allContent: Record<string, ComprehensiveContent> = {};
          SUPPORTED_LANGUAGES.forEach(lang => {
            allContent[lang.code] = loadComprehensiveContentForLanguage(lang.code);
          });
          setContentByLanguage(allContent);
          setContent(allContent[currentLanguage]);
          
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
      
      // Update contentByLanguage cache
      setContentByLanguage(prev => ({
        ...prev,
        [currentLanguage]: DEFAULT_COMPREHENSIVE_CONTENT,
      }));
      
      try {
        const result = await saveComprehensiveContentAsync(DEFAULT_COMPREHENSIVE_CONTENT);
        
        if (result.success) {
          setHasChanges(false);
          setModifiedLanguages(new Set());
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
    // Check if this is an image field (heroImage, cardImage, gallery, etc.)
    const lastPathElement = path[path.length - 1];
    const isImageField = 
      lastPathElement.toLowerCase().includes('image') || 
      lastPathElement === 'gallery';
    
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current: any = newContent;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      
      // Update the contentByLanguage cache
      setContentByLanguage(prevByLang => {
        // If this is an image field, sync it to ALL languages
        if (isImageField) {
          const updatedAllLanguages: Record<string, ComprehensiveContent> = {};
          
          SUPPORTED_LANGUAGES.forEach(lang => {
            const langContent = JSON.parse(JSON.stringify(prevByLang[lang.code] || prev));
            let current: any = langContent;
            
            for (let i = 0; i < path.length - 1; i++) {
              current = current[path[i]];
            }
            
            current[path[path.length - 1]] = value;
            updatedAllLanguages[lang.code] = langContent;
          });
          
          // Mark all languages as modified when an image is updated
          setModifiedLanguages(prev => {
            const newSet = new Set(prev);
            SUPPORTED_LANGUAGES.forEach(lang => newSet.add(lang.code));
            return newSet;
          });
          
          // Show a toast notification that image was synced to all languages
          if (value) {
            toast.success(`Image synced to all ${SUPPORTED_LANGUAGES.length} languages!`, {
              description: "This image will appear in all language versions"
            });
          }
          
          return updatedAllLanguages;
        } else {
          // For non-image fields, only update current language
          return {
            ...prevByLang,
            [currentLanguage]: newContent,
          };
        }
      });
      
      // Mark this language as modified (or all if image)
      if (!isImageField) {
        setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
      }
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

  // Helper to update ONLY mainContent (WebsiteContent) fields - for Blog, About, ManageBooking, etc.
  const updateMainContentField = (path: string[], value: any) => {
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newMainContent;
    });
    
    setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
    setHasChanges(true);
  };

  const updateMainContentArrayItem = (path: string[], index: number, field: string, value: any) => {
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      
      for (let i = 0; i < path.length; i++) {
        if (current[path[i]] === undefined) {
          console.warn(`Path not found in mainContent:`, path.slice(0, i + 1));
          return prev;
        }
        current = current[path[i]];
      }
      
      if (!Array.isArray(current) || !current[index]) {
        console.warn(`Array or index ${index} not found in mainContent at path:`, path);
        return prev;
      }
      
      current[index][field] = value;
      return newMainContent;
    });
    
    setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
    setHasChanges(true);
  };

  const addMainContentArrayItem = (path: string[], template: any) => {
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      
      for (let i = 0; i < path.length; i++) {
        if (current[path[i]] === undefined) {
          current[path[i]] = [];
        }
        current = current[path[i]];
      }
      
      if (Array.isArray(current)) {
        current.push(template);
      }
      return newMainContent;
    });
    
    setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
    setHasChanges(true);
  };

  const removeMainContentArrayItem = (path: string[], index: number) => {
    setMainContent(prev => {
      const newMainContent = JSON.parse(JSON.stringify(prev));
      let current: any = newMainContent;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      
      if (Array.isArray(current)) {
        current.splice(index, 1);
      }
      return newMainContent;
    });
    
    setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
    setHasChanges(true);
  };

  const updateArrayItem = (path: string[], index: number, field: string, value: any) => {
    // Check if this is an image field
    const isImageField = 
      field.toLowerCase().includes('image') || 
      field === 'src'; // 'src' is used in product card images
    
    setContent(prev => {
      const newContent = JSON.parse(JSON.stringify(prev));
      let current: any = newContent;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
        if (!current) {
          console.warn(`Path not found:`, path.slice(0, i + 1));
          return prev;
        }
      }
      
      // Ensure the array exists and has the required index
      if (!Array.isArray(current) || !current[index]) {
        console.warn(`Array or index ${index} not found at path:`, path);
        return prev;
      }
      
      current[index][field] = value;
      
      // Update the contentByLanguage cache
      setContentByLanguage(prevByLang => {
        // If this is an image field, sync it to ALL languages
        if (isImageField) {
          const updatedAllLanguages: Record<string, ComprehensiveContent> = {};
          
          SUPPORTED_LANGUAGES.forEach(lang => {
            const langContent = JSON.parse(JSON.stringify(prevByLang[lang.code] || prev));
            let current: any = langContent;
            
            // Navigate to the array
            for (let i = 0; i < path.length; i++) {
              if (!current[path[i]]) {
                console.warn(`Path not found in language ${lang.code}:`, path.slice(0, i + 1));
                // Use the existing language content as fallback
                updatedAllLanguages[lang.code] = prevByLang[lang.code] || prev;
                return;
              }
              current = current[path[i]];
            }
            
            // Ensure the array exists and has the required index
            if (!Array.isArray(current)) {
              console.warn(`Not an array in language ${lang.code} at path:`, path);
              updatedAllLanguages[lang.code] = prevByLang[lang.code] || prev;
              return;
            }
            
            // If the index doesn't exist, initialize it from the current language's data
            if (!current[index]) {
              // Copy the structure from the current language (English)
              let currentLangArray: any = prev;
              for (let i = 0; i < path.length; i++) {
                currentLangArray = currentLangArray[path[i]];
              }
              
              if (currentLangArray && currentLangArray[index]) {
                current[index] = JSON.parse(JSON.stringify(currentLangArray[index]));
              } else {
                console.warn(`Array index ${index} not found in language ${lang.code}`);
                updatedAllLanguages[lang.code] = prevByLang[lang.code] || prev;
                return;
              }
            }
            
            current[index][field] = value;
            updatedAllLanguages[lang.code] = langContent;
          });
          
          // Mark all languages as modified when an image is updated
          setModifiedLanguages(prev => {
            const newSet = new Set(prev);
            SUPPORTED_LANGUAGES.forEach(lang => newSet.add(lang.code));
            return newSet;
          });
          
          // Show a toast notification that image was synced to all languages
          if (value) {
            toast.success(`Image synced to all ${SUPPORTED_LANGUAGES.length} languages!`, {
              description: "This image will appear in all language versions"
            });
          }
          
          return updatedAllLanguages;
        } else {
          // For non-image fields, only update current language
          return {
            ...prevByLang,
            [currentLanguage]: newContent,
          };
        }
      });
      
      // Mark this language as modified (or all if image)
      if (!isImageField) {
        setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
      }
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
      
      // Update the contentByLanguage cache
      setContentByLanguage(prevByLang => ({
        ...prevByLang,
        [currentLanguage]: newContent,
      }));
      
      // Mark this language as modified
      setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
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
      
      // Update the contentByLanguage cache
      setContentByLanguage(prevByLang => ({
        ...prevByLang,
        [currentLanguage]: newContent,
      }));
      
      // Mark this language as modified
      setModifiedLanguages(prev => new Set(prev).add(currentLanguage));
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

      {/* Language Selector */}
      <Card className="border-primary/30 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h4 className="font-medium text-foreground">Edit Language</h4>
          <Badge variant={currentLanguage === 'en' ? 'default' : 'outline'} className="ml-auto">
            {currentLanguage === 'en' ? 'Base Language' : 'Translation'}
          </Badge>
        </div>
        <Tabs value={currentLanguage} onValueChange={setCurrentLanguage}>
          <TabsList className="grid w-full grid-cols-7">
            {SUPPORTED_LANGUAGES.map(lang => (
              <TabsTrigger 
                key={lang.code} 
                value={lang.code}
                className="text-xs"
              >
                <span className="mr-1">{lang.flag}</span>
                {lang.code.toUpperCase()}
                {translationStatus.exists[lang.code] && (
                  <span className="ml-1 text-green-500">✓</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="mt-2 text-sm text-muted-foreground">
          {currentLanguage === 'en' 
            ? 'Editing the base English content. Changes can be auto-translated to other languages.' 
            : `Editing ${SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.name} translation. Changes will only affect this language.`
          }
        </p>
      </Card>

      {/* Auto-Translation Settings - Only show for English */}
      {currentLanguage === 'en' && (
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
                const exists = translationStatus.exists[lang.code];
                
                return (
                  <div
                    key={lang.code}
                    className="flex items-center gap-2 rounded border border-border bg-background p-2"
                  >
                    {exists ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className="text-sm">
                      {lang.name}
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

          {/* Translation action buttons */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={handleInitializeTranslations}
              className="w-full gap-2"
              disabled={isTranslating}
            >
              <FileText className="h-4 w-4" />
              Initialize All Languages
            </Button>
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
                  Auto-Translate All
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
      )}

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
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="company" className="flex-shrink-0">
            <Settings className="mr-1 h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="homepage" className="flex-shrink-0">
            <Home className="mr-1 h-4 w-4" />
            Home
          </TabsTrigger>
          <TabsTrigger value="howItWorks" className="flex-shrink-0">
            <Info className="mr-1 h-4 w-4" />
            How It Works
          </TabsTrigger>
          <TabsTrigger value="attractions" className="flex-shrink-0">
            <MapPin className="mr-1 h-4 w-4" />
            Attractions
          </TabsTrigger>
          <TabsTrigger value="buyTicket" className="flex-shrink-0">
            <ShoppingCart className="mr-1 h-4 w-4" />
            Buy Ticket
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex-shrink-0">
            <FileText className="mr-1 h-4 w-4" />
            Blog/Guide
          </TabsTrigger>
          <TabsTrigger value="other" className="flex-shrink-0">
            <User className="mr-1 h-4 w-4" />
            Other Pages
          </TabsTrigger>
          <TabsTrigger value="common" className="flex-shrink-0">
            <Globe className="mr-1 h-4 w-4" />
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
            <Alert className="mb-4">
              <Globe className="h-4 w-4" />
              <AlertDescription>
                Images are automatically shared across all languages. Upload once and they'll appear everywhere!
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <ImageSelector
                label="Main Hero Background Image"
                description="Large hero image shown at the top (e.g., tuk tuk with palace)"
                value={content.homepage.hero.heroImage || ""}
                onChange={(url) => updateContent(["homepage", "hero", "heroImage"], url)}
              />
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

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Quick Links Section</h3>
            <p className="mb-4 text-sm text-muted-foreground">Links to Attractions, Travel Guide, and Private Tours</p>
            <div className="space-y-4">
              <div><Label>Section Title</Label><Input value={content.homepage.quickLinks?.title || ""} onChange={(e) => updateContent(["homepage", "quickLinks", "title"], e.target.value)} /></div>
              <div><Label>Section Subtitle</Label><Input value={content.homepage.quickLinks?.subtitle || ""} onChange={(e) => updateContent(["homepage", "quickLinks", "subtitle"], e.target.value)} /></div>
              {["attractions", "travelGuide", "privateTours"].map((linkKey) => (
                <div key={linkKey} className="border-t pt-4">
                  <h4 className="mb-3 font-medium capitalize">{linkKey.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label>Title</Label><Input value={(content.homepage.quickLinks as any)?.[linkKey]?.title || ""} onChange={(e) => updateContent(["homepage", "quickLinks", linkKey, "title"], e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={(content.homepage.quickLinks as any)?.[linkKey]?.subtitle || ""} onChange={(e) => updateContent(["homepage", "quickLinks", linkKey, "subtitle"], e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Why Choose Us / Features</h3>
            <div className="space-y-4">
              <div><Label>Section Title</Label><Input value={content.homepage.whyChoose?.title || ""} onChange={(e) => updateContent(["homepage", "whyChoose", "title"], e.target.value)} /></div>
              <div><Label>Section Subtitle</Label><Input value={content.homepage.whyChoose?.subtitle || ""} onChange={(e) => updateContent(["homepage", "whyChoose", "subtitle"], e.target.value)} /></div>
            </div>
            <div className="mt-6"><h4 className="mb-4">Feature Cards</h4>
              <Accordion type="single" collapsible className="w-full">
                {(content.homepage.features || []).map((feature, index) => (
                  <AccordionItem key={index} value={`feat-${index}`}>
                    <AccordionTrigger>{feature.title}</AccordionTrigger>
                    <AccordionContent><div className="space-y-4 pt-4">
                      <div><Label>Icon</Label><Input value={feature.icon} onChange={(e) => updateArrayItem(["homepage", "features"], index, "icon", e.target.value)} /></div>
                      <div><Label>Title</Label><Input value={feature.title} onChange={(e) => updateArrayItem(["homepage", "features"], index, "title", e.target.value)} /></div>
                      <div><Label>Description</Label><Textarea value={feature.description} onChange={(e) => updateArrayItem(["homepage", "features"], index, "description", e.target.value)} rows={2} /></div>
                      <Button variant="destructive" size="sm" onClick={() => removeArrayItem(["homepage", "features"], index)}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                    </div></AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button variant="outline" className="mt-4" onClick={() => addArrayItem(["homepage", "features"], { title: "New Feature", description: "Description", icon: "Star" })}><Plus className="mr-2 h-4 w-4" /> Add Feature</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Service Highlights</h3>
            <div className="space-y-4">
              <div><Label>Section Title</Label><Input value={content.homepage.serviceHighlights?.title || ""} onChange={(e) => updateContent(["homepage", "serviceHighlights", "title"], e.target.value)} /></div>
            </div>
            <Accordion type="single" collapsible className="mt-4 w-full">
              {(content.homepage.serviceHighlights?.items || []).map((item, index) => (
                <AccordionItem key={index} value={`sh-${index}`}>
                  <AccordionTrigger>{item.title}</AccordionTrigger>
                  <AccordionContent><div className="space-y-4 pt-4">
                    <div><Label>Icon</Label><Input value={item.icon} onChange={(e) => updateArrayItem(["homepage", "serviceHighlights", "items"], index, "icon", e.target.value)} /></div>
                    <div><Label>Title</Label><Input value={item.title} onChange={(e) => updateArrayItem(["homepage", "serviceHighlights", "items"], index, "title", e.target.value)} /></div>
                    <div><Label>Description</Label><Textarea value={item.description} onChange={(e) => updateArrayItem(["homepage", "serviceHighlights", "items"], index, "description", e.target.value)} rows={2} /></div>
                    <Button variant="destructive" size="sm" onClick={() => removeArrayItem(["homepage", "serviceHighlights", "items"], index)}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                  </div></AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Button variant="outline" className="mt-4" onClick={() => addArrayItem(["homepage", "serviceHighlights", "items"], { title: "New", description: "Description", icon: "Star" })}><Plus className="mr-2 h-4 w-4" /> Add</Button>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Homepage Call to Action</h3>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={content.homepage.callToAction?.title || ""} onChange={(e) => updateContent(["homepage", "callToAction", "title"], e.target.value)} /></div>
              <div><Label>Description</Label><Textarea value={content.homepage.callToAction?.description || ""} onChange={(e) => updateContent(["homepage", "callToAction", "description"], e.target.value)} rows={2} /></div>
              <div><Label>Button Text</Label><Input value={content.homepage.callToAction?.buttonText || ""} onChange={(e) => updateContent(["homepage", "callToAction", "buttonText"], e.target.value)} /></div>
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

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hero Pills</h3>
            <p className="mb-4 text-sm text-muted-foreground">Small badges shown in the hero section</p>
            <div className="space-y-4">
              {(content.howItWorks.hero.pills || []).map((pill, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1"><Label>Icon</Label><Input value={pill.icon} onChange={(e) => updateArrayItem(["howItWorks", "hero", "pills"], index, "icon", e.target.value)} /></div>
                  <div className="flex-1"><Label>Text</Label><Input value={pill.text} onChange={(e) => updateArrayItem(["howItWorks", "hero", "pills"], index, "text", e.target.value)} /></div>
                  <Button variant="ghost" size="icon" className="mt-6" onClick={() => removeArrayItem(["howItWorks", "hero", "pills"], index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => addArrayItem(["howItWorks", "hero", "pills"], { icon: "Star", text: "New Pill" })}><Plus className="mr-2 h-4 w-4" /> Add Pill</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Call to Action Section</h3>
            <p className="mb-4 text-sm text-muted-foreground">Bottom CTA on the How It Works page</p>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={content.howItWorks.callToAction?.title || ""} onChange={(e) => updateContent(["howItWorks", "callToAction", "title"], e.target.value)} /></div>
              <div><Label>Description</Label><Textarea value={content.howItWorks.callToAction?.description || ""} onChange={(e) => updateContent(["howItWorks", "callToAction", "description"], e.target.value)} rows={2} /></div>
              <div><Label>Button Text</Label><Input value={content.howItWorks.callToAction?.buttonText || ""} onChange={(e) => updateContent(["howItWorks", "callToAction", "buttonText"], e.target.value)} /></div>
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
              <div>
                <Label>Park Only Label</Label>
                <Input
                  value={content.attractions.attractionDetailPage.parkOnly}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "parkOnly"], e.target.value)}
                />
              </div>
              <div>
                <Label>Full Access Label</Label>
                <Input
                  value={content.attractions.attractionDetailPage.fullAccess}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "fullAccess"], e.target.value)}
                />
              </div>
              <div>
                <Label>Buy Ticket Button</Label>
                <Input
                  value={content.attractions.attractionDetailPage.buyTicketButton}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "buyTicketButton"], e.target.value)}
                />
              </div>
              <div>
                <Label>Included In Pass Label</Label>
                <Input
                  value={content.attractions.attractionDetailPage.includedInPass}
                  onChange={(e) => updateContent(["attractions", "attractionDetailPage", "includedInPass"], e.target.value)}
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
                        <Alert className="mb-4">
                          <Globe className="h-4 w-4" />
                          <AlertDescription>
                            Images are automatically shared across all languages. Upload once and they'll appear everywhere!
                          </AlertDescription>
                        </Alert>
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
                          <MultiImageSelector
                            label="Carousel Gallery Images"
                            description="Images shown in the carousel/gallery on the attraction detail page"
                            value={attraction.gallery || []}
                            onChange={(urls) => 
                              updateContent(["attractions", "attractionDetails", key, "gallery"], urls)
                            }
                            maxImages={10}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Attractions Page CTA Section</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              The terracotta call-to-action section at the bottom of the Attractions page
            </p>
            <div className="space-y-4">
              <div>
                <Label>CTA Title</Label>
                <Input
                  value={content.hopOnService?.cta?.desktopTitle || ""}
                  onChange={(e) => updateContent(["hopOnService", "cta", "desktopTitle"], e.target.value)}
                  placeholder="e.g., Ready to Explore Sintra?"
                />
              </div>
              <div>
                <Label>CTA Description</Label>
                <Textarea
                  value={content.hopOnService?.cta?.desktopDescription || ""}
                  onChange={(e) => updateContent(["hopOnService", "cta", "desktopDescription"], e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Mobile CTA Title</Label>
                <Input
                  value={content.hopOnService?.cta?.mobileTitle || ""}
                  onChange={(e) => updateContent(["hopOnService", "cta", "mobileTitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Mobile CTA Description</Label>
                <Textarea
                  value={content.hopOnService?.cta?.mobileDescription || ""}
                  onChange={(e) => updateContent(["hopOnService", "cta", "mobileDescription"], e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Book Button Text</Label>
                <Input
                  value={content.hopOnService?.cta?.bookButton || ""}
                  onChange={(e) => updateContent(["hopOnService", "cta", "bookButton"], e.target.value)}
                />
              </div>
            </div>
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
              <div>
                <Label>Guided Tour Label</Label>
                <Input
                  value={content.buyTicket.dateSelection.guidedTourLabel}
                  onChange={(e) => updateContent(["buyTicket", "dateSelection", "guidedTourLabel"], e.target.value)}
                />
              </div>
              <div>
                <Label>Guided Tour Description</Label>
                <Textarea
                  value={content.buyTicket.dateSelection.guidedTourDescription}
                  onChange={(e) => updateContent(["buyTicket", "dateSelection", "guidedTourDescription"], e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Passenger Selection Form</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Section Title</Label><Input value={content.buyTicket.passengersSelection.title} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "title"], e.target.value)} /></div>
              <div><Label>Number of Passes Label</Label><Input value={content.buyTicket.passengersSelection.numberOfPasses} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "numberOfPasses"], e.target.value)} /></div>
              <div><Label>Contact Info Label</Label><Input value={content.buyTicket.passengersSelection.contactInfo} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "contactInfo"], e.target.value)} /></div>
              <div><Label>Full Name Label</Label><Input value={content.buyTicket.passengersSelection.fullName} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "fullName"], e.target.value)} /></div>
              <div><Label>Full Name Placeholder</Label><Input value={content.buyTicket.passengersSelection.fullNamePlaceholder} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "fullNamePlaceholder"], e.target.value)} /></div>
              <div><Label>Email Label</Label><Input value={content.buyTicket.passengersSelection.email} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "email"], e.target.value)} /></div>
              <div><Label>Email Placeholder</Label><Input value={content.buyTicket.passengersSelection.emailPlaceholder} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "emailPlaceholder"], e.target.value)} /></div>
              <div><Label>Confirm Email Label</Label><Input value={content.buyTicket.passengersSelection.confirmEmail} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "confirmEmail"], e.target.value)} /></div>
              <div><Label>Confirm Email Placeholder</Label><Input value={content.buyTicket.passengersSelection.confirmEmailPlaceholder} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "confirmEmailPlaceholder"], e.target.value)} /></div>
              <div><Label>Email Mismatch Error</Label><Input value={content.buyTicket.passengersSelection.emailMismatch} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "emailMismatch"], e.target.value)} /></div>
              <div><Label>Pickup Location Label</Label><Input value={content.buyTicket.passengersSelection.pickupLocation} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "pickupLocation"], e.target.value)} /></div>
              <div><Label>Pickup Location Description</Label><Input value={content.buyTicket.passengersSelection.pickupLocationDescription} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "pickupLocationDescription"], e.target.value)} /></div>
              <div><Label>Continue Button</Label><Input value={content.buyTicket.passengersSelection.continueButton} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "continueButton"], e.target.value)} /></div>
              <div><Label>Back Button</Label><Input value={content.buyTicket.passengersSelection.backButton} onChange={(e) => updateContent(["buyTicket", "passengersSelection", "backButton"], e.target.value)} /></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Attraction Tickets Selection</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Section Title</Label><Input value={content.buyTicket.attractionsSelection.title} onChange={(e) => updateContent(["buyTicket", "attractionsSelection", "title"], e.target.value)} /></div>
              <div><Label>Subtitle</Label><Input value={content.buyTicket.attractionsSelection.subtitle} onChange={(e) => updateContent(["buyTicket", "attractionsSelection", "subtitle"], e.target.value)} /></div>
              <div><Label>Skip Tickets Label</Label><Input value={content.buyTicket.attractionsSelection.skipTickets} onChange={(e) => updateContent(["buyTicket", "attractionsSelection", "skipTickets"], e.target.value)} /></div>
              <div><Label>Optional Tickets Label</Label><Input value={content.buyTicket.attractionsSelection.optionalTickets} onChange={(e) => updateContent(["buyTicket", "attractionsSelection", "optionalTickets"], e.target.value)} /></div>
              <div><Label>Continue Button</Label><Input value={content.buyTicket.attractionsSelection.continueButton} onChange={(e) => updateContent(["buyTicket", "attractionsSelection", "continueButton"], e.target.value)} /></div>
              <div><Label>Back Button</Label><Input value={content.buyTicket.attractionsSelection.backButton} onChange={(e) => updateContent(["buyTicket", "attractionsSelection", "backButton"], e.target.value)} /></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Payment Form</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Section Title</Label><Input value={content.buyTicket.payment.title} onChange={(e) => updateContent(["buyTicket", "payment", "title"], e.target.value)} /></div>
              <div><Label>Order Summary</Label><Input value={content.buyTicket.payment.orderSummary} onChange={(e) => updateContent(["buyTicket", "payment", "orderSummary"], e.target.value)} /></div>
              <div><Label>Day Pass Label</Label><Input value={content.buyTicket.payment.dayPass} onChange={(e) => updateContent(["buyTicket", "payment", "dayPass"], e.target.value)} /></div>
              <div><Label>Passes Label</Label><Input value={content.buyTicket.payment.passes} onChange={(e) => updateContent(["buyTicket", "payment", "passes"], e.target.value)} /></div>
              <div><Label>Guided Commentary</Label><Input value={content.buyTicket.payment.guidedCommentary} onChange={(e) => updateContent(["buyTicket", "payment", "guidedCommentary"], e.target.value)} /></div>
              <div><Label>Attraction Tickets</Label><Input value={content.buyTicket.payment.attractionTickets} onChange={(e) => updateContent(["buyTicket", "payment", "attractionTickets"], e.target.value)} /></div>
              <div><Label>Subtotal</Label><Input value={content.buyTicket.payment.subtotal} onChange={(e) => updateContent(["buyTicket", "payment", "subtotal"], e.target.value)} /></div>
              <div><Label>Total Label</Label><Input value={content.buyTicket.payment.total} onChange={(e) => updateContent(["buyTicket", "payment", "total"], e.target.value)} /></div>
              <div><Label>Card Details Label</Label><Input value={content.buyTicket.payment.cardDetails} onChange={(e) => updateContent(["buyTicket", "payment", "cardDetails"], e.target.value)} /></div>
              <div><Label>Processing Text</Label><Input value={content.buyTicket.payment.processing} onChange={(e) => updateContent(["buyTicket", "payment", "processing"], e.target.value)} /></div>
              <div><Label>Back Button</Label><Input value={content.buyTicket.payment.backButton} onChange={(e) => updateContent(["buyTicket", "payment", "backButton"], e.target.value)} /></div>
              <div><Label>Pay Now Button</Label><Input value={content.buyTicket.payment.payNowButton} onChange={(e) => updateContent(["buyTicket", "payment", "payNowButton"], e.target.value)} /></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Pricing Labels</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Base Price Label</Label><Input value={content.buyTicket.pricingLabels.basePrice} onChange={(e) => updateContent(["buyTicket", "pricingLabels", "basePrice"], e.target.value)} /></div>
              <div><Label>Guided Tour Surcharge</Label><Input value={content.buyTicket.pricingLabels.guidedTourSurcharge} onChange={(e) => updateContent(["buyTicket", "pricingLabels", "guidedTourSurcharge"], e.target.value)} /></div>
              <div><Label>Per Person</Label><Input value={content.buyTicket.pricingLabels.perPerson} onChange={(e) => updateContent(["buyTicket", "pricingLabels", "perPerson"], e.target.value)} /></div>
              <div><Label>Per Pass</Label><Input value={content.buyTicket.pricingLabels.perPass} onChange={(e) => updateContent(["buyTicket", "pricingLabels", "perPass"], e.target.value)} /></div>
            </div>
          </Card>
        </TabsContent>

        {/* Blog / Travel Guide Tab */}
        <TabsContent value="blog" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Blog / Travel Guide Page</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              These fields control the text on the Travel Guide listing page (BlogPage)
            </p>
            <div className="space-y-4">
              <div><Label>Page Title</Label><Input value={mainContent.blog?.pageTitle || ""} onChange={(e) => updateMainContentField(["blog", "pageTitle"], e.target.value)} /></div>
              <div><Label>Page Subtitle</Label><Textarea value={mainContent.blog?.pageSubtitle || ""} onChange={(e) => updateMainContentField(["blog", "pageSubtitle"], e.target.value)} rows={2} /></div>
              <div><Label>Search Placeholder</Label><Input value={mainContent.blog?.searchPlaceholder || ""} onChange={(e) => updateMainContentField(["blog", "searchPlaceholder"], e.target.value)} /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Filter By Label</Label><Input value={mainContent.blog?.filterBy || ""} onChange={(e) => updateMainContentField(["blog", "filterBy"], e.target.value)} /></div>
                <div><Label>All Articles Label</Label><Input value={mainContent.blog?.allArticles || ""} onChange={(e) => updateMainContentField(["blog", "allArticles"], e.target.value)} /></div>
                <div><Label>No Articles Found</Label><Input value={mainContent.blog?.noArticlesFound || ""} onChange={(e) => updateMainContentField(["blog", "noArticlesFound"], e.target.value)} /></div>
                <div><Label>Try Different Search</Label><Input value={mainContent.blog?.tryDifferentSearch || ""} onChange={(e) => updateMainContentField(["blog", "tryDifferentSearch"], e.target.value)} /></div>
                <div><Label>No Articles In Category</Label><Input value={mainContent.blog?.noArticlesInCategory || ""} onChange={(e) => updateMainContentField(["blog", "noArticlesInCategory"], e.target.value)} /></div>
                <div><Label>Articles Found</Label><Input value={mainContent.blog?.articlesFound || ""} onChange={(e) => updateMainContentField(["blog", "articlesFound"], e.target.value)} /></div>
                <div><Label>Article (singular)</Label><Input value={mainContent.blog?.article || ""} onChange={(e) => updateMainContentField(["blog", "article"], e.target.value)} /></div>
                <div><Label>Articles (plural)</Label><Input value={mainContent.blog?.articles || ""} onChange={(e) => updateMainContentField(["blog", "articles"], e.target.value)} /></div>
                <div><Label>Read Guide Button</Label><Input value={mainContent.blog?.readGuide || ""} onChange={(e) => updateMainContentField(["blog", "readGuide"], e.target.value)} /></div>
                <div><Label>Min Read</Label><Input value={mainContent.blog?.minRead || ""} onChange={(e) => updateMainContentField(["blog", "minRead"], e.target.value)} /></div>
                <div><Label>Guide (singular)</Label><Input value={mainContent.blog?.guide || ""} onChange={(e) => updateMainContentField(["blog", "guide"], e.target.value)} /></div>
                <div><Label>Guides (plural)</Label><Input value={mainContent.blog?.guides || ""} onChange={(e) => updateMainContentField(["blog", "guides"], e.target.value)} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Category Browser Section</h3>
            <div className="space-y-4">
              <div><Label>Browse Topics Title</Label><Input value={mainContent.blog?.browseTopics || ""} onChange={(e) => updateMainContentField(["blog", "browseTopics"], e.target.value)} /></div>
              <div><Label>Explore By Category Title</Label><Input value={mainContent.blog?.exploreByCategory || ""} onChange={(e) => updateMainContentField(["blog", "exploreByCategory"], e.target.value)} /></div>
              <div><Label>Explore Category Description</Label><Textarea value={mainContent.blog?.exploreCategoryDescription || ""} onChange={(e) => updateMainContentField(["blog", "exploreCategoryDescription"], e.target.value)} rows={2} /></div>
            </div>
            <div className="mt-6 border-t pt-4">
              <h4 className="mb-3">Category Names</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(mainContent.blog?.categories || {}).map(([key, value]) => (
                  <div key={key}><Label>{key}</Label><Input value={value as string} onChange={(e) => updateMainContentField(["blog", "categories", key], e.target.value)} /></div>
                ))}
              </div>
            </div>
            <div className="mt-6 border-t pt-4">
              <h4 className="mb-3">Category Descriptions</h4>
              <div className="space-y-4">
                {Object.entries(mainContent.blog?.categoryDescriptions || {}).map(([key, value]) => (
                  <div key={key}><Label>{key}</Label><Textarea value={value as string} onChange={(e) => updateMainContentField(["blog", "categoryDescriptions", key], e.target.value)} rows={2} /></div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Blog CTA Section</h3>
            <div className="space-y-4">
              <div><Label>CTA Title</Label><Input value={mainContent.blog?.ctaTitle || ""} onChange={(e) => updateMainContentField(["blog", "ctaTitle"], e.target.value)} /></div>
              <div><Label>CTA Subtitle</Label><Textarea value={mainContent.blog?.ctaSubtitle || ""} onChange={(e) => updateMainContentField(["blog", "ctaSubtitle"], e.target.value)} rows={2} /></div>
              <div><Label>CTA Button</Label><Input value={mainContent.blog?.ctaButton || ""} onChange={(e) => updateMainContentField(["blog", "ctaButton"], e.target.value)} /></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Blog Article Detail Page</h3>
            <p className="mb-4 text-sm text-muted-foreground">Labels used on individual blog article pages</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Back to Blog</Label><Input value={mainContent.blog?.backToBlog || ""} onChange={(e) => updateMainContentField(["blog", "backToBlog"], e.target.value)} /></div>
              <div><Label>Article Not Found</Label><Input value={mainContent.blog?.articleNotFound || ""} onChange={(e) => updateMainContentField(["blog", "articleNotFound"], e.target.value)} /></div>
              <div><Label>Share</Label><Input value={mainContent.blog?.share || ""} onChange={(e) => updateMainContentField(["blog", "share"], e.target.value)} /></div>
              <div><Label>Updated</Label><Input value={mainContent.blog?.updated || ""} onChange={(e) => updateMainContentField(["blog", "updated"], e.target.value)} /></div>
              <div><Label>Related Articles</Label><Input value={mainContent.blog?.relatedArticles || ""} onChange={(e) => updateMainContentField(["blog", "relatedArticles"], e.target.value)} /></div>
              <div><Label>More Articles</Label><Input value={mainContent.blog?.moreArticles || ""} onChange={(e) => updateMainContentField(["blog", "moreArticles"], e.target.value)} /></div>
              <div><Label>Breadcrumb Home</Label><Input value={mainContent.blog?.breadcrumbHome || ""} onChange={(e) => updateMainContentField(["blog", "breadcrumbHome"], e.target.value)} /></div>
              <div><Label>Breadcrumb Travel Guide</Label><Input value={mainContent.blog?.breadcrumbTravelGuide || ""} onChange={(e) => updateMainContentField(["blog", "breadcrumbTravelGuide"], e.target.value)} /></div>
              <div><Label>By Author</Label><Input value={mainContent.blog?.byAuthor || ""} onChange={(e) => updateMainContentField(["blog", "byAuthor"], e.target.value)} /></div>
              <div><Label>Share via Facebook</Label><Input value={mainContent.blog?.shareViaFacebook || ""} onChange={(e) => updateMainContentField(["blog", "shareViaFacebook"], e.target.value)} /></div>
              <div><Label>Share via Twitter</Label><Input value={mainContent.blog?.shareViaTwitter || ""} onChange={(e) => updateMainContentField(["blog", "shareViaTwitter"], e.target.value)} /></div>
              <div><Label>Share via Email</Label><Input value={mainContent.blog?.shareViaEmail || ""} onChange={(e) => updateMainContentField(["blog", "shareViaEmail"], e.target.value)} /></div>
              <div><Label>More from Travel Guide</Label><Input value={mainContent.blog?.moreFromTravelGuide || ""} onChange={(e) => updateMainContentField(["blog", "moreFromTravelGuide"], e.target.value)} /></div>
              <div><Label>View All Articles</Label><Input value={mainContent.blog?.viewAllArticles || ""} onChange={(e) => updateMainContentField(["blog", "viewAllArticles"], e.target.value)} /></div>
              <div><Label>Table of Contents</Label><Input value={mainContent.blog?.tableOfContents || ""} onChange={(e) => updateMainContentField(["blog", "tableOfContents"], e.target.value)} /></div>
              <div><Label>Ready to Experience</Label><Input value={mainContent.blog?.readyToExperience || ""} onChange={(e) => updateMainContentField(["blog", "readyToExperience"], e.target.value)} /></div>
              <div><Label>Book Flexible Day Pass</Label><Input value={mainContent.blog?.bookFlexibleDayPass || ""} onChange={(e) => updateMainContentField(["blog", "bookFlexibleDayPass"], e.target.value)} /></div>
              <div><Label>Book Day Pass Now</Label><Input value={mainContent.blog?.bookDayPassNow || ""} onChange={(e) => updateMainContentField(["blog", "bookDayPassNow"], e.target.value)} /></div>
            </div>
          </Card>
        </TabsContent>

        {/* Other Pages Tab */}
        <TabsContent value="other" className="space-y-4">
          {/* ABOUT PAGE - reads from mainContent.about (flat WebsiteContent paths) */}
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">About Page</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              The About page reads from the legacy content system. Fields below directly control what appears on the page.
            </p>
            <div className="space-y-4">
              <div><Label>Page Title</Label><Input value={mainContent.about?.title || ""} onChange={(e) => updateMainContentField(["about", "title"], e.target.value)} /></div>
              <div><Label>Page Subtitle</Label><Input value={mainContent.about?.subtitle || ""} onChange={(e) => updateMainContentField(["about", "subtitle"], e.target.value)} /></div>
              <div><Label>Mission Statement</Label><Textarea value={mainContent.about?.mission || ""} onChange={(e) => updateMainContentField(["about", "mission"], e.target.value)} rows={3} /></div>
              <div>
                <h4 className="mb-3 font-medium">Our Story Paragraphs</h4>
                {(mainContent.about?.story || []).map((paragraph, index) => (
                  <div key={index} className="mb-3 flex gap-2">
                    <div className="flex-1">
                      <Label>Paragraph {index + 1}</Label>
                      <Textarea value={paragraph} onChange={(e) => {
                        const newStory = [...(mainContent.about?.story || [])];
                        newStory[index] = e.target.value;
                        updateMainContentField(["about", "story"], newStory);
                      }} rows={3} />
                    </div>
                    <Button variant="ghost" size="icon" className="mt-6" onClick={() => {
                      const newStory = [...(mainContent.about?.story || [])];
                      newStory.splice(index, 1);
                      updateMainContentField(["about", "story"], newStory);
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => updateMainContentField(["about", "story"], [...(mainContent.about?.story || []), "New paragraph"])}><Plus className="mr-2 h-4 w-4" /> Add Paragraph</Button>
              </div>
              <div>
                <h4 className="mb-3 font-medium">Values</h4>
                <Accordion type="single" collapsible className="w-full">
                  {(mainContent.about?.values || []).map((val, index) => (
                    <AccordionItem key={index} value={`val-${index}`}>
                      <AccordionTrigger>{val.title}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div><Label>Title</Label><Input value={val.title} onChange={(e) => updateMainContentArrayItem(["about", "values"], index, "title", e.target.value)} /></div>
                          <div><Label>Description</Label><Textarea value={val.description} onChange={(e) => updateMainContentArrayItem(["about", "values"], index, "description", e.target.value)} rows={2} /></div>
                          <Button variant="destructive" size="sm" onClick={() => removeMainContentArrayItem(["about", "values"], index)}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button variant="outline" className="mt-4" onClick={() => addMainContentArrayItem(["about", "values"], { title: "New Value", description: "Description" })}><Plus className="mr-2 h-4 w-4" /> Add Value</Button>
              </div>
            </div>
          </Card>

          {/* MANAGE BOOKING PAGE - reads from mainContent.manageBooking (flat WebsiteContent paths) */}
          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Manage Booking Page</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              All fields below directly control what appears on the Manage Booking page.
            </p>
            <div className="space-y-4">
              <h4 className="font-medium">Search Form</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Page Title</Label><Input value={mainContent.manageBooking?.pageTitle || ""} onChange={(e) => updateMainContentField(["manageBooking", "pageTitle"], e.target.value)} /></div>
                <div><Label>Page Subtitle</Label><Input value={mainContent.manageBooking?.pageSubtitle || ""} onChange={(e) => updateMainContentField(["manageBooking", "pageSubtitle"], e.target.value)} /></div>
                <div><Label>Booking ID Label</Label><Input value={mainContent.manageBooking?.bookingIdLabel || ""} onChange={(e) => updateMainContentField(["manageBooking", "bookingIdLabel"], e.target.value)} /></div>
                <div><Label>Booking ID Placeholder</Label><Input value={mainContent.manageBooking?.bookingIdPlaceholder || ""} onChange={(e) => updateMainContentField(["manageBooking", "bookingIdPlaceholder"], e.target.value)} /></div>
                <div><Label>Last Name Label</Label><Input value={mainContent.manageBooking?.lastNameLabel || ""} onChange={(e) => updateMainContentField(["manageBooking", "lastNameLabel"], e.target.value)} /></div>
                <div><Label>Last Name Placeholder</Label><Input value={mainContent.manageBooking?.lastNamePlaceholder || ""} onChange={(e) => updateMainContentField(["manageBooking", "lastNamePlaceholder"], e.target.value)} /></div>
                <div><Label>Find Booking Button</Label><Input value={mainContent.manageBooking?.findBookingButton || ""} onChange={(e) => updateMainContentField(["manageBooking", "findBookingButton"], e.target.value)} /></div>
              </div>

              <h4 className="mt-4 font-medium">Help Section</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Where to Find Booking ID</Label><Input value={mainContent.manageBooking?.whereToFindBookingId || ""} onChange={(e) => updateMainContentField(["manageBooking", "whereToFindBookingId"], e.target.value)} /></div>
                <div><Label>In Confirmation Email</Label><Input value={mainContent.manageBooking?.inConfirmationEmail || ""} onChange={(e) => updateMainContentField(["manageBooking", "inConfirmationEmail"], e.target.value)} /></div>
                <div><Label>Subject Line</Label><Input value={mainContent.manageBooking?.subjectLine || ""} onChange={(e) => updateMainContentField(["manageBooking", "subjectLine"], e.target.value)} /></div>
                <div><Label>Look For</Label><Input value={mainContent.manageBooking?.lookFor || ""} onChange={(e) => updateMainContentField(["manageBooking", "lookFor"], e.target.value)} /></div>
                <div><Label>Need Help</Label><Input value={mainContent.manageBooking?.needHelp || ""} onChange={(e) => updateMainContentField(["manageBooking", "needHelp"], e.target.value)} /></div>
                <div><Label>Contact Support</Label><Input value={mainContent.manageBooking?.contactSupport || ""} onChange={(e) => updateMainContentField(["manageBooking", "contactSupport"], e.target.value)} /></div>
              </div>

              <h4 className="mt-4 font-medium">Booking Details View</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Your Booking</Label><Input value={mainContent.manageBooking?.yourBooking || ""} onChange={(e) => updateMainContentField(["manageBooking", "yourBooking"], e.target.value)} /></div>
                <div><Label>Booking ID</Label><Input value={mainContent.manageBooking?.bookingId || ""} onChange={(e) => updateMainContentField(["manageBooking", "bookingId"], e.target.value)} /></div>
                <div><Label>Valid Today</Label><Input value={mainContent.manageBooking?.validToday || ""} onChange={(e) => updateMainContentField(["manageBooking", "validToday"], e.target.value)} /></div>
                <div><Label>Enjoy Your Day</Label><Input value={mainContent.manageBooking?.enjoyYourDay || ""} onChange={(e) => updateMainContentField(["manageBooking", "enjoyYourDay"], e.target.value)} /></div>
                <div><Label>Starts In</Label><Input value={mainContent.manageBooking?.startsIn || ""} onChange={(e) => updateMainContentField(["manageBooking", "startsIn"], e.target.value)} /></div>
                <div><Label>Days</Label><Input value={mainContent.manageBooking?.days || ""} onChange={(e) => updateMainContentField(["manageBooking", "days"], e.target.value)} /></div>
                <div><Label>Valid On</Label><Input value={mainContent.manageBooking?.validOn || ""} onChange={(e) => updateMainContentField(["manageBooking", "validOn"], e.target.value)} /></div>
                <div><Label>Expired</Label><Input value={mainContent.manageBooking?.expired || ""} onChange={(e) => updateMainContentField(["manageBooking", "expired"], e.target.value)} /></div>
                <div><Label>Pass Date</Label><Input value={mainContent.manageBooking?.passDate || ""} onChange={(e) => updateMainContentField(["manageBooking", "passDate"], e.target.value)} /></div>
                <div><Label>Pickup Time</Label><Input value={mainContent.manageBooking?.pickupTime || ""} onChange={(e) => updateMainContentField(["manageBooking", "pickupTime"], e.target.value)} /></div>
                <div><Label>Back to Search</Label><Input value={mainContent.manageBooking?.backToSearch || ""} onChange={(e) => updateMainContentField(["manageBooking", "backToSearch"], e.target.value)} /></div>
              </div>

              <h4 className="mt-4 font-medium">Booking Info Labels</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Operating Hours</Label><Input value={mainContent.manageBooking?.operatingHours || ""} onChange={(e) => updateMainContentField(["manageBooking", "operatingHours"], e.target.value)} /></div>
                <div><Label>Operating Hours Value</Label><Input value={mainContent.manageBooking?.operatingHoursValue || ""} onChange={(e) => updateMainContentField(["manageBooking", "operatingHoursValue"], e.target.value)} /></div>
                <div><Label>Contact Details</Label><Input value={mainContent.manageBooking?.contactDetails || ""} onChange={(e) => updateMainContentField(["manageBooking", "contactDetails"], e.target.value)} /></div>
                <div><Label>Booking Details</Label><Input value={mainContent.manageBooking?.bookingDetails || ""} onChange={(e) => updateMainContentField(["manageBooking", "bookingDetails"], e.target.value)} /></div>
                <div><Label>Passengers</Label><Input value={mainContent.manageBooking?.passengers || ""} onChange={(e) => updateMainContentField(["manageBooking", "passengers"], e.target.value)} /></div>
                <div><Label>Guided Commentary</Label><Input value={mainContent.manageBooking?.guidedCommentary || ""} onChange={(e) => updateMainContentField(["manageBooking", "guidedCommentary"], e.target.value)} /></div>
                <div><Label>Attraction Tickets</Label><Input value={mainContent.manageBooking?.attractionTickets || ""} onChange={(e) => updateMainContentField(["manageBooking", "attractionTickets"], e.target.value)} /></div>
                <div><Label>Total Paid</Label><Input value={mainContent.manageBooking?.totalPaid || ""} onChange={(e) => updateMainContentField(["manageBooking", "totalPaid"], e.target.value)} /></div>
              </div>

              <h4 className="mt-4 font-medium">Important Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Important Information Title</Label><Input value={mainContent.manageBooking?.importantInformation || ""} onChange={(e) => updateMainContentField(["manageBooking", "importantInformation"], e.target.value)} /></div>
                <div><Label>Service Hours</Label><Input value={mainContent.manageBooking?.serviceHours || ""} onChange={(e) => updateMainContentField(["manageBooking", "serviceHours"], e.target.value)} /></div>
                <div><Label>Service Hours Desc</Label><Input value={mainContent.manageBooking?.serviceHoursDescription || ""} onChange={(e) => updateMainContentField(["manageBooking", "serviceHoursDescription"], e.target.value)} /></div>
                <div><Label>Digital Tickets</Label><Input value={mainContent.manageBooking?.digitalTickets || ""} onChange={(e) => updateMainContentField(["manageBooking", "digitalTickets"], e.target.value)} /></div>
                <div><Label>Digital Tickets Desc</Label><Input value={mainContent.manageBooking?.digitalTicketsDescription || ""} onChange={(e) => updateMainContentField(["manageBooking", "digitalTicketsDescription"], e.target.value)} /></div>
                <div><Label>Guaranteed Seating</Label><Input value={mainContent.manageBooking?.guaranteedSeating || ""} onChange={(e) => updateMainContentField(["manageBooking", "guaranteedSeating"], e.target.value)} /></div>
                <div><Label>Guaranteed Seating Desc</Label><Input value={mainContent.manageBooking?.guaranteedSeatingDescription || ""} onChange={(e) => updateMainContentField(["manageBooking", "guaranteedSeatingDescription"], e.target.value)} /></div>
                <div><Label>Hop On Off</Label><Input value={mainContent.manageBooking?.hopOnOff || ""} onChange={(e) => updateMainContentField(["manageBooking", "hopOnOff"], e.target.value)} /></div>
                <div><Label>Hop On Off Desc</Label><Input value={mainContent.manageBooking?.hopOnOffDescription || ""} onChange={(e) => updateMainContentField(["manageBooking", "hopOnOffDescription"], e.target.value)} /></div>
              </div>

              <h4 className="mt-4 font-medium">Actions & Errors</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Download Tickets</Label><Input value={mainContent.manageBooking?.downloadTickets || ""} onChange={(e) => updateMainContentField(["manageBooking", "downloadTickets"], e.target.value)} /></div>
                <div><Label>Download QR Codes</Label><Input value={mainContent.manageBooking?.downloadQRCodes || ""} onChange={(e) => updateMainContentField(["manageBooking", "downloadQRCodes"], e.target.value)} /></div>
                <div><Label>Booking Not Found</Label><Input value={mainContent.manageBooking?.bookingNotFound || ""} onChange={(e) => updateMainContentField(["manageBooking", "bookingNotFound"], e.target.value)} /></div>
                <div><Label>Not Found Description</Label><Input value={mainContent.manageBooking?.bookingNotFoundDescription || ""} onChange={(e) => updateMainContentField(["manageBooking", "bookingNotFoundDescription"], e.target.value)} /></div>
                <div><Label>Check Details</Label><Input value={mainContent.manageBooking?.checkDetails || ""} onChange={(e) => updateMainContentField(["manageBooking", "checkDetails"], e.target.value)} /></div>
                <div><Label>Try Again</Label><Input value={mainContent.manageBooking?.tryAgain || ""} onChange={(e) => updateMainContentField(["manageBooking", "tryAgain"], e.target.value)} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Request Pickup Page</h3>
            <div className="space-y-4">
              <div><Label>Hero Title</Label><Input value={content.requestPickup.hero.title} onChange={(e) => updateContent(["requestPickup", "hero", "title"], e.target.value)} /></div>
              <div><Label>Hero Subtitle</Label><Input value={content.requestPickup.hero.subtitle} onChange={(e) => updateContent(["requestPickup", "hero", "subtitle"], e.target.value)} /></div>
              <div><Label>Request Button</Label><Input value={content.requestPickup.form.requestButton} onChange={(e) => updateContent(["requestPickup", "form", "requestButton"], e.target.value)} /></div>
              <h4 className="mt-4 font-medium">Form Fields</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Form Title</Label><Input value={content.requestPickup.form.title} onChange={(e) => updateContent(["requestPickup", "form", "title"], e.target.value)} /></div>
                <div><Label>Form Description</Label><Input value={content.requestPickup.form.description} onChange={(e) => updateContent(["requestPickup", "form", "description"], e.target.value)} /></div>
                <div><Label>Booking ID Label</Label><Input value={content.requestPickup.form.bookingIdLabel} onChange={(e) => updateContent(["requestPickup", "form", "bookingIdLabel"], e.target.value)} /></div>
                <div><Label>Booking ID Placeholder</Label><Input value={content.requestPickup.form.bookingIdPlaceholder} onChange={(e) => updateContent(["requestPickup", "form", "bookingIdPlaceholder"], e.target.value)} /></div>
                <div><Label>Current Location Label</Label><Input value={content.requestPickup.form.currentLocationLabel} onChange={(e) => updateContent(["requestPickup", "form", "currentLocationLabel"], e.target.value)} /></div>
                <div><Label>Current Location Placeholder</Label><Input value={content.requestPickup.form.currentLocationPlaceholder} onChange={(e) => updateContent(["requestPickup", "form", "currentLocationPlaceholder"], e.target.value)} /></div>
                <div><Label>Use My Location</Label><Input value={content.requestPickup.form.useMyLocation} onChange={(e) => updateContent(["requestPickup", "form", "useMyLocation"], e.target.value)} /></div>
                <div><Label>Notes Label</Label><Input value={content.requestPickup.form.notesLabel} onChange={(e) => updateContent(["requestPickup", "form", "notesLabel"], e.target.value)} /></div>
                <div><Label>Notes Placeholder</Label><Input value={content.requestPickup.form.notesPlaceholder} onChange={(e) => updateContent(["requestPickup", "form", "notesPlaceholder"], e.target.value)} /></div>
                <div><Label>Requesting Button (loading)</Label><Input value={content.requestPickup.form.requestingButton} onChange={(e) => updateContent(["requestPickup", "form", "requestingButton"], e.target.value)} /></div>
              </div>
              <h4 className="mt-4 font-medium">Confirmation Messages</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Confirmation Title</Label><Input value={content.requestPickup.confirmation?.title || ""} onChange={(e) => updateContent(["requestPickup", "confirmation", "title"], e.target.value)} /></div>
                <div><Label>Confirmation Description</Label><Input value={content.requestPickup.confirmation?.description || ""} onChange={(e) => updateContent(["requestPickup", "confirmation", "description"], e.target.value)} /></div>
                <div><Label>Estimated Arrival</Label><Input value={content.requestPickup.confirmation?.estimatedArrival || ""} onChange={(e) => updateContent(["requestPickup", "confirmation", "estimatedArrival"], e.target.value)} /></div>
                <div><Label>Tracking Title</Label><Input value={content.requestPickup.confirmation?.trackingTitle || ""} onChange={(e) => updateContent(["requestPickup", "confirmation", "trackingTitle"], e.target.value)} /></div>
                <div><Label>Cancel Request</Label><Input value={content.requestPickup.confirmation?.cancelRequest || ""} onChange={(e) => updateContent(["requestPickup", "confirmation", "cancelRequest"], e.target.value)} /></div>
                <div><Label>New Request</Label><Input value={content.requestPickup.confirmation?.newRequest || ""} onChange={(e) => updateContent(["requestPickup", "confirmation", "newRequest"], e.target.value)} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Hop On Service Detail Page</h3>
            <div className="space-y-4">
              <div>
                <Label>Hero Title</Label>
                <Input
                  value={content.hopOnService.hero.title}
                  onChange={(e) => updateContent(["hopOnService", "hero", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Hero Subtitle</Label>
                <Textarea
                  value={content.hopOnService.hero.subtitle}
                  onChange={(e) => updateContent(["hopOnService", "hero", "subtitle"], e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Hero Image */}
              <div className="pt-4 border-t">
                <ImageSelector
                  label="Hero Background Image"
                  description="Main background image for the hero section"
                  value={content.hopOnService.hero.heroImage || ""}
                  onChange={(url) => updateContent(["hopOnService", "hero", "heroImage"], url)}
                />
              </div>
              
              <div>
                <Label>Main Description Title</Label>
                <Input
                  value={content.hopOnService.description.mainTitle}
                  onChange={(e) => updateContent(["hopOnService", "description", "mainTitle"], e.target.value)}
                />
              </div>
              <div>
                <Label>Description Paragraph 1</Label>
                <Textarea
                  value={content.hopOnService.description.paragraphs[0]}
                  onChange={(e) => {
                    const newParagraphs = [...content.hopOnService.description.paragraphs];
                    newParagraphs[0] = e.target.value;
                    updateContent(["hopOnService", "description", "paragraphs"], newParagraphs);
                  }}
                  rows={3}
                />
              </div>
              <div>
                <Label>Description Paragraph 2</Label>
                <Textarea
                  value={content.hopOnService.description.paragraphs[1]}
                  onChange={(e) => {
                    const newParagraphs = [...content.hopOnService.description.paragraphs];
                    newParagraphs[1] = e.target.value;
                    updateContent(["hopOnService", "description", "paragraphs"], newParagraphs);
                  }}
                  rows={3}
                />
              </div>

              {/* Gallery Images Carousel */}
              <div className="pt-4 border-t">
                <MultiImageSelector
                  label="Gallery Carousel Images"
                  description="Select images for the gallery carousel. Images will be displayed in the order you arrange them."
                  value={content.hopOnService.galleryImages || []}
                  onChange={(urls) => updateContent(["hopOnService", "galleryImages"], urls)}
                  maxImages={10}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="mb-4">Features</h4>
              <Accordion type="single" collapsible className="w-full">
                {content.hopOnService.features.map((feature, index) => (
                  <AccordionItem key={index} value={`feature-${index}`}>
                    <AccordionTrigger>
                      {feature.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={feature.title}
                            onChange={(e) => 
                              updateArrayItem(["hopOnService", "features"], index, "title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={feature.description}
                            onChange={(e) => 
                              updateArrayItem(["hopOnService", "features"], index, "description", e.target.value)
                            }
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Icon Name</Label>
                          <Input
                            value={feature.icon}
                            onChange={(e) => 
                              updateArrayItem(["hopOnService", "features"], index, "icon", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="mt-6">
              <h4 className="mb-4">FAQ Questions</h4>
              <Accordion type="single" collapsible className="w-full">
                {content.hopOnService.faq.map((qa, index) => (
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
                              updateArrayItem(["hopOnService", "faq"], index, "question", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Answer</Label>
                          <Textarea
                            value={qa.answer}
                            onChange={(e) => 
                              updateArrayItem(["hopOnService", "faq"], index, "answer", e.target.value)
                            }
                            rows={4}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="mb-4">Call to Action Section</h4>
              <p className="mb-4 text-sm text-muted-foreground">
                The CTA at the bottom of the Hop On Service page and used by the Attractions page
              </p>
              <div className="space-y-4">
                <div><Label>CTA Title</Label><Input value={content.hopOnService?.cta?.desktopTitle || ""} onChange={(e) => updateContent(["hopOnService", "cta", "desktopTitle"], e.target.value)} /></div>
                <div><Label>CTA Description</Label><Textarea value={content.hopOnService?.cta?.desktopDescription || ""} onChange={(e) => updateContent(["hopOnService", "cta", "desktopDescription"], e.target.value)} rows={2} /></div>
                <div><Label>Mobile Title</Label><Input value={content.hopOnService?.cta?.mobileTitle || ""} onChange={(e) => updateContent(["hopOnService", "cta", "mobileTitle"], e.target.value)} /></div>
                <div><Label>Mobile Description</Label><Textarea value={content.hopOnService?.cta?.mobileDescription || ""} onChange={(e) => updateContent(["hopOnService", "cta", "mobileDescription"], e.target.value)} rows={2} /></div>
                <div><Label>Book Button Text</Label><Input value={content.hopOnService?.cta?.bookButton || ""} onChange={(e) => updateContent(["hopOnService", "cta", "bookButton"], e.target.value)} /></div>
                <div><Label>Why Choose Title</Label><Input value={content.hopOnService?.cta?.whyChooseTitle || ""} onChange={(e) => updateContent(["hopOnService", "cta", "whyChooseTitle"], e.target.value)} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Private Tours Page</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Fields below control all text on the Private Tours page (WebsiteContent system)
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="pt-comingsoon">
                <AccordionTrigger>Coming Soon Section</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div><Label>Badge</Label><Input value={mainContent.privateTours?.comingSoon?.badge || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "badge"], e.target.value)} /></div>
                    <div><Label>Title</Label><Input value={mainContent.privateTours?.comingSoon?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "title"], e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={mainContent.privateTours?.comingSoon?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "subtitle"], e.target.value)} /></div>
                    <div><Label>Stay Tuned Text</Label><Input value={mainContent.privateTours?.comingSoon?.stayTunedText || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "stayTunedText"], e.target.value)} /></div>
                    <div><Label>Feature 1</Label><Input value={mainContent.privateTours?.comingSoon?.feature1 || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "feature1"], e.target.value)} /></div>
                    <div><Label>Feature 2</Label><Input value={mainContent.privateTours?.comingSoon?.feature2 || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "feature2"], e.target.value)} /></div>
                    <div><Label>Feature 3</Label><Input value={mainContent.privateTours?.comingSoon?.feature3 || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "feature3"], e.target.value)} /></div>
                    <div><Label>Notify Button</Label><Input value={mainContent.privateTours?.comingSoon?.notifyButton || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "notifyButton"], e.target.value)} /></div>
                    <div><Label>Explore Day Pass Button</Label><Input value={mainContent.privateTours?.comingSoon?.exploreDayPassButton || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "exploreDayPassButton"], e.target.value)} /></div>
                    <div><Label>Footer Text</Label><Input value={mainContent.privateTours?.comingSoon?.footerText || ""} onChange={(e) => updateMainContentField(["privateTours", "comingSoon", "footerText"], e.target.value)} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-whywait">
                <AccordionTrigger>Why Wait Section</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div><Label>Title</Label><Input value={mainContent.privateTours?.whyWait?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "title"], e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={mainContent.privateTours?.whyWait?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "subtitle"], e.target.value)} /></div>
                    <div><Label>Card 1 Title</Label><Input value={mainContent.privateTours?.whyWait?.card1Title || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "card1Title"], e.target.value)} /></div>
                    <div><Label>Card 1 Description</Label><Input value={mainContent.privateTours?.whyWait?.card1Description || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "card1Description"], e.target.value)} /></div>
                    <div><Label>Card 2 Title</Label><Input value={mainContent.privateTours?.whyWait?.card2Title || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "card2Title"], e.target.value)} /></div>
                    <div><Label>Card 2 Description</Label><Input value={mainContent.privateTours?.whyWait?.card2Description || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "card2Description"], e.target.value)} /></div>
                    <div><Label>Card 3 Title</Label><Input value={mainContent.privateTours?.whyWait?.card3Title || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "card3Title"], e.target.value)} /></div>
                    <div><Label>Card 3 Description</Label><Input value={mainContent.privateTours?.whyWait?.card3Description || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "card3Description"], e.target.value)} /></div>
                    <div><Label>Book Day Pass Button</Label><Input value={mainContent.privateTours?.whyWait?.bookDayPassButton || ""} onChange={(e) => updateMainContentField(["privateTours", "whyWait", "bookDayPassButton"], e.target.value)} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-hero">
                <AccordionTrigger>Hero Section</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div><Label>Badge</Label><Input value={mainContent.privateTours?.hero?.badge || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "badge"], e.target.value)} /></div>
                    <div><Label>Title</Label><Input value={mainContent.privateTours?.hero?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "title"], e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={mainContent.privateTours?.hero?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "subtitle"], e.target.value)} /></div>
                    <div><Label>Pill 1</Label><Input value={mainContent.privateTours?.hero?.pill1 || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "pill1"], e.target.value)} /></div>
                    <div><Label>Pill 2</Label><Input value={mainContent.privateTours?.hero?.pill2 || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "pill2"], e.target.value)} /></div>
                    <div><Label>Pill 3</Label><Input value={mainContent.privateTours?.hero?.pill3 || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "pill3"], e.target.value)} /></div>
                    <div><Label>Request Quote Button</Label><Input value={mainContent.privateTours?.hero?.requestQuoteButton || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "requestQuoteButton"], e.target.value)} /></div>
                    <div><Label>View Packages Button</Label><Input value={mainContent.privateTours?.hero?.viewPackagesButton || ""} onChange={(e) => updateMainContentField(["privateTours", "hero", "viewPackagesButton"], e.target.value)} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-packages">
                <AccordionTrigger>Tour Packages</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Section Title</Label><Input value={mainContent.privateTours?.packages?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "title"], e.target.value)} /></div>
                      <div><Label>Section Subtitle</Label><Input value={mainContent.privateTours?.packages?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "subtitle"], e.target.value)} /></div>
                    </div>
                    <div className="border-t pt-4"><h5 className="mb-3 font-medium">Half Day Package</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>Title</Label><Input value={mainContent.privateTours?.packages?.halfDay?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", "title"], e.target.value)} /></div>
                        <div><Label>Description</Label><Input value={mainContent.privateTours?.packages?.halfDay?.description || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", "description"], e.target.value)} /></div>
                        <div><Label>Price</Label><Input value={mainContent.privateTours?.packages?.halfDay?.price || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", "price"], e.target.value)} /></div>
                        <div><Label>Price Subtext</Label><Input value={mainContent.privateTours?.packages?.halfDay?.priceSubtext || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", "priceSubtext"], e.target.value)} /></div>
                        <div><Label>Duration</Label><Input value={mainContent.privateTours?.packages?.halfDay?.duration || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", "duration"], e.target.value)} /></div>
                        <div><Label>Book Button</Label><Input value={mainContent.privateTours?.packages?.halfDay?.bookButton || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", "bookButton"], e.target.value)} /></div>
                        {[1,2,3,4,5].map(i => (
                          <div key={`hd-f${i}`}><Label>Feature {i}</Label><Input value={(mainContent.privateTours?.packages?.halfDay as any)?.[`feature${i}`] || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "halfDay", `feature${i}`], e.target.value)} /></div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4"><h5 className="mb-3 font-medium">Full Day Package</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>Badge</Label><Input value={mainContent.privateTours?.packages?.fullDay?.badge || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "badge"], e.target.value)} /></div>
                        <div><Label>Title</Label><Input value={mainContent.privateTours?.packages?.fullDay?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "title"], e.target.value)} /></div>
                        <div><Label>Description</Label><Input value={mainContent.privateTours?.packages?.fullDay?.description || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "description"], e.target.value)} /></div>
                        <div><Label>Price</Label><Input value={mainContent.privateTours?.packages?.fullDay?.price || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "price"], e.target.value)} /></div>
                        <div><Label>Price Subtext</Label><Input value={mainContent.privateTours?.packages?.fullDay?.priceSubtext || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "priceSubtext"], e.target.value)} /></div>
                        <div><Label>Duration</Label><Input value={mainContent.privateTours?.packages?.fullDay?.duration || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "duration"], e.target.value)} /></div>
                        <div><Label>Book Button</Label><Input value={mainContent.privateTours?.packages?.fullDay?.bookButton || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", "bookButton"], e.target.value)} /></div>
                        {[1,2,3,4,5,6].map(i => (
                          <div key={`fd-f${i}`}><Label>Feature {i}</Label><Input value={(mainContent.privateTours?.packages?.fullDay as any)?.[`feature${i}`] || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "fullDay", `feature${i}`], e.target.value)} /></div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4"><h5 className="mb-3 font-medium">Custom Package</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>Title</Label><Input value={mainContent.privateTours?.packages?.custom?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "custom", "title"], e.target.value)} /></div>
                        <div><Label>Description</Label><Input value={mainContent.privateTours?.packages?.custom?.description || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "custom", "description"], e.target.value)} /></div>
                        <div><Label>Price</Label><Input value={mainContent.privateTours?.packages?.custom?.price || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "custom", "price"], e.target.value)} /></div>
                        <div><Label>Duration</Label><Input value={mainContent.privateTours?.packages?.custom?.duration || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "custom", "duration"], e.target.value)} /></div>
                        <div><Label>Contact Button</Label><Input value={mainContent.privateTours?.packages?.custom?.contactButton || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "custom", "contactButton"], e.target.value)} /></div>
                        {[1,2,3,4,5].map(i => (
                          <div key={`cu-f${i}`}><Label>Feature {i}</Label><Input value={(mainContent.privateTours?.packages?.custom as any)?.[`feature${i}`] || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "custom", `feature${i}`], e.target.value)} /></div>
                        ))}
                      </div>
                    </div>
                    <div><Label>Disclaimer</Label><Textarea value={mainContent.privateTours?.packages?.disclaimer || ""} onChange={(e) => updateMainContentField(["privateTours", "packages", "disclaimer"], e.target.value)} rows={2} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-whychoose">
                <AccordionTrigger>Why Choose Us</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div><Label>Title</Label><Input value={mainContent.privateTours?.whyChoose?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "whyChoose", "title"], e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={mainContent.privateTours?.whyChoose?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "whyChoose", "subtitle"], e.target.value)} /></div>
                    {[1,2,3].map(i => (
                      <div key={`wc-${i}`} className="col-span-2 grid gap-4 md:grid-cols-2">
                        <div><Label>Benefit {i} Title</Label><Input value={(mainContent.privateTours?.whyChoose as any)?.[`benefit${i}Title`] || ""} onChange={(e) => updateMainContentField(["privateTours", "whyChoose", `benefit${i}Title`], e.target.value)} /></div>
                        <div><Label>Benefit {i} Description</Label><Input value={(mainContent.privateTours?.whyChoose as any)?.[`benefit${i}Description`] || ""} onChange={(e) => updateMainContentField(["privateTours", "whyChoose", `benefit${i}Description`], e.target.value)} /></div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-included">
                <AccordionTrigger>What's Included</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div className="col-span-2"><Label>Title</Label><Input value={mainContent.privateTours?.whatsIncluded?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "whatsIncluded", "title"], e.target.value)} /></div>
                    {[1,2,3,4].map(i => (
                      <div key={`wi-${i}`} className="col-span-2 grid gap-4 md:grid-cols-2">
                        <div><Label>Item {i} Title</Label><Input value={(mainContent.privateTours?.whatsIncluded as any)?.[`item${i}Title`] || ""} onChange={(e) => updateMainContentField(["privateTours", "whatsIncluded", `item${i}Title`], e.target.value)} /></div>
                        <div><Label>Item {i} Description</Label><Input value={(mainContent.privateTours?.whatsIncluded as any)?.[`item${i}Description`] || ""} onChange={(e) => updateMainContentField(["privateTours", "whatsIncluded", `item${i}Description`], e.target.value)} /></div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-itineraries">
                <AccordionTrigger>Sample Itineraries</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Section Title</Label><Input value={mainContent.privateTours?.sampleItineraries?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "title"], e.target.value)} /></div>
                      <div><Label>Section Subtitle</Label><Input value={mainContent.privateTours?.sampleItineraries?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "subtitle"], e.target.value)} /></div>
                    </div>
                    <div className="border-t pt-4"><h5 className="mb-3 font-medium">Half Day Itinerary</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>Title</Label><Input value={mainContent.privateTours?.sampleItineraries?.halfDay?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "halfDay", "title"], e.target.value)} /></div>
                        <div><Label>Duration</Label><Input value={mainContent.privateTours?.sampleItineraries?.halfDay?.duration || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "halfDay", "duration"], e.target.value)} /></div>
                        <div><Label>Badge</Label><Input value={mainContent.privateTours?.sampleItineraries?.halfDay?.badge || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "halfDay", "badge"], e.target.value)} /></div>
                        {[1,2,3].map(i => (
                          <div key={`hdi-${i}`} className="col-span-2 grid gap-4 md:grid-cols-2">
                            <div><Label>Stop {i} Title</Label><Input value={(mainContent.privateTours?.sampleItineraries?.halfDay as any)?.[`stop${i}Title`] || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "halfDay", `stop${i}Title`], e.target.value)} /></div>
                            <div><Label>Stop {i} Description</Label><Input value={(mainContent.privateTours?.sampleItineraries?.halfDay as any)?.[`stop${i}Description`] || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "halfDay", `stop${i}Description`], e.target.value)} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4"><h5 className="mb-3 font-medium">Full Day Itinerary</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>Title</Label><Input value={mainContent.privateTours?.sampleItineraries?.fullDay?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "fullDay", "title"], e.target.value)} /></div>
                        <div><Label>Duration</Label><Input value={mainContent.privateTours?.sampleItineraries?.fullDay?.duration || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "fullDay", "duration"], e.target.value)} /></div>
                        <div><Label>Badge</Label><Input value={mainContent.privateTours?.sampleItineraries?.fullDay?.badge || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "fullDay", "badge"], e.target.value)} /></div>
                        {[1,2,3,4,5].map(i => (
                          <div key={`fdi-${i}`} className="col-span-2 grid gap-4 md:grid-cols-2">
                            <div><Label>Stop {i} Title</Label><Input value={(mainContent.privateTours?.sampleItineraries?.fullDay as any)?.[`stop${i}Title`] || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "fullDay", `stop${i}Title`], e.target.value)} /></div>
                            <div><Label>Stop {i} Description</Label><Input value={(mainContent.privateTours?.sampleItineraries?.fullDay as any)?.[`stop${i}Description`] || ""} onChange={(e) => updateMainContentField(["privateTours", "sampleItineraries", "fullDay", `stop${i}Description`], e.target.value)} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-faq">
                <AccordionTrigger>FAQ</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Section Title</Label><Input value={mainContent.privateTours?.faq?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "faq", "title"], e.target.value)} /></div>
                      <div><Label>Section Subtitle</Label><Input value={mainContent.privateTours?.faq?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "faq", "subtitle"], e.target.value)} /></div>
                    </div>
                    {[1,2,3,4,5].map(i => (
                      <div key={`ptfaq-${i}`} className="space-y-2 border-t pt-3">
                        <div><Label>Question {i}</Label><Input value={(mainContent.privateTours?.faq as any)?.[`question${i}`] || ""} onChange={(e) => updateMainContentField(["privateTours", "faq", `question${i}`], e.target.value)} /></div>
                        <div><Label>Answer {i}</Label><Textarea value={(mainContent.privateTours?.faq as any)?.[`answer${i}`] || ""} onChange={(e) => updateMainContentField(["privateTours", "faq", `answer${i}`], e.target.value)} rows={2} /></div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pt-finalcta">
                <AccordionTrigger>Final CTA</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4 md:grid-cols-2">
                    <div><Label>Title</Label><Input value={mainContent.privateTours?.finalCta?.title || ""} onChange={(e) => updateMainContentField(["privateTours", "finalCta", "title"], e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={mainContent.privateTours?.finalCta?.subtitle || ""} onChange={(e) => updateMainContentField(["privateTours", "finalCta", "subtitle"], e.target.value)} /></div>
                    <div><Label>Request Quote Button</Label><Input value={mainContent.privateTours?.finalCta?.requestQuoteButton || ""} onChange={(e) => updateMainContentField(["privateTours", "finalCta", "requestQuoteButton"], e.target.value)} /></div>
                    <div><Label>Chat Button</Label><Input value={mainContent.privateTours?.finalCta?.chatButton || ""} onChange={(e) => updateMainContentField(["privateTours", "finalCta", "chatButton"], e.target.value)} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Live Chat Widget</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              The Live Chat widget reads from the component-translations system. Editing these fields updates the WebsiteContent store.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Live Support Title</Label><Input value={mainContent.liveChat?.liveSupport || ""} onChange={(e) => updateMainContentField(["liveChat", "liveSupport"], e.target.value)} /></div>
              <div><Label>Here to Help</Label><Input value={mainContent.liveChat?.hereToHelp || ""} onChange={(e) => updateMainContentField(["liveChat", "hereToHelp"], e.target.value)} /></div>
              <div><Label>Chat on WhatsApp</Label><Input value={mainContent.liveChat?.chatOnWhatsApp || ""} onChange={(e) => updateMainContentField(["liveChat", "chatOnWhatsApp"], e.target.value)} /></div>
              <div><Label>Or Start Web Chat</Label><Input value={mainContent.liveChat?.orStartWebChat || ""} onChange={(e) => updateMainContentField(["liveChat", "orStartWebChat"], e.target.value)} /></div>
              <div><Label>Start Web Chat</Label><Input value={mainContent.liveChat?.startWebChat || ""} onChange={(e) => updateMainContentField(["liveChat", "startWebChat"], e.target.value)} /></div>
              <div><Label>Starting...</Label><Input value={mainContent.liveChat?.starting || ""} onChange={(e) => updateMainContentField(["liveChat", "starting"], e.target.value)} /></div>
              <div><Label>Conversation Saved</Label><Input value={mainContent.liveChat?.conversationSaved || ""} onChange={(e) => updateMainContentField(["liveChat", "conversationSaved"], e.target.value)} /></div>
              <div><Label>Welcome Message</Label><Textarea value={mainContent.liveChat?.welcomeMessage || ""} onChange={(e) => updateMainContentField(["liveChat", "welcomeMessage"], e.target.value)} rows={2} /></div>
              <div><Label>Enter Name Placeholder</Label><Input value={mainContent.liveChat?.enterName || ""} onChange={(e) => updateMainContentField(["liveChat", "enterName"], e.target.value)} /></div>
              <div><Label>Enter Email Placeholder</Label><Input value={mainContent.liveChat?.enterEmail || ""} onChange={(e) => updateMainContentField(["liveChat", "enterEmail"], e.target.value)} /></div>
              <div><Label>Enter Message Placeholder</Label><Input value={mainContent.liveChat?.enterMessage || ""} onChange={(e) => updateMainContentField(["liveChat", "enterMessage"], e.target.value)} /></div>
              <div><Label>Send Message Button</Label><Input value={mainContent.liveChat?.sendMessage || ""} onChange={(e) => updateMainContentField(["liveChat", "sendMessage"], e.target.value)} /></div>
              <div><Label>Go Back Button</Label><Input value={mainContent.liveChat?.goBack || ""} onChange={(e) => updateMainContentField(["liveChat", "goBack"], e.target.value)} /></div>
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
              <div className="border-t pt-4">
                <h4 className="mb-3">Legacy Footer Links (WebsiteContent)</h4>
                <p className="mb-3 text-sm text-muted-foreground">These are read by pages using the legacy content system</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Quick Links</Label><Input value={mainContent.footer?.quickLinks || ""} onChange={(e) => updateMainContentField(["footer", "quickLinks"], e.target.value)} /></div>
                  <div><Label>Attractions</Label><Input value={mainContent.footer?.attractions || ""} onChange={(e) => updateMainContentField(["footer", "attractions"], e.target.value)} /></div>
                  <div><Label>Travel Guide</Label><Input value={mainContent.footer?.travelGuide || ""} onChange={(e) => updateMainContentField(["footer", "travelGuide"], e.target.value)} /></div>
                  <div><Label>Buy Day Pass</Label><Input value={mainContent.footer?.buyDayPass || ""} onChange={(e) => updateMainContentField(["footer", "buyDayPass"], e.target.value)} /></div>
                  <div><Label>Privacy Policy</Label><Input value={mainContent.footer?.privacyPolicy || ""} onChange={(e) => updateMainContentField(["footer", "privacyPolicy"], e.target.value)} /></div>
                  <div><Label>Terms</Label><Input value={mainContent.footer?.terms || ""} onChange={(e) => updateMainContentField(["footer", "terms"], e.target.value)} /></div>
                  <div><Label>Reserved Area</Label><Input value={mainContent.footer?.reservedArea || ""} onChange={(e) => updateMainContentField(["footer", "reservedArea"], e.target.value)} /></div>
                  <div><Label>Admin Portal</Label><Input value={mainContent.footer?.adminPortal || ""} onChange={(e) => updateMainContentField(["footer", "adminPortal"], e.target.value)} /></div>
                  <div><Label>Driver Portal</Label><Input value={mainContent.footer?.driverPortal || ""} onChange={(e) => updateMainContentField(["footer", "driverPortal"], e.target.value)} /></div>
                  <div><Label>All Rights Reserved</Label><Input value={mainContent.footer?.allRightsReserved || ""} onChange={(e) => updateMainContentField(["footer", "allRightsReserved"], e.target.value)} /></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Common Messages</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(content.common.messages || {}).map(([key, value]) => (
                <div key={key}>
                  <Label>{key}</Label>
                  {typeof value === 'string' && value.length > 60 ? (
                    <Textarea value={value} onChange={(e) => updateContent(["common", "messages", key], e.target.value)} rows={2} />
                  ) : (
                    <Input value={typeof value === 'string' ? value : ''} onChange={(e) => updateContent(["common", "messages", key], e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Header / Navigation Labels</h3>
            <p className="mb-4 text-sm text-muted-foreground">Legacy header labels used in navigation</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Private Tours</Label><Input value={mainContent.header?.privateTours || ""} onChange={(e) => updateMainContentField(["header", "privateTours"], e.target.value)} /></div>
              <div><Label>Travel Guide</Label><Input value={mainContent.header?.travelGuide || ""} onChange={(e) => updateMainContentField(["header", "travelGuide"], e.target.value)} /></div>
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
