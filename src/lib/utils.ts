import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getOddsColor(odds: number): string {
  if (odds >= 2.5) return "text-red-400";
  if (odds >= 1.8) return "text-yellow-400";
  return "text-green-400";
}

export function getRankName(rankTier?: number): string {
  if (!rankTier) return "Não ranqueado";
  const medal = Math.floor(rankTier / 10);
  const medals = ["", "Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"];
  return medals[medal] ?? "Desconhecido";
}
