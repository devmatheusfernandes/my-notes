"use client";
import { useState } from "react";
import { LogOut, Sun, Moon, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { getPageTitle } from "@/lib/utils";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";
import HubBreadcrumb from "./hub-breadcrumb";
import TagChips from "../items/tag-chips";
import { Tag } from "@/schemas/tagSchema";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollThreshold } from "@/hooks/use-scroll-threshold";
import { OfflineIndicator } from "../ui/offline-indicator";

interface HeaderProps {
  scrollSearch?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  showTags?: boolean;
  tags?: Tag[];
  selectedTagId?: string | null;
  setSelectedTagId?: (id: string | null) => void;
}

export default function Header({
  scrollSearch = false,
  searchQuery = "",
  setSearchQuery,
  showBreadcrumb = false,
  showSearch = true,
  showTags = false,
  tags = [],
  selectedTagId = null,
  setSelectedTagId,
}: HeaderProps) {

  const { user } = useAuthStore();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const isScrolled = useScrollThreshold(25);
  const [isFocused, setIsFocused] = useState(false);

  const isDesktop = isMobile === false;

  const handleLogout = async () => {
    await authService.logOut();
  };

  const showStickySearchMobile = scrollSearch && (isScrolled || (searchQuery.length > 0 && isFocused));

  const clearSearch = () => {
    setSearchQuery?.("");
    setIsFocused(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-background/50 backdrop-blur-md transition-colors duration-300">
      <div className="w-full">
        <div className="flex flex-row items-center justify-between w-full gap-4 py-2 px-2 md:px-4">
          <div className="flex flex-row items-center gap-2">


            {isDesktop && showSearch && (
              <h1 className="text-xl font-bold truncate max-w-[200px] lg:max-w-xs text-foreground/90">
                {getPageTitle(pathname)}
              </h1>
            )}
          </div>

          <div className="flex-grow flex justify-center items-center relative h-10 overflow-hidden">
            <AnimatePresence mode="wait">
              {!showSearch ? (
                isScrolled && (
                  <motion.h1
                    key="central-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="text-lg font-bold truncate text-center w-full text-foreground/90"
                  >
                    {getPageTitle(pathname)}
                  </motion.h1>
                )
              ) : (
                isDesktop ? (
                  <div key="desktop-search" className="w-full max-w-md px-2">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        placeholder="Buscar..."
                        className="pl-10 pr-10 h-10 bg-muted/40 border-transparent hover:bg-muted/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 w-full transition-all duration-300 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery?.(e.target.value)}
                      />
                      <AnimatePresence>
                        {searchQuery && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Limpar busca"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {!showStickySearchMobile ? (
                      <motion.h1
                        key="title"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="text-lg font-bold truncate text-center w-full text-foreground/90"
                      >
                        {getPageTitle(pathname)}
                      </motion.h1>
                    ) : (
                      <motion.div
                        key="search"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="w-full px-1"
                      >
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
                          <Input
                            placeholder="Buscar..."
                            className="pl-9 pr-9 h-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 w-full rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery?.(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoFocus
                          />
                          <AnimatePresence>
                            {searchQuery && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )
              )}
            </AnimatePresence>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <OfflineIndicator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-9 w-9 border border-border/50 hover:border-primary/50 transition-colors">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Usuário"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {user?.displayName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(resolvedTheme === "dark" || theme === "dark" ? "light" : "dark")}
                  className="cursor-pointer"
                >
                  <div className="relative mr-2 flex h-4 w-4 items-center justify-center">
                    <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                  <span className="dark:hidden">Modo Escuro</span>
                  <span className="hidden dark:inline">Modo Claro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Conteúdo inferior animado (Breadcrumb, Search Mobile, Tags) */}
      <motion.div layout className="flex flex-col gap-2 px-2 md:px-4 pb-2">
        {showBreadcrumb && <HubBreadcrumb />}

        {!isDesktop && showSearch && (
          <AnimatePresence initial={false}>
            {!showStickySearchMobile && scrollSearch && (
              <motion.div
                key="mobile-search-bar"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 4 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="relative group pt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-[2px] h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    placeholder="Buscar nota ou pasta..."
                    className="pl-9 pr-9 h-11 bg-muted/30 border-transparent hover:bg-muted/50 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery?.(e.target.value)}
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 mt-[2px] text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {showTags && tags.length > 0 && setSelectedTagId && (
          <TagChips
            tags={tags}
            value={selectedTagId}
            onChange={setSelectedTagId}
          />
        )}
      </motion.div>
    </div>
  );
}