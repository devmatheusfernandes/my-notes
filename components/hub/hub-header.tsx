"use client";
import { useSidebar } from "../ui/sidebar";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export default function Header() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-50 flex flex-col items-start justify-between bg-background pb-4">
      <div className="flex flex-row items-center justify-between w-full gap-4 py-2">
        <Button
          variant="ghost"
          className="rounded-full"
          size="lg"
          onClick={toggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="md:text-2xl text-xl font-bold">My Notes</h1>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>

   
    </header>
  );
}
