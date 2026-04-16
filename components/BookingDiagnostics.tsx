import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

export function BookingDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [searchId, setSearchId] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Step 1: Check what keys exist
      const keysResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/debug-booking-keys`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const keysData = await keysResponse.json();

      // Step 2: Try to fetch bookings normally
      const bookingsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const bookingsData = await bookingsResponse.json();

      setResults({
        keys: keysData,
        bookings: bookingsData,
        diagnosis: diagnose(keysData, bookingsData),
      });
    } catch (error) {
      console.error("Diagnostic error:", error);
      setResults({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const diagnose = (keysData: any, bookingsData: any) => {
    if (!keysData.success || !bookingsData.success) {
      return {
        status: "error",
        message: "API calls failed",
        details: [keysData.error || bookingsData.error],
      };
    }

    const hasBookingKeys = keysData.totalBookingKeys > 0;
    const hasUsedPrefixes = keysData.usedPrefixes && keysData.usedPrefixes.length > 0;
    const adminSeesBookings = bookingsData.bookings && bookingsData.bookings.length > 0;

    if (!hasBookingKeys) {
      return {
        status: "error",
        message: "❌ No bookings exist in database",
        details: [
          "No booking keys found in database",
          "Try creating a test booking to see if it saves properly",
        ],
      };
    }

    if (!hasUsedPrefixes) {
      return {
        status: "warning",
        message: "⚠️ Bookings exist but prefix tracking is broken",
        details: [
          `Found ${keysData.totalBookingKeys} booking(s) in database`,
          "But 'booking_used_prefixes' key is empty or missing",
          "This is why the admin panel doesn't show bookings",
          "Solution: Re-save the bookings or manually populate the prefix list",
        ],
        bookingKeys: keysData.bookingKeys,
      };
    }

    if (!adminSeesBookings) {
      return {
        status: "warning",
        message: "⚠️ Bookings exist but admin query returns empty",
        details: [
          `Found ${keysData.totalBookingKeys} booking(s) in database`,
          `Tracked prefixes: ${keysData.usedPrefixes.join(", ")}`,
          "But /bookings endpoint returns no results",
          "Possible issue with getByPrefix query",
        ],
        bookingKeys: keysData.bookingKeys,
        usedPrefixes: keysData.usedPrefixes,
      };
    }

    return {
      status: "success",
      message: "✅ Everything working correctly!",
      details: [
        `Found ${keysData.totalBookingKeys} booking(s) in database`,
        `Admin sees ${bookingsData.bookings.length} booking(s)`,
        `Tracked prefixes: ${keysData.usedPrefixes.join(", ")}`,
      ],
    };
  };

  const searchBooking = async () => {
    setSearchLoading(true);
    setSearchResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/direct-lookup/${searchId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();

      if (data.found) {
        setSearchResult(data.booking);
        toast.success(`✅ Found booking: ${searchId}`);
      } else {
        setSearchResult({ error: data.message || "Booking not found" });
        toast.error(`❌ ${data.message || "Booking not found"}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult({ error: error instanceof Error ? error.message : String(error) });
      toast.error("❌ Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Booking System Diagnostics
            </h3>
            <p className="text-sm text-muted-foreground">
              This tool checks why bookings aren't appearing in the admin panel.
            </p>
          </div>

          <Button
            onClick={runDiagnostic}
            disabled={loading}
            className="w-full"
          >
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Running Diagnostics..." : "Run Diagnostic Check"}
          </Button>

          {results && (
            <div className="mt-6 space-y-4">
              {results.error ? (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {results.error}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Diagnosis Result */}
                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg border ${
                      results.diagnosis.status === "success"
                        ? "bg-green-50 border-green-200"
                        : results.diagnosis.status === "warning"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {results.diagnosis.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle
                        className={`h-5 w-5 mt-0.5 ${
                          results.diagnosis.status === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          results.diagnosis.status === "success"
                            ? "text-green-900"
                            : results.diagnosis.status === "warning"
                            ? "text-yellow-900"
                            : "text-red-900"
                        }`}
                      >
                        {results.diagnosis.message}
                      </p>
                      <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                        {results.diagnosis.details.map(
                          (detail: string, i: number) => (
                            <li key={i}>• {detail}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Detailed Data */}
                  <details className="border rounded-lg p-4">
                    <summary className="font-medium cursor-pointer text-sm">
                      View Raw Data
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Database Keys ({results.keys.totalBookingKeys})
                        </h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(results.keys.bookingKeys, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Used Prefixes
                        </h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(results.keys.usedPrefixes, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Sample Bookings
                        </h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(results.keys.sampleBookings, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Admin Bookings Response (
                          {results.bookings.bookings?.length || 0})
                        </h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                          {JSON.stringify(
                            results.bookings.bookings?.slice(0, 3),
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  </details>
                </>
              )}
            </div>
          )}

          <div className="mt-6">
            <Label htmlFor="searchId">Search Booking by ID</Label>
            <div className="flex items-center">
              <Input
                id="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full"
                placeholder="Enter booking ID"
              />
              <Button
                onClick={searchBooking}
                disabled={searchLoading}
                className="ml-2"
              >
                {searchLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                {searchLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResult && (
              <div className="mt-4">
                {searchResult.error ? (
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-destructive">Error</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {searchResult.error}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Booking Found</p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64">
                        {JSON.stringify(searchResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}