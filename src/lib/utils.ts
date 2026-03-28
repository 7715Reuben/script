import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function isMorning(): boolean {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 13;
}

export function isSunday(): boolean {
  return new Date().getDay() === 0;
}

// Pronoun helpers — used everywhere in UI and AI prompts
export type Pronouns = "she" | "he";

export const P = {
  subject: (p: Pronouns) => p === "she" ? "she" : "he",
  object: (p: Pronouns) => p === "she" ? "her" : "him",
  possessive: (p: Pronouns) => p === "she" ? "her" : "his",
  reflexive: (p: Pronouns) => p === "she" ? "herself" : "himself",
  portrait: (p: Pronouns) => p === "she" ? "Her portrait" : "His portrait",
  portraitLower: (p: Pronouns) => p === "she" ? "her portrait" : "his portrait",
};
