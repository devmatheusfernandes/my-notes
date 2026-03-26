import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPageTitle = (pathname: string) => {
  if (pathname.includes("/items")) return "Notas";
  if (pathname.includes("/archived")) return "Arquivadas";
  if (pathname.includes("/trash")) return "Lixeira";
  if (pathname.includes("/settings")) return "Configurações";
  return "My Notes";
};
