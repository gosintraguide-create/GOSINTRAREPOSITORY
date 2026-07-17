import { useState, useEffect } from "react";

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  unsplashQuery?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  unsplashQuery: _unsplashQuery, // kept in props signature for back-compat but no longer fetched
  loading = "lazy",
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError || !imgSrc) {
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
      loading={loading}
      decoding="async"
      onError={handleError}
    />
  );
}
