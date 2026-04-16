/**
 * LoadingIndicator - Animated loading component with Hop On Sintra branding
 * 
 * Usage:
 * - Full page load: <LoadingIndicator type="both" fullScreen />
 * - Page transitions: <LoadingIndicator type="spinner" fullScreen />
 * - Top bar only: <LoadingIndicator type="bar" fullScreen={false} />
 * - Inline loading: <SmallSpinner />
 * 
 * Features:
 * - Animated progress bar with gradient
 * - Dual-ring spinner with brand colors
 * - Pulsing center dot
 * - Animated loading text with dots
 */

interface LoadingIndicatorProps {
  type?: "spinner" | "bar" | "both";
  fullScreen?: boolean;
}

export function LoadingIndicator({ type = "both", fullScreen = true }: LoadingIndicatorProps) {
  if (type === "bar" || type === "both") {
    return (
      <>
        {/* Top Loading Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[progress_2s_ease-in-out_forwards,shimmer_1.5s_linear_infinite]"
            style={{ width: "0%", animation: "progress 2s ease-in-out forwards, shimmer 1.5s linear infinite" }}
          />
        </div>

        {/* Spinner (if both) */}
        {type === "both" && fullScreen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              {/* Animated Logo/Icon */}
              <div className="relative animate-spin" style={{ animationDuration: "2s" }}>
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary" />
              </div>

              {/* Loading Text */}
              <div className="flex gap-1 animate-[fadeIn_0.3s_ease-in]">
                <span className="text-primary">Loading</span>
                <span className="animate-[blink_1.5s_infinite]">.</span>
                <span className="animate-[blink_1.5s_infinite_0.2s]" style={{ animationDelay: "0.2s" }}>.</span>
                <span className="animate-[blink_1.5s_infinite_0.4s]" style={{ animationDelay: "0.4s" }}>.</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (type === "spinner") {
    return (
      <div className={fullScreen ? "fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm" : "flex items-center justify-center p-8"}>
        <div className="flex flex-col items-center gap-4">
          {/* Hop On Sintra Themed Spinner */}
          <div className="relative h-16 w-16">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
              style={{ animationDuration: "1.5s" }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-2 rounded-full border-4 border-accent/20 border-b-accent animate-[spin_2s_linear_infinite_reverse]"
            />
            {/* Center dot */}
            <div
              className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-primary animate-pulse"
            />
          </div>

          {/* Loading Text */}
          <div className="flex gap-1 animate-[fadeIn_0.3s_ease-in]">
            <span className="text-primary">Loading</span>
            <span className="animate-[blink_1.5s_infinite]">.</span>
            <span className="animate-[blink_1.5s_infinite]" style={{ animationDelay: "0.2s" }}>.</span>
            <span className="animate-[blink_1.5s_infinite]" style={{ animationDelay: "0.4s" }}>.</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Smaller inline spinner for component-level loading
export function SmallSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin ${className}`}
    />
  );
}
