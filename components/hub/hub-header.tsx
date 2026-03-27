"use client";
import { useSidebar } from "../ui/sidebar";
import { Menu, LogOut, Sun, Moon } from "lucide-react";
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

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuthStore();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleLogout = async () => {
    await authService.logOut();
  };

  return (
    <header className="min-w-full sticky top-0 z-50 flex flex-col items-start justify-between bg-background pb-4">
      <div className="flex flex-row items-center justify-between w-full gap-4 py-2">
        <Button
          variant="ghost"
          className="rounded-full"
          size="lg"
          onClick={toggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="md:text-2xl text-xl font-bold">{getPageTitle(pathname)}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Usuário"} />
                <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
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
              <div className="relative mr-4 flex h-4 w-4 items-center justify-center">
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
    </header>
  );
}
