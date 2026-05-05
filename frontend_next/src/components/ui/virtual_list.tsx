/**
 * virtual_list.tsx
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Virtual scrolling list component for performance optimization
 */

"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  containerHeight?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  renderItem,
  className = "",
  containerHeight = 0,
  getItemKey,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  const getTotalHeight = useCallback((): number => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getHeight(i);
    }
    return total;
  }, [items.length, getHeight]);

  const getStartIndex = useCallback((): number => {
    let accumulatedHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const height = getHeight(i);

      if (accumulatedHeight + height > scrollTop - overscan * (typeof itemHeight === "number" ? itemHeight : 50)) {
        return Math.max(0, i - 1);
      }

      accumulatedHeight += height;
    }

    return Math.max(0, items.length - 1);
  }, [scrollTop, overscan, items.length, getHeight, itemHeight]);

  const getEndIndex = useCallback(
    (startIndex: number): number => {
      let accumulatedHeight = 0;
      const visibleHeight = containerRef.current?.clientHeight || window.innerHeight;

      for (let i = startIndex; i < items.length; i++) {
        accumulatedHeight += getHeight(i);

        if (accumulatedHeight > visibleHeight + overscan * (typeof itemHeight === "number" ? itemHeight : 50)) {
          return i + 1;
        }
      }

      return items.length;
    },
    [items.length, getHeight, overscan, itemHeight]
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const startIndex = getStartIndex();
  const endIndex = getEndIndex(startIndex);
  const visibleItems = items.slice(startIndex, endIndex);

  const offsetY = (() => {
    let offset = 0;
    for (let i = 0; i < startIndex; i++) {
      offset += getHeight(i);
    }
    return offset;
  })();

  const totalHeight = getTotalHeight();

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto overflow-x-hidden ${className}`}
      style={{ height: containerHeight || "100%" }}
      role="list"
      aria-label="Virtual scrollable list"
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;

            return (
              <div
                key={key}
                style={{
                  height: getHeight(actualIndex),
                  minHeight: getHeight(actualIndex),
                }}
                role="listitem"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface LazyLoadProps {
  children: ReactNode;
  rootMargin?: string;
  threshold?: number;
  placeholder?: ReactNode;
  fallback?: ReactNode;
}

export function LazyLoad({
  children,
  rootMargin = "200px",
  threshold = 0.1,
  placeholder = null,
  fallback = null,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  if (!isVisible) {
    return (
      <div ref={elementRef} aria-busy="true">
        {placeholder || (
          <div className="flex items-center justify-center p-4 animate-pulse bg-muted/30 rounded-lg">
            <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={elementRef} onError={() => setHasError(true)}>
      {children}
    </div>
  );
}
