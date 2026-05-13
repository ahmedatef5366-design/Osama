// Shared API response shapes. Kept in sync with apps/api/internal/httpx.

export type Envelope<T> = {
  data?: T;
  error?: string;
  code?: string;
  meta?: Meta;
};

export type Meta = {
  total?: number;
  page?: number;
  pageSize?: number;
};

export type Role = "admin" | "client";

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type Client = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  heightCm?: number;
  currentWeightKg?: number;
  sex?: "male" | "female";
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  goal?: "fat_loss" | "muscle_gain" | "recomposition" | "athletic";
  activityLevel?: "sedentary" | "light" | "moderate" | "very" | "athlete";
  healthNotes?: string;
  startDate?: string;
  targetDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
