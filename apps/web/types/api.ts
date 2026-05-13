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

// ════════════════════════════════════════
// Workouts
// ════════════════════════════════════════

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  nameAr?: string;
  muscleGroup?: string;
  equipment?: string;
  videoUrl?: string;
  instructions?: string;
  createdAt: string;
};

export type WorkoutPlan = {
  id: string;
  clientId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export type WorkoutDay = {
  id: string;
  planId: string;
  name: string;
  dayOrder: number;
};

export type WorkoutExercise = {
  id: string;
  dayId: string;
  exerciseId?: string;
  customName?: string;
  sets?: number;
  reps?: string;
  restSeconds?: number;
  notes?: string;
  sortOrder: number;
};

export type WorkoutPlanFull = WorkoutPlan & {
  days: Array<WorkoutDay & { exercises: WorkoutExercise[] }>;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  planJson: string; // base64
  createdAt: string;
};

export type WorkoutLog = {
  id: string;
  clientId: string;
  exerciseId?: string;
  loggedAt: string;
  setsCompleted?: number;
  repsCompleted?: string;
  weightKg?: number;
  rpe?: number;
  notes?: string;
};

// ════════════════════════════════════════
// Nutrition
// ════════════════════════════════════════

export type NutritionPlan = {
  id: string;
  clientId: string;
  mode: "fixed" | "flexible";
  caloriesTarget?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  isActive: boolean;
  createdAt: string;
};

export type Meal = {
  id: string;
  planId: string;
  mealType: string;
  sortOrder: number;
  foodItems: unknown;
};

export type NutritionPlanFull = NutritionPlan & {
  meals: Meal[];
};

export type Food = {
  id: string;
  name: string;
  nameAr?: string;
  brand?: string;
  barcode?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isVerified: boolean;
  createdAt: string;
};

export type MacroCalcResult = {
  bmr: number;
  tdee: number;
  caloriesTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  activityFactor: number;
  goalAdjustment: number;
  proteinPerKgUsed: number;
  fatPercentUsed: number;
};

// ════════════════════════════════════════
// Progress
// ════════════════════════════════════════

export type WeightEntry = {
  clientId: string;
  loggedAt: string;
  weightKg: number;
  notes?: string;
};

export type Measurement = {
  clientId: string;
  measuredAt: string;
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  shouldersCm?: number;
  hipsCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  bodyFatPercent?: number;
  notes?: string;
};

export type ProgressPhoto = {
  id: string;
  clientId: string;
  photoUrl: string;
  publicId: string;
  takenAt: string;
  pose?: string;
  note?: string;
  showOnLanding: boolean;
  createdAt: string;
};

// ════════════════════════════════════════
// Check-in
// ════════════════════════════════════════

export type DailyCheckin = {
  id: string;
  clientId: string;
  checkinDate: string;
  workoutStatus?: string;
  workoutSetsDone?: number;
  dietCompliance?: number;
  cardioDone?: boolean;
  cardioMinutes?: number;
  sleepQuality?: number;
  sleepHours?: number;
  waterIntakeCups?: number;
  clientNote?: string;
  submittedAt: string;
};

export type AtRiskClient = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  avgCompliance: number;
  checkinCount: number;
};

// ════════════════════════════════════════
// Messages & Notifications
// ════════════════════════════════════════

export type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  readAt?: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
};

// ════════════════════════════════════════
// Monitoring
// ════════════════════════════════════════

export type DashboardStats = {
  activeClients: number;
  avgCompliance: number;
  atRiskClients: number;
  todayCheckins: number;
};

export type ComplianceTrend = {
  day: string;
  avgCompliance: number;
  checkinCount: number;
};

export type TopClient = {
  id: string;
  name: string;
  avgCompliance: number;
};
