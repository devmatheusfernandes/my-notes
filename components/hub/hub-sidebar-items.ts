import { LayoutPanelTopIcon } from "../icon-animated/layout-panel-top";
import { ArchiveIcon } from "../icon-animated/archive";
import { DeleteIcon } from "../ui/delete";
import { SettingsIcon } from "../icon-animated/settings";
import { GraduationCapIcon } from "../icon-animated/graduation-cap";
import { BookTextIcon } from "../icon-animated/book-text";
import { MessageSquareIcon, Share2Icon } from "lucide-react";


export type HubSidebarItem = {
  label: string;
  tooltip: string;
  icon: React.ElementType;
  href?: string;
};

export const hubSidebarMainItems: HubSidebarItem[] = [
  {
    label: "Início",
    tooltip: "Dashboard",
    icon: LayoutPanelTopIcon,
    href: "/hub/items",
  },
  {
    label: "Grafo",
    tooltip: "Visualização em Grafo",
    icon: Share2Icon,
    href: "/hub/graph",
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

export const hubSidebarStudyItems: HubSidebarItem[] = [
  {
    label: "Bíblia",
    tooltip: "Bíblia",
    icon: BookTextIcon,
    href: "/hub/bible"
  },
  {
    label: "Estudo Pessoal",
    tooltip: "Estudo Pessoal",
    icon: GraduationCapIcon,
    href: "/hub/personal-study"
  },
  {
    label: "Perspicaz",
    tooltip: "Perspicaz",
    icon: BookTextIcon,
    href: "/hub/perspicaz",
  },
  {
    label: "Chat",
    tooltip: "Conversar com IA",
    icon: MessageSquareIcon,
    href: "/hub/chat",
  }
];


export const hubSidebarFooterItems: HubSidebarItem[] = [
  {
    label: "Configurações",
    tooltip: "Configurações",
    icon: SettingsIcon,
    href: "/hub/settings",
  },
];
