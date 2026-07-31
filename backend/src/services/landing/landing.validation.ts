import { z } from 'zod';
import { LANDING_BLOCK_TYPES } from './landing.contracts';

const landingBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(LANDING_BLOCK_TYPES),
  enabled: z.boolean().default(true),
  order: z.number().int().nonnegative(),
  data: z.record(z.string(), z.any()).default({}),
});

export const landingContentSchema = z.object({
  theme: z.object({
    primary: z.string().min(1).default('#2563eb'),
    accent: z.string().min(1).default('#f59e0b'),
    surface: z.string().min(1).default('#ffffff'),
    text: z.string().min(1).default('#111827'),
  }),
  navigation: z.array(z.object({
    label: z.string().min(1),
    href: z.string().min(1),
  })).default([]),
  blocks: z.array(landingBlockSchema).min(1),
});

export const landingPagePatchSchema = z.object({
  title: z.string().min(1).optional(),
  draft: landingContentSchema.optional(),
});

export const assertLandingContent = (content: unknown) => landingContentSchema.parse(content);
