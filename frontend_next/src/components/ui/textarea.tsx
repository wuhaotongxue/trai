/**
 * 文件名: textarea.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 20:10:00
 * 描述: Reusable textarea component for form pages and public exam answers
 */
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a styled textarea aligned with the existing input component system.
 * @param props - Native textarea props and optional className.
 * @returns Styled textarea element.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-28 w-full rounded-none border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
