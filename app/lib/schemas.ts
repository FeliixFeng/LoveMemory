import { z } from 'zod';

// --- Event ---
export const CreateEventSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  date: z.string().min(1, '日期不能为空'),
  desc: z.string().default(''),
  icon: z.string().max(64).default('heart'),
  location: z.string().max(500).default(''),
  mood: z.string().max(100).default(''),
  coverPhoto: z.string().max(500).default('')
});

export const UpdateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  date: z.string().min(1).optional(),
  desc: z.string().optional(),
  icon: z.string().max(64).optional(),
  location: z.string().max(500).optional(),
  mood: z.string().max(100).optional(),
  coverPhoto: z.string().max(500).optional()
});

// --- Wish ---
export const CreateWishSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  description: z.string().max(1000).default(''),
  emoji: z.string().max(10).default('💝')
});

export const UpdateWishSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  emoji: z.string().max(10).optional(),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().nullable().optional()
});

// --- Capsule ---
export const CreateCapsuleSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  content: z.string().max(5000).default(''),
  emoji: z.string().max(10).default('💌'),
  unlockDate: z.string().default('')
});

export const UpdateCapsuleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(5000).optional(),
  emoji: z.string().max(10).optional(),
  unlockDate: z.string().optional(),
  isOpened: z.boolean().optional()
});

// --- Expense ---
export const AddExpenseSchema = z.object({
  amount: z.number().positive('金额必须大于0'),
  category: z.string().max(100).default('other'),
  note: z.string().max(500).default('')
});
