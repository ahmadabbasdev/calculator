import { z } from "zod";
import { MAX_STATE_TAX_VERIFIED_AGE_DAYS } from "@/lib/state-tax/config";

const bracketSchema = z.object({
  from: z.number().finite().nonnegative(),
  to: z.number().finite().nonnegative().nullable(),
  rate: z.number().finite().min(0).max(1),
});

const bracketsByStatusSchema = z.object({
  single: z.array(bracketSchema).min(1),
  married_joint: z.array(bracketSchema).min(1),
  head_of_household: z.array(bracketSchema).min(1),
});

const deductionByStatusSchema = z.object({
  single: z.number().finite().nonnegative(),
  married_joint: z.number().finite().nonnegative(),
  head_of_household: z.number().finite().nonnegative(),
});

/** Per-status amount, a single amount applied to every status, or null. */
const personalExemptionSchema = z.union([
  deductionByStatusSchema,
  z.number().finite().nonnegative(),
  z.null(),
]);

const noteSchema = z.object({
  text: z.string().min(1),
  sourceUrl: z.string().url(),
});

const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const factSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
  sourceUrl: z.string().url(),
});

function assertBracketLadder(
  brackets: z.infer<typeof bracketSchema>[],
  label: string,
): void {
  for (let i = 0; i < brackets.length; i++) {
    const current = brackets[i]!;
    if (i === 0 && current.from !== 0) {
      throw new Error(`${label}: first bracket must start at 0 (got ${current.from}).`);
    }
    if (i === brackets.length - 1) {
      if (current.to !== null) {
        throw new Error(`${label}: last bracket must be open-ended (to: null).`);
      }
    } else if (current.to === null) {
      throw new Error(`${label}: only the last bracket may have to: null.`);
    }
    if (current.to !== null && current.to <= current.from) {
      throw new Error(
        `${label}: bracket to (${current.to}) must be greater than from (${current.from}).`,
      );
    }
    if (i > 0) {
      const prev = brackets[i - 1]!;
      if (prev.to === null || current.from !== prev.to) {
        throw new Error(
          `${label}: brackets must be contiguous (expected from ${prev.to}, got ${current.from}).`,
        );
      }
      if (current.from < prev.from) {
        throw new Error(`${label}: brackets must be sorted by from ascending.`);
      }
    }
  }
}

export const stateTaxDataSchema = z
  .object({
    code: z
      .string()
      .length(2)
      .regex(/^[A-Z]{2}$/, "State code must be two uppercase letters"),
    name: z.string().min(1),
    taxYear: z.number().int().gte(2000).lte(2100),
    structure: z.enum(["flat", "progressive", "none"]),
    wave: z.number().int().positive().nullable(),
    modelFit: z.enum(["unknown", "good", "partial", "poor"]),
    modelFitReason: z.string(),
    limits: z.array(z.string().min(1)),
    brackets: bracketsByStatusSchema,
    standardDeduction: deductionByStatusSchema,
    personalExemption: personalExemptionSchema.optional(),
    localTaxNote: z.string().min(1).nullable().optional(),
    notes: z.array(noteSchema).max(5),
    facts: z.array(factSchema),
    sources: z.array(sourceSchema),
    lastVerified: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "lastVerified must be YYYY-MM-DD"),
    verified: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.structure === "none") {
      return;
    }

    for (const status of ["single", "married_joint", "head_of_household"] as const) {
      const brackets = data.brackets[status];
      try {
        assertBracketLadder(brackets, `${data.code} ${status}`);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : String(error),
          path: ["brackets", status],
        });
      }
      if (data.structure === "flat" && brackets.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.code} ${status}: flat structure requires exactly one bracket.`,
          path: ["brackets", status],
        });
      }
    }

    if (data.verified) {
      if (data.sources.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.code}: verified states need at least one source.`,
          path: ["sources"],
        });
      }
      if (data.notes.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.code}: verified states need at least two notes.`,
          path: ["notes"],
        });
      }
      if (data.facts.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.code}: verified states need at least four facts.`,
          path: ["facts"],
        });
      }
      if (data.modelFit === "unknown") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.code}: verified states need modelFit good, partial, or poor.`,
          path: ["modelFit"],
        });
      }
      const verifiedAt = Date.parse(`${data.lastVerified}T00:00:00.000Z`);
      if (!Number.isFinite(verifiedAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${data.code}: lastVerified is not a valid date.`,
          path: ["lastVerified"],
        });
      } else {
        const ageDays =
          (Date.now() - verifiedAt) / (1000 * 60 * 60 * 24);
        if (ageDays > MAX_STATE_TAX_VERIFIED_AGE_DAYS) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${data.code}: lastVerified is older than ${MAX_STATE_TAX_VERIFIED_AGE_DAYS} days (${data.lastVerified}).`,
            path: ["lastVerified"],
          });
        }
      }
    }
  });

export type StateTaxData = z.infer<typeof stateTaxDataSchema>;
export type FilingStatus = keyof StateTaxData["brackets"];
export type TaxBracket = z.infer<typeof bracketSchema>;
export type PersonalExemption = z.infer<typeof personalExemptionSchema>;
export type StateFact = z.infer<typeof factSchema>;

export const FILING_STATUSES: {
  id: FilingStatus;
  label: string;
}[] = [
  { id: "single", label: "Single" },
  { id: "married_joint", label: "Married filing jointly" },
  { id: "head_of_household", label: "Head of household" },
];

/** Resolve personal exemption for a filing status (0 when absent). */
export function personalExemptionForStatus(
  state: Pick<StateTaxData, "personalExemption">,
  status: FilingStatus,
): number {
  const value = state.personalExemption;
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return value[status];
}

/** Parse and validate one state record; throws with a clear message on failure. */
export function parseStateTaxData(raw: unknown, fileLabel = "state-tax"): StateTaxData {
  const result = stateTaxDataSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid state tax data in ${fileLabel}: ${details}`);
  }
  return result.data;
}

export const rosterEntrySchema = z.object({
  code: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/),
  name: z.string().min(1),
  taxesWages: z.boolean(),
  structure: z.enum(["unknown", "flat", "progressive", "none"]),
  modelFit: z.enum(["unknown", "good", "partial", "poor"]),
  modelFitReason: z.string(),
  wave: z.number().int().positive().nullable(),
  status: z.enum([
    "no-wage-tax",
    "todo",
    "data-ready",
    "verified",
    "published",
  ]),
});

export const rosterFileSchema = z.object({
  states: z.array(rosterEntrySchema).length(51),
});

export type RosterEntry = z.infer<typeof rosterEntrySchema>;
