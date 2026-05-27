 
/**
 * mobile_components.tsx
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Mobile-optimized components with responsive behavior
 */

"use client";

import { type ReactNode } from "react";
import { useResponsive } from "@/hooks/use_responsive";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className = "" }: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div
      className={`responsive-container ${isMobile ? "mobile" : isTablet ? "tablet" : "desktop"} ${className}`}
    >
      {children}
      <style jsx>{`
        .responsive-container {
          width: 100%;
          min-height: 100vh;
        }

        .responsive-container.mobile {
          padding: 0.5rem;
        }

        .responsive-container.tablet {
          padding: 1rem;
        }

        .responsive-container.desktop {
          padding: 1.5rem;
        }
      `}</style>
    </div>
  );
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: "left" | "right" | "bottom";
  title?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  children,
  position = "left",
  title,
}: MobileDrawerProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return <>{children}</>;
  }

  const positionClasses = {
    left: "inset-y-0 left-0 translate-x-full",
    right: "inset-y-0 right-0 translate-x-full",
    bottom: "inset-x-0 bottom-0 translate-y-full",
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed z-50 bg-background shadow-xl transition-transform duration-300 ease-in-out ${
          positionClasses[position]
        } ${isOpen ? (position === "bottom" ? "translate-y-0" : "translate-x-0") : ""} ${
          position === "bottom" ? "h-[80vh] rounded-t-2xl" : "w-80"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>
        )}
        <div className="overflow-y-auto h-full p-4">{children}</div>
      </div>
    </>
  );
}

interface MobileBottomSheetProps {
  isVisible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
}

export function MobileBottomSheet({
  isVisible,
  onDismiss,
  children,
  title,
  snapPoints = [25, 50, 90],
}: MobileBottomSheetProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <>
      {isVisible && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={onDismiss}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {title && (
              <div className="px-4 pb-3 border-b">
                <h3 className="font-semibold text-base">{title}</h3>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

interface TouchFeedbackProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TouchFeedback({ children, onClick, disabled, className = "" }: TouchFeedbackProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return (
      <div onClick={onClick} className={className} role={onClick ? "button" : undefined}>
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`${className} active:scale-95 transition-transform duration-150 ${disabled ? "opacity-50 pointer-events-none" : "active:bg-primary/5 cursor-pointer"}`}
      role={onClick && !disabled ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface SafeAreaInsetsProps {
  children: ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

export function SafeAreaInsets({
  children,
  top = true,
  bottom = true,
  left = false,
  right = false,
  className = "",
}: SafeAreaInsetsProps) {
  return (
    <div
      className={className}
      style={{
        paddingTop: top ? "env(safe-area-inset-top)" : undefined,
        paddingBottom: bottom ? "env(safe-area-inset-bottom)" : undefined,
        paddingLeft: left ? "env(safe-area-inset-left)" : undefined,
        paddingRight: right ? "env(safe-area-inset-right)" : undefined,
      }}
    >
      {children}
    </div>
  );
}
