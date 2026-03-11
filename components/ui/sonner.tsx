"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { useIsStandalone } from "@/hooks/use-standalone";
import { cn } from "@/lib/utils";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useIsMobile();
  const isStandalone = useIsStandalone() === true;

  const position = isMobile ? "bottom-center" : "top-center";

  const mobileOffset = isMobile
    ? {
        bottom: isStandalone
          ? "calc(env(safe-area-inset-bottom) + 16px)"
          : "calc(env(safe-area-inset-bottom) + 64px)",
      }
    : props.mobileOffset;

  return (
    <Sonner
      {...props}
      theme={theme as ToasterProps["theme"]}
      position={position}
      mobileOffset={mobileOffset}
      className={cn("toaster group", props.className)}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        ...props.icons,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          ...props.style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...props.toastOptions,
        classNames: {
          ...props.toastOptions?.classNames,
          toast: cn("cn-toast", props.toastOptions?.classNames?.toast),
        },
      }}
    />
  );
};

export { Toaster };
