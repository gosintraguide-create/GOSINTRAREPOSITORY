import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, FileText, Home, Info, MapPin, ShoppingCart, User, Phone, Settings, Trash2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import {
  loadComprehensiveContent,
  saveComprehensiveContent,
  saveComprehensiveContentAsync,
  DEFAULT_COMPREHENSIVE_CONTENT,
  type ComprehensiveContent,
} from "../lib/comprehensiveContent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function ContentEditor() {
  const [content, setContent] = useState<ComprehensiveContent>(DEFAULT_COMPREHENSIVE_CONTENT);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setContent(loadComprehensiveContent());
  }, []);

  const handleSave = async () => {
    try {
      const result = await saveComprehensiveContentAsync(content);
      
      if (result.success) {
        setHasChanges(false);
        toast.success("All content saved successfully to database!");
      } else {
        toast.error(`Failed to save to database: ${result.error}. Saved locally only.`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error("Failed to save content. Please try again.");
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
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!hasChanges}>
            <Save className="h-4 w-4" />
            Save All Changes
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

      {/* Search */}
      <div>
        <Input
          placeholder="Search for content to edit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

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
            <h3 className="mb-4 text-foreground">Benefit Pills</h3>
            <div className="space-y-4">
              {content.homepage.hero.benefitPills.map((pill, index) => (
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

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Why Choose Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.homepage.whyChoose.title}
                  onChange={(e) => updateContent(["homepage", "whyChoose", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea
                  value={content.homepage.whyChoose.subtitle}
                  onChange={(e) => updateContent(["homepage", "whyChoose", "subtitle"], e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Features</h3>
            <Accordion type="single" collapsible className="w-full">
              {content.homepage.features.map((feature, index) => (
                <AccordionItem key={index} value={`feature-${index}`}>
                  <AccordionTrigger>
                    {feature.title || `Feature ${index + 1}`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Icon Name</Label>
                        <Input
                          value={feature.icon}
                          onChange={(e) => 
                            updateArrayItem(["homepage", "features"], index, "icon", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => 
                            updateArrayItem(["homepage", "features"], index, "title", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => 
                            updateArrayItem(["homepage", "features"], index, "description", e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeArrayItem(["homepage", "features"], index)}
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
                addArrayItem(["homepage", "features"], {
                  title: "New Feature",
                  description: "Description here",
                  icon: "Star"
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-foreground">Call to Action</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.homepage.callToAction.title}
                  onChange={(e) => updateContent(["homepage", "callToAction", "title"], e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={content.homepage.callToAction.description}
                  onChange={(e) => updateContent(["homepage", "callToAction", "description"], e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={content.homepage.callToAction.buttonText}
                  onChange={(e) => updateContent(["homepage", "callToAction", "buttonText"], e.target.value)}
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
