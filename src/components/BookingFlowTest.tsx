import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function BookingFlowTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Fetch all bookings
      console.log("🔍 Test 1: Fetching all bookings...");
      const bookingsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const bookingsData = await bookingsResponse.json();
      diagnostics.tests.fetchBookings = {
        success: bookingsResponse.ok && bookingsData.success,
        count: bookingsData.bookings?.length || 0,
        sample: bookingsData.bookings?.[0] || null,
      };
      console.log("✅ Test 1 complete:", diagnostics.tests.fetchBookings);

      // Test 2: Check if latest booking has QR codes
      if (bookingsData.bookings && bookingsData.bookings.length > 0) {
        const latestBooking = bookingsData.bookings[bookingsData.bookings.length - 1];
        diagnostics.tests.qrCodesPresent = {
          success: !!latestBooking.qrCodes && latestBooking.qrCodes.length > 0,
          bookingId: latestBooking.id,
          qrCodeCount: latestBooking.qrCodes?.length || 0,
          passengersCount: latestBooking.passengers?.length || 0,
        };
        console.log("✅ Test 2 complete:", diagnostics.tests.qrCodesPresent);

        // Test 3: Try to fetch specific booking
        const specificResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings/${latestBooking.id}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const specificData = await specificResponse.json();
        diagnostics.tests.fetchSpecificBooking = {
          success: specificResponse.ok && specificData.success,
          found: !!specificData.booking,
        };
        console.log("✅ Test 3 complete:", diagnostics.tests.fetchSpecificBooking);
      }

      // Test 4: Check pricing endpoint
      const pricingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const pricingData = await pricingResponse.json();
      diagnostics.tests.pricing = {
        success: pricingResponse.ok && pricingData.success,
        configured: !!pricingData.pricing,
      };
      console.log("✅ Test 4 complete:", diagnostics.tests.pricing);

    } catch (error) {
      console.error("❌ Diagnostic error:", error);
      diagnostics.error = error instanceof Error ? error.message : String(error);
    }

    setResults(diagnostics);
    setTesting(false);
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl mb-2">Booking System Diagnostics</h2>
        <p className="text-sm text-muted-foreground">
          Test if bookings are being created and displayed correctly
        </p>
      </div>

      <Button
        onClick={runDiagnostics}
        disabled={testing}
        className="mb-4"
      >
        {testing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Tests...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Diagnostics
          </>
        )}
      </Button>

      {results && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Last run: {new Date(results.timestamp).toLocaleString()}
          </div>

          {Object.entries(results.tests || {}).map(([key, value]: [string, any]) => (
            <Card key={key} className="p-3">
              <div className="flex items-start gap-2">
                {value.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-sm mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <pre className="text-xs bg-secondary/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              </div>
            </Card>
          ))}

          {results.error && (
            <Card className="p-3 border-red-200 bg-red-50">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="text-sm mb-1">Error</div>
                  <div className="text-xs text-red-900">{results.error}</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
}
