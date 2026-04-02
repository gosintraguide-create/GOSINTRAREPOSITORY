import { useState, useEffect } from "react";

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  unsplashQuery?: string;
}

export function ImageWithFallback({
  src,
  alt,
  unsplashQuery,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when src changes
    setHasError(false);

    if (!src && unsplashQuery) {
      // Fetch from Unsplash API
      fetch(
        `https://source.unsplash.com/1600x900/?${encodeURIComponent(unsplashQuery)}`,
      )
        .then((response) => {
          setImgSrc(response.url);
        })
        .catch(() => {
          setHasError(true);
        });
    } else {
      // Use the src directly - no loading state to prevent flashing
      setImgSrc(src);
    }
  }, [src, unsplashQuery]);

  if (hasError) {
    return (
      <div
        className={props.className}
        style={{ backgroundColor: "#e0e0e0" }}
      />
    );
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}