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
  unsplashQuery,
  loading = "lazy",
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (!src && unsplashQuery) {
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
      setImgSrc(src);
    }
  }, [src, unsplashQuery]);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      // Try the fallback image before giving up
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

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
      loading={loading}
      onError={handleError}
    />
  );
}
