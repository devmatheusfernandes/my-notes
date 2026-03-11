import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  BookOpenIcon,
  LayoutGridIcon,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

export type HubSidebarItem = {
  label: string;
  tooltip: string;
  icon: LucideIcon;
  href?: string;
};

export const hubSidebarItems: HubSidebarItem[] = [
  {
    label: "Dashboard",
    tooltip: "Dashboard",
    icon: LayoutGridIcon,
    href: "/hub/notes",
  },
  {
    label: "Notas",
    tooltip: "Notas",
    icon: BookOpenIcon,
    href: "/hub/notes",
  },
  {
    label: "Favoritas",
    tooltip: "Favoritas",
    icon: StarIcon,
  },
  {
    label: "Arquivadas",
    tooltip: "Arquivadas",
    icon: ArchiveIcon,
  },
  {
    label: "Lixeira",
    tooltip: "Lixeira",
    icon: Trash2Icon,
  },
];

export const hubSidebarFooterItems: HubSidebarItem[] = [
  {
    label: "Configurações",
    tooltip: "Configurações",
    icon: SettingsIcon,
  },
];
