import { motion } from "motion/react";

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
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]"
            initial={{ width: "0%" }}
            animate={{ 
              width: ["0%", "70%", "90%"],
              backgroundPosition: ["0% 0%", "100% 0%", "200% 0%"]
            }}
            transition={{ 
              width: { duration: 2, ease: "easeInOut" },
              backgroundPosition: { duration: 1.5, repeat: Infinity, ease: "linear" }
            }}
          />
        </div>

        {/* Spinner (if both) */}
        {type === "both" && fullScreen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              {/* Animated Logo/Icon */}
              <motion.div
                className="relative"
                animate={{ 
                  rotate: 360,
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary" />
              </motion.div>

              {/* Loading Text */}
              <motion.div
                className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-primary">Loading</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
                >
                  .
                </motion.span>
              </motion.div>
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
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-accent/20 border-b-accent"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Center dot */}
            <motion.div
              className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-primary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          {/* Loading Text */}
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-primary">Loading</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
            >
              .
            </motion.span>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}

// Smaller inline spinner for component-level loading
export function SmallSpinner({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`h-5 w-5 rounded-full border-2 border-primary/20 border-t-primary ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}
