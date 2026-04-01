"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReaderStore } from "@/store/readerStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  className?: string;
  /** 
   * Custom width for the desktop sidebar. 
   * @default "350px"
   */
  desktopWidth?: string;
}

/**
 * SidebarLayout - A reusable layout for splitting content with a right-side panel.
 * 
 * Behavior:
 * - Desktop: Two columns. Main on left, Sidebar on right (350px).
 * - Mobile: Continuous main content with a 35% height split-view at the bottom when sidebar is toggled.
 * 
 * @example
 * <SidebarLayout sidebarContent={<MySidebar />}>
 *   <MyHeader />
 *   <main>My Content</main>
 * </SidebarLayout>
 */
export function SidebarLayout({
  children,
  sidebarContent,
  className,
  desktopWidth = "350px",
}: SidebarLayoutProps) {
  const isSidebarOpen = useReaderStore((s) => s.isSidebarOpen);
  const isMobile = useIsMobile();

  // Desktop Rendering: Side-by-side split
  if (!isMobile) {
    return (
      <div className={cn("flex h-screen w-full bg-background overflow-hidden", className)}>
        {/* Left Side: Main Column (Header + Area) */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          {children}
        </div>

        {/* Right Side: Dedicated Sidebar Column */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && sidebarContent && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: desktopWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300, opacity: { duration: 0.1 } }}
              className="h-full border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 overflow-hidden flex-shrink-0"
            >
              <div style={{ width: desktopWidth }} className="h-full p-6 overflow-y-auto no-scrollbar">
                {sidebarContent}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Mobile Rendering: Bottom Split-View (Main 65% / Sidebar 35%)
  return (
    <div className={cn("flex flex-col h-screen w-full bg-background overflow-hidden relative", className)}>
      <div className={cn(
        "flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out",
        isSidebarOpen ? "h-[65vh]" : "h-screen"
      )}>
        {children}
      </div>

      <AnimatePresence>
        {isSidebarOpen && sidebarContent && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="h-[35vh] w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-40"
          >
            <div className="h-full flex flex-col pt-3 relative">
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
                {sidebarContent}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
