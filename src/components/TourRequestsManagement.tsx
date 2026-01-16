import { useState, useEffect } from "react";
import {
  MessageCircle,
  Calendar,
  Users,
  Clock,
  Mail,
  Phone,
  CheckCircle,
  X,
  RefreshCw,
  Archive,
  Eye,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export interface TourRequest {
  id: string;
  tourTitle: string;
  customerName: string;
  email: string;
  phone?: string;
  preferredDate?: string;
  numberOfPeople?: number;
  message?: string;
  status: "pending" | "contacted" | "confirmed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export function TourRequestsManagement() {
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TourRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showArchivedFilter, setShowArchivedFilter] = useState<"all" | "active" | "archived">("active");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-requests`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error loading tour requests:", error);
      toast.error("Failed to load tour requests");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: TourRequest["status"]
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-requests/${requestId}/status`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        toast.success(`Request marked as ${status}`);
        await loadRequests();
      } else {
        toast.error("Failed to update request status");
      }
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request status");
    }
  };

  const saveAdminNotes = async (requestId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-requests/${requestId}/notes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: adminNotes }),
        }
      );

      if (response.ok) {
        toast.success("Notes saved");
        await loadRequests();
        setSelectedRequest(null);
        setAdminNotes("");
      } else {
        toast.error("Failed to save notes");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    }
  };

  const openRequestDetails = (request: TourRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
  };

  const getStatusBadgeColor = (status: TourRequest["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "contacted":
        return "bg-blue-500";
      case "confirmed":
        return "bg-green-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (showArchivedFilter === "active") {
      return request.status !== "cancelled" && request.status !== "confirmed";
    } else if (showArchivedFilter === "archived") {
      return request.status === "cancelled" || request.status === "confirmed";
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading tour requests...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Private Tour Requests
            {pendingCount > 0 && (
              <Badge className="ml-3 bg-accent">{pendingCount} New</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage customer inquiries for private tours
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              variant={showArchivedFilter === "active" ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowArchivedFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={showArchivedFilter === "archived" ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowArchivedFilter("archived")}
            >
              Archived
            </Button>
            <Button
              variant={showArchivedFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowArchivedFilter("all")}
            >
              All
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={loadRequests}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {showArchivedFilter === "active"
              ? "No active tour requests"
              : showArchivedFilter === "archived"
              ? "No archived requests"
              : "No tour requests yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {request.customerName}
                    </h3>
                    <Badge className={getStatusBadgeColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <div className="mb-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-medium">{request.tourTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${request.email}`}
                        className="hover:text-primary"
                      >
                        {request.email}
                      </a>
                    </div>
                    {request.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a
                          href={`tel:${request.phone}`}
                          className="hover:text-primary"
                        >
                          {request.phone}
                        </a>
                      </div>
                    )}
                    {request.preferredDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(request.preferredDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {request.numberOfPeople && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{request.numberOfPeople} people</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {request.message && (
                    <div className="mb-2 rounded-md bg-secondary/50 p-3">
                      <p className="text-sm text-muted-foreground">
                        "{request.message}"
                      </p>
                    </div>
                  )}
                  {request.adminNotes && (
                    <div className="rounded-md border-l-4 border-primary bg-primary/5 p-2">
                      <p className="text-xs text-muted-foreground">
                        <strong>Notes:</strong> {request.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRequestDetails(request)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, "contacted")}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {(request.status === "pending" || request.status === "contacted") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, "confirmed")}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  {request.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, "cancelled")}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tour Request Details</DialogTitle>
            <DialogDescription>
              View and manage this tour request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p className="text-foreground">{selectedRequest.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusBadgeColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-primary hover:underline"
                  >
                    {selectedRequest.email}
                  </a>
                </div>
                {selectedRequest.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${selectedRequest.phone}`}
                      className="text-primary hover:underline"
                    >
                      {selectedRequest.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tour</p>
                  <p className="text-foreground">{selectedRequest.tourTitle}</p>
                </div>
                {selectedRequest.preferredDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Preferred Date</p>
                    <p className="text-foreground">
                      {new Date(selectedRequest.preferredDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedRequest.numberOfPeople && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Number of People</p>
                    <p className="text-foreground">{selectedRequest.numberOfPeople}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested</p>
                  <p className="text-foreground">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedRequest.message && (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Customer Message</p>
                  <div className="rounded-md bg-secondary/50 p-3">
                    <p className="text-sm">{selectedRequest.message}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this request..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveAdminNotes(selectedRequest.id)}
                  className="flex-1"
                >
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminNotes("");
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
