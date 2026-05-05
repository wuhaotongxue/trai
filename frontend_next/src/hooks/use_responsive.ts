/**
 * 文件名: hooks/use_responsive.ts
 * 作者: wuhao
 * 日期: 2026-05-04 20:45:00
 * 描述: 响应式设计Hook, 检测移动端/平板/桌面设备
 */

"use client";

import { useState, useEffect } from "react";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type DeviceType = "mobile" | "tablet" | "desktop";

interface BreakpointConfig {
  min: number;
  max: number;
}

const BREAKPOINTS: Record<Breakpoint, BreakpointConfig> = {
  xs: { min: 0, max: 475 },
  sm: { min: 476, max: 640 },
  md: { min: 641, max: 768 },
  lg: { min: 769, max: 1024 },
  xl: { min: 1025, max: 1280 },
  "2xl": { min: 1281, max: Infinity },
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const getBreakpoint = (): Breakpoint => {
    const { width } = windowSize;

    if (width <= BREAKPOINTS.xs.max) return "xs";
    if (width <= BREAKPOINTS.sm.max) return "sm";
    if (width <= BREAKPOINTS.md.max) return "md";
    if (width <= BREAKPOINTS.lg.max) return "lg";
    if (width <= BREAKPOINTS.xl.max) return "xl";
    return "2xl";
  };

  const getDeviceType = (): DeviceType => {
    const breakpoint = getBreakpoint();
    if (breakpoint === "xs" || breakpoint === "sm") return "mobile";
    if (breakpoint === "md" || breakpoint === "lg") return "tablet";
    return "desktop";
  };

  const isMobile = getDeviceType() === "mobile";
  const isTablet = getDeviceType() === "tablet";
  const isDesktop = getDeviceType() === "desktop";

  const isPortrait = windowSize.width < windowSize.height;
  const isLandscape = !isPortrait;

  return {
    width: windowSize.width,
    height: windowSize.height,
    breakpoint: getBreakpoint(),
    deviceType: getDeviceType(),
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    isSmallScreen: windowSize.width < 768,
    isMediumScreen: windowSize.width >= 768 && windowSize.width < 1024,
    isLargeScreen: windowSize.width >= 1024,
  };
}
