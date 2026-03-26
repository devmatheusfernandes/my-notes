import type { LucideIcon } from "lucide-react";
import {
  ArchiveIcon,
  LayoutGridIcon,
  SettingsIcon,
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
    label: "Arquivadas",
    tooltip: "Arquivadas",
    icon: ArchiveIcon,
    href: "/hub/archived",
  },
  {
    label: "Lixeira",
    tooltip: "Lixeira",
    icon: Trash2Icon,
    href: "/hub/trash",
  },
];

export const hubSidebarFooterItems: HubSidebarItem[] = [
  {
    label: "Configurações",
    tooltip: "Configurações",
    icon: SettingsIcon,
    href: "/hub/settings",
  },
];
