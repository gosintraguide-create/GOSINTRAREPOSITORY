import {MerchantAccess} from './MerchantAccess';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Edit, Trash2, Store, Tag } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;

const emptyMerchantForm = {
  name: "",
  category: "",
  location: "",
  lat: "",
  lng: "",
  isActive: true,
};

const emptyDealForm = {
  merchantId: "",
  title: "",
  terms: "",
  isSingleUse: true,
  isActive: true,
};

export function MerchantsDealsManagement({showProfiles=true}:{showProfiles?:boolean}) {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateMerchant, setShowCreateMerchant] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<any>(null);
  const [merchantForm, setMerchantForm] = useState(emptyMerchantForm);

  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [dealForm, setDealForm] = useState(emptyDealForm);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadMerchants(), loadDeals()]);
    setLoading(false);
  };

  const loadMerchants = async () => {
    try {
      const response = await fetch(`${API_BASE}/merchants`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) setMerchants(data.merchants);
    } catch (error) {
      console.error("Error loading merchants:", error);
      toast.error("Failed to load merchants");
    }
  };

  const loadDeals = async () => {
    try {
      const response = await fetch(`${API_BASE}/deals`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) setDeals(data.deals);
    } catch (error) {
      console.error("Error loading deals:", error);
      toast.error("Failed to load deals");
    }
  };

  // ===== Merchants =====

  const handleCreateMerchant = async () => {
    if (!merchantForm.name) {
      toast.error("Merchant name is required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/merchants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          name: merchantForm.name,
          category: merchantForm.category,
          location: merchantForm.location,
          lat: merchantForm.lat ? parseFloat(merchantForm.lat) : null,
          lng: merchantForm.lng ? parseFloat(merchantForm.lng) : null,
          isActive: merchantForm.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create merchant");

      toast.success("Merchant created");
      setShowCreateMerchant(false);
      setMerchantForm(emptyMerchantForm);
      loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to create merchant");
    }
  };

  const handleUpdateMerchant = async () => {
    if (!editingMerchant) return;

    try {
      const response = await fetch(`${API_BASE}/merchants/${editingMerchant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          name: merchantForm.name,
          category: merchantForm.category,
          location: merchantForm.location,
          lat: merchantForm.lat ? parseFloat(merchantForm.lat) : null,
          lng: merchantForm.lng ? parseFloat(merchantForm.lng) : null,
          isActive: merchantForm.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update merchant");

      toast.success("Merchant updated");
      setEditingMerchant(null);
      setMerchantForm(emptyMerchantForm);
      loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to update merchant");
    }
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    if (
      !confirm(
        "Delete this merchant? Its deals will be deleted too. This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/merchants/${merchantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to delete merchant");

      toast.success("Merchant deleted");
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete merchant");
    }
  };

  const openEditMerchant = (merchant: any) => {
    setEditingMerchant(merchant);
    setMerchantForm({
      name: merchant.name,
      category: merchant.category || "",
      location: merchant.location || "",
      lat: merchant.lat?.toString() || "",
      lng: merchant.lng?.toString() || "",
      isActive: merchant.is_active,
    });
  };

  // ===== Deals =====

  const handleCreateDeal = async () => {
    if (!dealForm.merchantId || !dealForm.title) {
      toast.error("Merchant and title are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/deals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          merchantId: dealForm.merchantId,
          title: dealForm.title,
          terms: dealForm.terms,
          isSingleUse: dealForm.isSingleUse,
          isActive: dealForm.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create deal");

      toast.success("Deal created");
      setShowCreateDeal(false);
      setDealForm(emptyDealForm);
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || "Failed to create deal");
    }
  };

  const handleUpdateDeal = async () => {
    if (!editingDeal) return;

    try {
      const response = await fetch(`${API_BASE}/deals/${editingDeal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          merchantId: dealForm.merchantId,
          title: dealForm.title,
          terms: dealForm.terms,
          isSingleUse: dealForm.isSingleUse,
          isActive: dealForm.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update deal");

      toast.success("Deal updated");
      setEditingDeal(null);
      setDealForm(emptyDealForm);
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || "Failed to update deal");
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;

    try {
      const response = await fetch(`${API_BASE}/deals/${dealId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to delete deal");

      toast.success("Deal deleted");
      loadDeals();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete deal");
    }
  };

  const openEditDeal = (deal: any) => {
    setEditingDeal(deal);
    setDealForm({
      merchantId: deal.merchant_id,
      title: deal.title,
      terms: deal.terms || "",
      isSingleUse: deal.is_single_use,
      isActive: deal.is_active,
    });
  };

  const merchantName = (merchantId: string) =>
    merchants.find((m) => m.id === merchantId)?.name || "Unknown merchant";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading merchants &amp; deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showProfiles&&<MerchantAccess merchants={merchants}/>}{/* ===== Merchants ===== */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl">Merchants</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Stores and restaurants offering deals through the app
            </p>
          </div>
          <Dialog open={showCreateMerchant} onOpenChange={setShowCreateMerchant}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#D97843] hover:bg-[#D97843]/90"
                onClick={() => setMerchantForm(emptyMerchantForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Merchant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Merchant</DialogTitle>
                <DialogDescription>Add a new merchant</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="m-name">Name *</Label>
                  <Input
                    id="m-name"
                    placeholder="Café da Vila"
                    value={merchantForm.name}
                    onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-category">Category</Label>
                  <Input
                    id="m-category"
                    placeholder="Café"
                    value={merchantForm.category}
                    onChange={(e) => setMerchantForm({ ...merchantForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-location">Location</Label>
                  <Input
                    id="m-location"
                    placeholder="Rua das Padarias 10, Sintra"
                    value={merchantForm.location}
                    onChange={(e) => setMerchantForm({ ...merchantForm, location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="m-lat">Latitude</Label>
                    <Input
                      id="m-lat"
                      type="number"
                      step="any"
                      placeholder="38.7979"
                      value={merchantForm.lat}
                      onChange={(e) => setMerchantForm({ ...merchantForm, lat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-lng">Longitude</Label>
                    <Input
                      id="m-lng"
                      type="number"
                      step="any"
                      placeholder="-9.3879"
                      value={merchantForm.lng}
                      onChange={(e) => setMerchantForm({ ...merchantForm, lng: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateMerchant}
                  className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
                >
                  Create Merchant
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Merchants</CardTitle>
            <CardDescription>Manage merchant listings shown in the app</CardDescription>
          </CardHeader>
          <CardContent>
            {merchants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No merchants yet</p>
                <p className="text-sm mt-1">Add your first merchant to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {merchants.map((merchant) => (
                  <Card key={merchant.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{merchant.name}</h3>
                            <Badge className={merchant.is_active ? "bg-green-500" : "bg-gray-500"}>
                              {merchant.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {merchant.category && (
                            <p className="text-sm text-gray-500">{merchant.category}</p>
                          )}
                          {merchant.location && (
                            <p className="text-sm text-gray-500">{merchant.location}</p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Dialog
                            open={editingMerchant?.id === merchant.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingMerchant(null);
                                setMerchantForm(emptyMerchantForm);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditMerchant(merchant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Merchant</DialogTitle>
                                <DialogDescription>Update merchant details</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-m-name">Name</Label>
                                  <Input
                                    id="edit-m-name"
                                    value={merchantForm.name}
                                    onChange={(e) =>
                                      setMerchantForm({ ...merchantForm, name: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-m-category">Category</Label>
                                  <Input
                                    id="edit-m-category"
                                    value={merchantForm.category}
                                    onChange={(e) =>
                                      setMerchantForm({ ...merchantForm, category: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-m-location">Location</Label>
                                  <Input
                                    id="edit-m-location"
                                    value={merchantForm.location}
                                    onChange={(e) =>
                                      setMerchantForm({ ...merchantForm, location: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-m-lat">Latitude</Label>
                                    <Input
                                      id="edit-m-lat"
                                      type="number"
                                      step="any"
                                      value={merchantForm.lat}
                                      onChange={(e) =>
                                        setMerchantForm({ ...merchantForm, lat: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-m-lng">Longitude</Label>
                                    <Input
                                      id="edit-m-lng"
                                      type="number"
                                      step="any"
                                      value={merchantForm.lng}
                                      onChange={(e) =>
                                        setMerchantForm({ ...merchantForm, lng: e.target.value })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    id="edit-m-active"
                                    type="checkbox"
                                    checked={merchantForm.isActive}
                                    onChange={(e) =>
                                      setMerchantForm({
                                        ...merchantForm,
                                        isActive: e.target.checked,
                                      })
                                    }
                                  />
                                  <Label htmlFor="edit-m-active">Active</Label>
                                </div>
                                <Button
                                  onClick={handleUpdateMerchant}
                                  className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
                                >
                                  Update Merchant
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMerchant(merchant.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Deals ===== */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl">Deals</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Single-use discounts included with the card
            </p>
          </div>
          <Dialog open={showCreateDeal} onOpenChange={setShowCreateDeal}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#D97843] hover:bg-[#D97843]/90"
                onClick={() => setDealForm(emptyDealForm)}
                disabled={merchants.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Deal</DialogTitle>
                <DialogDescription>Add a new deal for a merchant</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="d-merchant">Merchant *</Label>
                  <Select
                    value={dealForm.merchantId}
                    onValueChange={(value) => setDealForm({ ...dealForm, merchantId: value })}
                  >
                    <SelectTrigger id="d-merchant">
                      <SelectValue placeholder="Select a merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-title">Title *</Label>
                  <Input
                    id="d-title"
                    placeholder="10% off any coffee"
                    value={dealForm.title}
                    onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-terms">Terms</Label>
                  <Textarea
                    id="d-terms"
                    placeholder="One redemption per card, dine-in only"
                    value={dealForm.terms}
                    onChange={(e) => setDealForm({ ...dealForm, terms: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="d-single-use"
                    type="checkbox"
                    checked={dealForm.isSingleUse}
                    onChange={(e) => setDealForm({ ...dealForm, isSingleUse: e.target.checked })}
                  />
                  <Label htmlFor="d-single-use">Single use</Label>
                </div>
                <Button
                  onClick={handleCreateDeal}
                  className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
                >
                  Create Deal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Deals</CardTitle>
            <CardDescription>Deals available to card holders</CardDescription>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No deals yet</p>
                <p className="text-sm mt-1">
                  {merchants.length === 0
                    ? "Add a merchant first, then create its deals"
                    : "Add your first deal to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <Card key={deal.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{deal.title}</h3>
                            <Badge className={deal.is_active ? "bg-green-500" : "bg-gray-500"}>
                              {deal.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {deal.is_single_use && <Badge variant="outline">Single use</Badge>}
                          </div>
                          <p className="text-sm text-gray-500">
                            {merchantName(deal.merchant_id)}
                          </p>
                          {deal.terms && <p className="text-sm text-gray-500">{deal.terms}</p>}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Dialog
                            open={editingDeal?.id === deal.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingDeal(null);
                                setDealForm(emptyDealForm);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDeal(deal)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Deal</DialogTitle>
                                <DialogDescription>Update deal details</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-d-merchant">Merchant</Label>
                                  <Select
                                    value={dealForm.merchantId}
                                    onValueChange={(value) =>
                                      setDealForm({ ...dealForm, merchantId: value })
                                    }
                                  >
                                    <SelectTrigger id="edit-d-merchant">
                                      <SelectValue placeholder="Select a merchant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {merchants.map((merchant) => (
                                        <SelectItem key={merchant.id} value={merchant.id}>
                                          {merchant.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-d-title">Title</Label>
                                  <Input
                                    id="edit-d-title"
                                    value={dealForm.title}
                                    onChange={(e) =>
                                      setDealForm({ ...dealForm, title: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-d-terms">Terms</Label>
                                  <Textarea
                                    id="edit-d-terms"
                                    value={dealForm.terms}
                                    onChange={(e) =>
                                      setDealForm({ ...dealForm, terms: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    id="edit-d-single-use"
                                    type="checkbox"
                                    checked={dealForm.isSingleUse}
                                    onChange={(e) =>
                                      setDealForm({ ...dealForm, isSingleUse: e.target.checked })
                                    }
                                  />
                                  <Label htmlFor="edit-d-single-use">Single use</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    id="edit-d-active"
                                    type="checkbox"
                                    checked={dealForm.isActive}
                                    onChange={(e) =>
                                      setDealForm({ ...dealForm, isActive: e.target.checked })
                                    }
                                  />
                                  <Label htmlFor="edit-d-active">Active</Label>
                                </div>
                                <Button
                                  onClick={handleUpdateDeal}
                                  className="w-full bg-[#D97843] hover:bg-[#D97843]/90"
                                >
                                  Update Deal
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



