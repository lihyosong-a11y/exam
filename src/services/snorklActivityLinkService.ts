import { z } from "zod";

const allowedSnorklHosts = ["snorkl.app", "www.snorkl.app", "app.snorkl.com", "snorkl.com"];

export const snorklActivityLinkSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "https URL만 사용할 수 있습니다.")
    .refine((value) => allowedSnorklHosts.includes(new URL(value).hostname.toLowerCase()), "허용된 Snorkl 도메인만 사용할 수 있습니다."),
  instructions: z.string().trim().max(500),
  release_policy: z.enum(["before_assessment", "after_start", "after_submission", "manual"]),
  open_mode: z.enum(["new_tab", "same_tab"]),
});

export type SnorklActivityLinkInput = z.infer<typeof snorklActivityLinkSchema>;

export function validateSnorklActivityLink(input: unknown) {
  return snorklActivityLinkSchema.safeParse(input);
}
