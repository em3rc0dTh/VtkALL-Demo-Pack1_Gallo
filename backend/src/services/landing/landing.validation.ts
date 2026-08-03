import { z } from 'zod';
import { LANDING_BLOCK_TYPES } from './landing.contracts';

const unsafeKeyPattern = /^(html|rawHtml|embedHtml|script|dangerouslySetInnerHTML)$/i;
const unsafeValuePattern = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta|form|input|textarea|button|svg|math|img|video|audio|source|canvas)\b|on[a-z]+\s*=|javascript:/i;

const assertNoUnsafeContent = (value: unknown, path: string[] = []) => {
  if (typeof value === 'string') {
    if (unsafeValuePattern.test(value)) {
      throw new Error(`Unsafe landing content at ${path.join('.') || 'root'}`);
    }
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (unsafeKeyPattern.test(key)) {
      throw new Error(`Unsafe landing content key at ${[...path, key].join('.')}`);
    }
    assertNoUnsafeContent(nested, [...path, key]);
  }
};

const landingBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(LANDING_BLOCK_TYPES),
  enabled: z.boolean().default(true),
  order: z.number().int().nonnegative(),
  frameHeight: z.enum(['viewport', 'compact', 'content']).optional(),
  layout: z.object({
    variant: z.string().min(1).optional(),
    media: z.enum(['background', 'side', 'none']).optional(),
    align: z.enum(['left', 'right', 'center']).optional(),
    density: z.enum(['compact', 'comfortable']).optional(),
  }).optional(),
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
  motion: z.enum(['soft', 'dynamic', 'signature', 'none']).optional(),
  agent: z.object({
    name: z.string().min(1).optional(),
    avatarUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    welcomeMessage: z.string().optional(),
    nameColor: z.string().optional(),
    avatarAlignment: z.enum(['left', 'center', 'right']).optional(),
  }).optional(),
  blocks: z.array(landingBlockSchema).min(1),
}).superRefine((content, ctx) => {
  try {
    assertNoUnsafeContent(content);
  } catch (error) {
    ctx.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Unsafe landing content',
    });
  }
});

export const landingPagePatchSchema = z.object({
  title: z.string().min(1).optional(),
  draft: landingContentSchema.optional(),
});

export const assertLandingContent = (content: unknown) => landingContentSchema.parse(content);
