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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src && unsplashQuery) {
      // Fetch from Unsplash API
      fetch(
        `https://source.unsplash.com/1600x900/?${encodeURIComponent(unsplashQuery)}`,
      )
        .then((response) => {
          setImgSrc(response.url);
          setIsLoading(false);
        })
        .catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      setImgSrc(src);
      setIsLoading(false);
    }
  }, [src, unsplashQuery]);

  if (isLoading) {
    return (
      <div
        className={props.className}
        style={{ backgroundColor: "#f0f0f0" }}
      />
    );
  }

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