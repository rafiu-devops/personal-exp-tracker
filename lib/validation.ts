import { z } from "zod";
import { SELF_ID } from "./types";
import { validateSplit } from "./split";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(60),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(120)
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
});

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(60),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  memberIds: z.array(z.string()).default([]),
  archived: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(40),
  icon: z.string().trim().min(1).max(8),
  color: z.string().trim().min(1).max(20),
});

export const splitEntrySchema = z.object({
  personId: z.string(),
  value: z.number(),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Choose a source account"),
    toAccountId: z.string().min(1, "Choose a destination account"),
    amount: z.coerce
      .number({ message: "Enter a valid amount" })
      .positive("Amount must be greater than 0"),
    date: z.string().min(1, "Please choose a date"),
    note: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    path: ["toAccountId"],
    message: "Source and destination must be different",
  });

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required").max(40),
  type: z.enum(["cash", "wallet", "savings", "card", "other"]),
  openingBalance: z.coerce.number().default(0),
  icon: z.string().trim().min(1).max(8).optional(),
  color: z.string().trim().min(1).max(20).optional(),
});

export const incomeSchema = z.object({
  accountId: z.string().min(1, "Choose an account"),
  amount: z.coerce
    .number({ message: "Enter a valid amount" })
    .positive("Amount must be greater than 0"),
  date: z.string().min(1, "Please choose a date"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const expenseFormSchema = z
  .object({
    kind: z.enum(["personal", "shared"]),
    title: z.string().trim().max(120).default(""),
    amount: z.coerce
      .number({ message: "Enter a valid amount" })
      .positive("Amount must be greater than 0"),
    categoryId: z.string().min(1, "Please choose a category"),
    date: z.string().min(1, "Please choose a date"),
    note: z.string().trim().max(500).optional().or(z.literal("")),
    accountId: z.string().optional().or(z.literal("")),
    groupId: z.string().optional().or(z.literal("")),
    payerId: z.string().default(SELF_ID),
    participantIds: z.array(z.string()).default([]),
    splitType: z.enum(["equal", "exact", "percentage"]).default("equal"),
    entries: z.array(splitEntrySchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== "shared") return;

    if (data.participantIds.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["participantIds"],
        message: "Choose at least 2 participants",
      });
      return;
    }

    if (!data.participantIds.includes(data.payerId)) {
      ctx.addIssue({
        code: "custom",
        path: ["payerId"],
        message: "The payer must be one of the participants",
      });
    }

    const result = validateSplit(
      Math.round(data.amount),
      data.splitType,
      data.participantIds,
      data.entries
    );
    if (!result.valid) {
      ctx.addIssue({
        code: "custom",
        path: ["splitError"],
        message: result.errors.join(" "),
      });
    }
  });

export const settlementSchema = z.object({
  fromPersonId: z.string().min(1),
  toPersonId: z.string().min(1),
  amount: z.coerce
    .number({ message: "Enter a valid amount" })
    .positive("Amount must be greater than 0"),
  date: z.string().min(1, "Please choose a date"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  accountId: z.string().optional().or(z.literal("")),
  groupId: z.string().optional().or(z.literal("")),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type PersonValues = z.infer<typeof personSchema>;
export type GroupValues = z.infer<typeof groupSchema>;
export type CategoryValues = z.infer<typeof categorySchema>;
export type TransferValues = z.infer<typeof transferSchema>;
export type AccountValues = z.infer<typeof accountSchema>;
export type IncomeValues = z.infer<typeof incomeSchema>;
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type SettlementValues = z.infer<typeof settlementSchema>;
