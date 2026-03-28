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
