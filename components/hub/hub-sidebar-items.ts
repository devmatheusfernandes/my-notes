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
    label: "Início",
    tooltip: "Dashboard",
    icon: LayoutGridIcon,
    href: "/hub/items",
  },
  {
    label: "Todas as notas",
    tooltip: "Notas",
    icon: BookOpenIcon,
    href: "/hub/items",
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
