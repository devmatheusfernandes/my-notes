import { LayoutPanelTopIcon } from "../ui/layout-panel-top";
import { ArchiveIcon } from "../ui/archive";
import { DeleteIcon } from "../ui/delete";
import { SettingsIcon } from "../ui/settings";


export type HubSidebarItem = {
  label: string;
  tooltip: string;
  icon: React.ElementType;
  href?: string;
};

export const hubSidebarItems: HubSidebarItem[] = [
  {
    label: "Início",
    tooltip: "Dashboard",
    icon: LayoutPanelTopIcon,
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
    icon: DeleteIcon,
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
