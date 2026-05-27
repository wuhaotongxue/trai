/**
 * 文件名: switch.tsx
 * 作者: wuhao
 * 日期: 2026-05-12
 * 描述: Switch 开关组件
 */
import * as React from "react"
import { Switch } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

const SwitchComponent = React.forwardRef<
  React.ElementRef<typeof Switch.Root>,
  React.ComponentPropsWithoutRef<typeof Switch.Root>
>(({ className, ...props }, ref) => (
  <Switch.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-none border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <Switch.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-none bg-background shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] ring-0 transition-transform data-[checked]:translate-x-4 data-[unchecked]:translate-x-0"
      )}
    />
  </Switch.Root>
))
SwitchComponent.displayName = Switch.Root.displayName

export { SwitchComponent as Switch }
