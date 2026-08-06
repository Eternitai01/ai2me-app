import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UserRole = 'Admin' | 'Developer' | 'Executive' | 'Compliance Officer'

export interface User {
  id: string
  email: string
  role: UserRole
  tenantId: string
  createdAt: Date
  updatedAt: Date
}
