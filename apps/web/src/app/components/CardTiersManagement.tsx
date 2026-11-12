import { authenticatedFetch as fetch } from "@/lib/authenticatedFetch";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Plus, Edit, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;

export function CardTiersManagement() {
  const [cardProducts, setCardProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceEuros: "",
    validFromTime: "08:30",
    validUntilTime: "19:00",
    isActive: true,
  });

  useEffect(() => {
    loadCardProducts();
  }, []);

  const loadCardProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/card-products`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) {
        setCardProducts(data.cardProducts);
      }
    } catch (error) {
      console.error("Error loading card products:", error);
      toast.error("Failed to load card products");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priceEuros: "",
      validFromTime: "08:30",
      validUntilTime: "19:00",
      isActive: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.priceEuros) {
      toast.error("Name and price are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/card-products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priceCents: Math.round(parseFloat(formData.priceEuros) * 100),
          validFromTime: formData.validFromTime,
          validUntilTime: formData.validUntilTime,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create card tier");

      toast.success("Card tier created");
      setShowCreateDialog(false);
      resetForm();
      loadCardProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create card tier");
    }
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`${API_BASE}/card-products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priceCents: Math.round(parseFloat(formData.priceEuros) * 100),
          validFromTime: formData.validFromTime,
          validUntilTime: formData.validUntilTime,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update card tier");

      toast.success("Card tier updated");
      setEditingProduct(null);
      resetForm();
      loadCardProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update card tier");
    }
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      priceEuros: (product.price_cents / 100).toFixed(2),
      validFromTime: product.valid_from_time?.slice(0, 5) || "08:30",
      validUntilTime: product.valid_until_time?.slice(0, 5) || "19:00",
      isActive: product.is_active,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading card tiers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl">Card Tiers</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Manage the Sintra Day Card products sold in the app
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#D97843] hover:bg-[#D97843]/90"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Card Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Card Tier</DialogTitle>
              <DialogDescription>Add a new card product</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Basic Day Card"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Unlimited tuk tuk rides and deals for one day"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.priceEuros}
                  onChange={(e) => setFormData({ ...formData, priceEuros: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid from</Label>
                  <Input
                    id="validFrom"
                    type="time"
                    value={formData.validFromTime}
                    onChange={(e) => setFormData({ ...formData, validFromTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid until</Label>
                  <Input
                    id="validUntil"
                    type="time"
                    value={formData.validUntilTime}
                    onChange={(e) => setFormData({ ...formData, validUntilTime: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#D97843] hover:bg-[#D97843]/90">
                Create Card Tier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Card Tiers</CardTitle>
          <CardDescription>Products available for purchase in the mobile app</CardDescription>
        </CardHeader>
        <CardContent>
          {cardProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No card tiers yet</p>
              <p className="text-sm mt-1">Create the first one to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cardProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <Badge className={product.is_active ? "bg-green-500" : "bg-gray-500"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-500">{product.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          €{(product.price_cents / 100).toFixed(2)} · valid{" "}
                          {product.valid_from_time?.slice(0, 5)}–
                          {product.valid_until_time?.slice(0, 5)}
                        </p>
                      </div>

                      <Dialog
                        open={editingProduct?.id === product.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingProduct(null);
                            resetForm();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Card Tier</DialogTitle>
                            <DialogDescription>Update card product details</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) =>
                                  setFormData({ ...formData, description: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-price">Price (€)</Label>
                              <Input
                                id="edit-price"
                                type="number"
                                step="0.01"
                                value={formData.priceEuros}
                                onChange={(e) =>
                                  setFormData({ ...formData, priceEuros: e.target.value })
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-validFrom">Valid from</Label>
                                <Input
                                  id="edit-validFrom"
                                  type="time"
                                  value={formData.validFromTime}
                                  onChange={(e) =>
                                    setFormData({ ...formData, validFromTime: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-validUntil">Valid until</Label>
                                <Input
                                  id="edit-validUntil"
                                  type="time"
                                  value={formData.validUntilTime}
                                  onChange={(e) =>
                                    setFormData({ ...formData, validUntilTime: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                id="edit-isActive"
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) =>
                                  setFormData({ ...formData, isActive: e.target.checked })
                                }
                              />
                              <Label htmlFor="edit-isActive">Active</Label>
                            </div>
                            <Button
                              onClick={handleUpdate}
                              className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
                            >
                              Update Card Tier
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
