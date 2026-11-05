import { z } from "zod";

const genderSchema = z.enum(["male", "female"]);

const palSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rank: z.number().int(),
  breedable: z.boolean(),
  formulaExcluded: z.boolean(),
});

const uniqueComboSchema = z.object({
  parentA: z.string().min(1),
  parentB: z.string().min(1),
  child: z.string().min(1),
  genderA: genderSchema.optional(),
  genderB: genderSchema.optional(),
});

export const palworldDataSchema = z
  .object({
    gameVersion: z.string().min(1),
    extractedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/, "extractedAt must be an ISO date (YYYY-MM-DD…)"),
    source: z.string().min(1),
    verified: z.boolean(),
    pals: z.array(palSchema),
    unique: z.array(uniqueComboSchema),
  })
  .superRefine((data, ctx) => {
    const ids = new Set<string>();
    for (const pal of data.pals) {
      if (ids.has(pal.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate Pal id: ${pal.id}`,
          path: ["pals"],
        });
      }
      ids.add(pal.id);
    }

    for (let i = 0; i < data.unique.length; i++) {
      const combo = data.unique[i]!;
      for (const key of ["parentA", "parentB", "child"] as const) {
        if (!ids.has(combo[key])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `unique[${i}].${key} references unknown id "${combo[key]}"`,
            path: ["unique", i, key],
          });
        }
      }
    }
  });

export const goldenPairSchema = z.object({
  parentA: z.string().min(1),
  parentB: z.string().min(1),
  expectedChild: z.string().min(1),
});

export const goldenPairsSchema = z.array(goldenPairSchema);

export type PalGender = z.infer<typeof genderSchema>;
export type PalRecord = z.infer<typeof palSchema>;
export type UniqueCombo = z.infer<typeof uniqueComboSchema>;
export type PalworldData = z.infer<typeof palworldDataSchema>;
export type GoldenPair = z.infer<typeof goldenPairSchema>;

export function parsePalworldData(raw: unknown, label = "pals.json"): PalworldData {
  const result = palworldDataSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid Palworld data in ${label}: ${details}`);
  }
  return result.data;
}

export function parseGoldenPairs(
  raw: unknown,
  label = "golden-pairs.json",
): GoldenPair[] {
  const result = goldenPairsSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid golden pairs in ${label}: ${details}`);
  }
  return result.data;
}
