import { QRCodeSVG } from "qrcode.react";

interface TicketCardProps {
  bookingId: string;
  passengerName: string;
  passengerType: string;
  date: string;
  timeSlot: string;
  qrCode: string;
  totalPrice?: number;
  passengerNumber?: number;
  totalPassengers?: number;
}

export function TicketCard({
  bookingId,
  passengerName,
  passengerType,
  date,
  timeSlot,
  qrCode,
  totalPrice,
  passengerNumber,
  totalPassengers,
}: TicketCardProps) {
  // Format date nicely
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Ticket Container with perforated edges */}
      <div className="relative flex overflow-hidden rounded-lg shadow-xl">
        {/* Left side notches */}
        <div className="absolute left-0 top-0 h-full w-6 flex flex-col justify-around -ml-3 z-10">
          <div className="w-6 h-6 rounded-full bg-background" />
          <div className="w-6 h-6 rounded-full bg-background" />
          <div className="w-6 h-6 rounded-full bg-background" />
          <div className="w-6 h-6 rounded-full bg-background" />
        </div>

        {/* Right side notches */}
        <div className="absolute right-0 top-0 h-full w-6 flex flex-col justify-around -mr-3 z-10">
          <div className="w-6 h-6 rounded-full bg-background" />
          <div className="w-6 h-6 rounded-full bg-background" />
          <div className="w-6 h-6 rounded-full bg-background" />
          <div className="w-6 h-6 rounded-full bg-background" />
        </div>

        {/* Main Ticket Section */}
        <div className="flex-1 bg-[#FFF8F0] border border-[#DDD0C0]">
          {/* Header */}
          <div className="bg-accent px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[#FFF8F0] tracking-wider">DAY PASS</span>
            </div>
            <div className="text-[#FFF8F0] text-sm border border-[#FFF8F0]/30 px-3 py-1 rounded">
              {bookingId}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Passenger Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Name of Passenger
                </div>
                <div className="text-foreground uppercase tracking-wide">
                  {passengerName}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Ticket Type
                </div>
                <div className="text-foreground uppercase tracking-wide">
                  {passengerType}
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Service Area
                </div>
                <div className="text-foreground uppercase tracking-wide">
                  SINTRA
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Coverage
                </div>
                <div className="text-foreground uppercase tracking-wide">
                  ALL ROUTES
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#DDD0C0]">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Date
                </div>
                <div className="text-foreground tracking-wide">
                  {formattedDate}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Start Time
                </div>
                <div className="text-foreground tracking-wide">{timeSlot}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Valid Until
                </div>
                <div className="text-foreground tracking-wide">20:00</div>
              </div>
            </div>

            {/* Price */}
            {totalPrice && (
              <div className="pt-2 border-t border-[#DDD0C0]">
                <div className="bg-accent/10 px-4 py-2 rounded flex justify-between items-center">
                  <span className="text-sm uppercase tracking-wide text-muted-foreground">
                    Total Price
                  </span>
                  <span className="text-accent tracking-wider">
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Perforation Line */}
        <div className="relative w-px bg-transparent">
          {/* Dashed line */}
          <div className="absolute inset-0 flex flex-col justify-around">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-2 w-px bg-[#DDD0C0]" />
            ))}
          </div>
        </div>

        {/* Stub Section */}
        <div className="w-48 bg-[#FFF8F0] border-t border-r border-b border-[#DDD0C0]">
          {/* Stub Header */}
          <div className="bg-accent px-4 py-3">
            <span className="text-[#FFF8F0] text-sm tracking-wider">
              DAY PASS
            </span>
          </div>

          {/* Stub Body */}
          <div className="p-4 space-y-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Passenger
              </div>
              <div className="text-sm uppercase tracking-wide truncate">
                {passengerName.split(" ")[0]}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Service
              </div>
              <div className="text-sm uppercase tracking-wide">SINTRA</div>
            </div>

            {/* QR Code */}
            <div className="pt-2 border-t border-[#DDD0C0]">
              <div className="bg-white p-2 rounded flex items-center justify-center">
                {qrCode.startsWith('data:image') ? (
                  // If qrCode is already a data URL (base64 image), display it directly
                  <img src={qrCode} alt="QR Code" className="w-[100px] h-[100px]" />
                ) : (
                  // Otherwise, generate QR code from the data string
                  <QRCodeSVG value={qrCode} size={100} level="H" />
                )}
              </div>
              <div className="text-[10px] text-center text-muted-foreground mt-2">
                Scan to validate
              </div>
            </div>

            {/* Date */}
            <div className="text-xs text-center pt-2 border-t border-[#DDD0C0]">
              <div className="text-muted-foreground uppercase tracking-wide mb-1">
                Date
              </div>
              <div className="text-foreground tracking-wide">
                {formattedDate}
              </div>
            </div>

            {/* Booking ID */}
            <div className="text-[10px] text-center text-muted-foreground">
              {bookingId}
            </div>
          </div>
        </div>
      </div>

      {/* Passenger count badge (if multiple) */}
      {passengerNumber && totalPassengers && totalPassengers > 1 && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-4 border-background z-20">
          <div className="text-center">
            <div className="text-xs leading-none">{passengerNumber}</div>
            <div className="text-[10px] leading-none">of {totalPassengers}</div>
          </div>
        </div>
      )}
    </div>
  );
}
