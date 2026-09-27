import { z } from "zod";
import { applicationFields } from "./onboarding";
import type { Role } from "./types";

export function validateApplication(role: Role, input: unknown) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of applicationFields[role]) {
    let value = z.string().trim().max(field.max || 1000);
    if (field.required) value = value.min(1, `Please complete: ${field.label}.`);
    let schema: z.ZodTypeAny = field.options ? value.refine(v => !v || field.options!.includes(v), `Choose a valid option for ${field.label}.`) : value;
    if (field.key === "sample") schema = value.refine(v => !v || /^https?:\/\//i.test(v), "Use a full https:// sample link.");
    shape[field.key] = schema.default("");
  }
  return z.object(shape).strict().parse(input);
}
