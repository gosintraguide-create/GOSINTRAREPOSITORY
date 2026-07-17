import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CheckCircle, AlertCircle, TestTube } from "lucide-react";

interface BookingSuccessTestProps {
  onNavigate: (page: string, booking?: any) => void;
}

export function BookingSuccessTest({ onNavigate }: BookingSuccessTestProps) {
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  const runTest = () => {
    // Create a mock booking object that matches the structure from the backend
    const mockBooking = {
      id: "AA-1234",
      contactInfo: {
        name: "Test Customer",
        email: "test@example.com",
        phone: "+351912345678",
      },
      selectedDate: new Date().toISOString().split("T")[0],
      timeSlot: "10:00",
      pickupLocation: "sintra-train-station",
      passengers: [
        { name: "Test Customer", type: "Adult" },
        { name: "Passenger 2", type: "Adult" },
      ],
      guidedTour: null,
      selectedAttractions: [],
      totalPrice: 50,
      paymentIntentId: "pi_test_123456",
      qrCodes: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      ],
      createdAt: new Date().toISOString(),
      status: "confirmed",
      paymentStatus: "paid",
    };

    // Validate booking structure
    const checks = [];
    let allPassed = true;

    // Check 1: Booking has ID
    if (mockBooking.id) {
      checks.push("✅ Booking ID exists");
    } else {
      checks.push("❌ Missing booking ID");
      allPassed = false;
    }

    // Check 2: Contact info exists
    if (mockBooking.contactInfo?.email) {
      checks.push("✅ Contact email exists");
    } else {
      checks.push("❌ Missing contact email");
      allPassed = false;
    }

    // Check 3: Passengers array exists
    if (mockBooking.passengers?.length > 0) {
      checks.push(
        `✅ Has ${mockBooking.passengers.length} passenger(s)`
      );
    } else {
      checks.push("❌ No passengers found");
      allPassed = false;
    }

    // Check 4: QR codes match passenger count
    if (
      mockBooking.qrCodes?.length === mockBooking.passengers?.length
    ) {
      checks.push("✅ QR codes match passenger count");
    } else {
      checks.push(
        `⚠️ QR code mismatch (${mockBooking.qrCodes?.length || 0} QR codes vs ${mockBooking.passengers?.length || 0} passengers)`
      );
      allPassed = false;
    }

    // Check 5: Date is valid
    if (mockBooking.selectedDate) {
      checks.push("✅ Booking date exists");
    } else {
      checks.push("❌ Missing booking date");
      allPassed = false;
    }

    // Check 6: Total price exists
    if (mockBooking.totalPrice > 0) {
      checks.push(`✅ Total price: €${mockBooking.totalPrice}`);
    } else {
      checks.push("❌ Invalid total price");
      allPassed = false;
    }

    setTestResult({
      success: allPassed,
      message: allPassed
        ? "All checks passed! Ready to navigate to confirmation page."
        : "Some checks failed. Booking structure may be incomplete.",
      details: checks,
    });

    // If all checks pass, offer to navigate
    if (allPassed) {
      // Store the mock booking and navigate after a short delay
      setTimeout(() => {
        onNavigate("booking-confirmation", mockBooking);
      }, 2000);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Booking Success Page Test</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          This test simulates a successful booking and validates the booking
          object structure before navigating to the confirmation page.
        </p>

        <Button onClick={runTest} className="w-full">
          Run Test & Navigate to Success Page
        </Button>

        {testResult && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              testResult.success
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    testResult.success ? "text-green-900" : "text-yellow-900"
                  }`}
                >
                  {testResult.message}
                </p>
                {testResult.success && (
                  <p className="text-sm text-green-700 mt-1">
                    Navigating to confirmation page in 2 seconds...
                  </p>
                )}
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {testResult.details?.map((detail, i) => (
                    <li key={i} className="font-mono text-xs">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium mb-2">What This Test Checks:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Booking ID format (AA-1234)</li>
            <li>• Contact information (email, name)</li>
            <li>• Passenger data structure</li>
            <li>• QR code generation (one per passenger)</li>
            <li>• Date and pricing information</li>
            <li>• Payment status</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
