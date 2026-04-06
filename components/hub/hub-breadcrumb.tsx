"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/store/authStore";
import { useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folders";

export default function HubBreadcrumb() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const pathname = usePathname();
  const { folders } = useFolders(userId);
  const { notes } = useNotes(userId);

  const breadcrumbItems = useMemo(() => {
    if (!pathname?.startsWith("/hub")) return [];

    const segments = pathname.split("/").filter(Boolean).slice(1);
    const items: Array<{ label: string; href?: string }> = [
      { label: "Início", href: "/hub/items" },
    ];

    let previous: string | null = null;
    let accPath = "/hub";

    segments.forEach((segment) => {
      accPath += `/${segment}`;

      if (segment === "items") {
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

  if (breadcrumbItems.length <= 1) return null;

  return (
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
  );
}
