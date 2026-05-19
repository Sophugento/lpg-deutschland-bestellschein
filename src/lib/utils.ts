import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEUR(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + " €";
}

export function calcPromoRevente(qty: number): { paid: number; free: number } {
  if (qty >= 10) return { paid: qty, free: 2 };
  if (qty >= 6) return { paid: qty, free: 1 };
  return { paid: qty, free: 0 };
}

export function calcPromoCabine(qty: number): { paid: number; free: number } {
  if (qty >= 4) return { paid: qty, free: Math.floor(qty / 4) };
  return { paid: qty, free: 0 };
}

export function translateSize(size: string): string {
  return size;
}
