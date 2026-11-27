"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FileVideo } from "lucide-react";

interface SmartThumbnailProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  className?: string;
  fallbackIconClassName?: string;
}

const MAX_YT_THUMB_RETRIES = 15;
const YT_RETRY_DELAY_MS = 3000;

function isYouTubeThumbnailUrl(url: string): boolean {
  return url.includes("i.ytimg.com/vi/") || url.includes("img.youtube.com/vi/");
}

function appendCacheBust(url: string, attempt: number, nonce: number): string {
  if (attempt === 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}yt_retry=${attempt}_${nonce}`;
}

function SmartThumbnailInner({
  src,
  fallbackSrc,
  alt,
  sizes,
  priority = false,
  loading,
  className = "object-cover",
  fallbackIconClassName = "w-8 h-8",
}: SmartThumbnailProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [retryState, setRetryState] = useState<{
    attempt: number;
    nonce: number;
    waitingForRetry: boolean;
  }>({ attempt: 0, nonce: 0, waitingForRetry: false });

  useEffect(() => {
    if (!retryState.waitingForRetry) return;
    const timer = setTimeout(() => {
      setRetryState((prev) => ({
        attempt: prev.attempt + 1,
        nonce: Date.now(),
        waitingForRetry: false,
      }));
    }, YT_RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [retryState.waitingForRetry]);

  const effectivePrimarySrc = src
    ? appendCacheBust(src, retryState.attempt, retryState.nonce)
    : null;

  if (!effectivePrimarySrc || failed) {
    if (fallbackSrc) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className}`}
        />
      );
    }
    return (
      <div className="w-full h-full bg-zinc-900/90 flex items-center justify-center text-zinc-500">
        <FileVideo className={fallbackIconClassName} aria-hidden="true" />
      </div>
    );
  }

  const isLoaded = loadedUrl === effectivePrimarySrc;
  const resolvedLoading = priority ? "eager" : loading;

  const scheduleYouTubeRetry = () => {
    if (
      src &&
      isYouTubeThumbnailUrl(src) &&
      retryState.attempt < MAX_YT_THUMB_RETRIES
    ) {
      setRetryState((prev) =>
        prev.waitingForRetry ? prev : { ...prev, waitingForRetry: true }
      );
      return true;
    }
    return false;
  };

  return (
    <>
      {!isLoaded && fallbackSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className}`}
        />
      )}
      {!isLoaded && !fallbackSrc && (
        <div
          aria-hidden="true"
          className="absolute inset-0 studio-skeleton rounded-none"
        />
      )}
      {!retryState.waitingForRetry && (
        <Image
          src={effectivePrimarySrc}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          loading={resolvedLoading}
          fetchPriority={priority ? "high" : undefined}
          onLoad={(e) => {
            const img = e.currentTarget;
            // YouTube returns a 120x90 gray placeholder while still generating thumbnails
            if (
              src &&
              isYouTubeThumbnailUrl(src) &&
              img.naturalWidth <= 120 &&
              img.naturalHeight <= 90
            ) {
              if (scheduleYouTubeRetry()) {
                return;
              }
              if (fallbackSrc) {
                setFailed(true);
                return;
              }
            }
            setLoadedUrl(effectivePrimarySrc);
          }}
          onError={() => {
            if (!scheduleYouTubeRetry()) {
              setFailed(true);
            }
          }}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </>
  );
}

/**
 * Thumbnail image with shimmer skeleton while loading, instant local-frame fallback,
 * and automatic polling when YouTube is still generating the remote thumbnail.
 */
export default function SmartThumbnail(props: SmartThumbnailProps) {
  return <SmartThumbnailInner key={props.src || ""} {...props} />;
}
