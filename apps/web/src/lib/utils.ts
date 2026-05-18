// shadcn/ui cn() helper — class merging. Sprint 1'de shadcn ile primitive component'ler eklenince kullanılacak.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
