"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import { useSidebar } from "../ui/sidebar";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useFolderStore } from "@/store/folderStore";
import { useNoteStore } from "@/store/noteStore";

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { folders } = useFolderStore();
  const { notes } = useNoteStore();

  const breadcrumbItems = useMemo(() => {
    if (!pathname?.startsWith("/hub")) return [];

    const segments = pathname.split("/").filter(Boolean).slice(1);
    const items: Array<{ label: string; href?: string }> = [
      { label: "Hub", href: "/hub/items" },
    ];

    let previous: string | null = null;
    let accPath = "/hub";

    segments.forEach((segment) => {
      accPath += `/${segment}`;

      if (segment === "items") {
        items.push({ label: "Itens", href: "/hub/items" });
        previous = "items";
        return;
      }

      if (segment === "notes") {
        items.push({ label: "Notas", href: "/hub/items" });
        previous = "notes";
        return;
      }

      if (segment === "folders") {
        items.push({ label: "Pastas", href: "/hub/items" });
        previous = "folders";
        return;
      }

      if (previous === "folders" || previous === "items") {
        const folder = folders.find((f) => f.id === segment);
        items.push({
          label: folder?.title || "Pasta",
          href: accPath,
        });
        previous = "folderId";
        return;
      }

      if (previous === "notes") {
        const note = notes.find((n) => n.id === segment);
        items.push({
          label: note?.title || "Nota",
          href: accPath,
        });
        previous = "noteId";
        return;
      }

      items.push({ label: segment, href: accPath });
      previous = segment;
    });

    return items;
  }, [folders, notes, pathname]);

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

      {breadcrumbItems.length > 1 ? (
        <Breadcrumb className="mx-2">
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;

              return (
                <Fragment key={`${item.label}-${item.href ?? index}`}>
                  {index !== 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href ?? "/hub/items"}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
    </header>
  );
}
