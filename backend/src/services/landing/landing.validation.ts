import { z } from 'zod';
import { LANDING_BLOCK_TYPES } from './landing.contracts';

const unsafeKeyPattern = /^(html|rawHtml|embedHtml|script|dangerouslySetInnerHTML)$/i;
const unsafeValuePattern = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta|form|input|textarea|button|svg|math|img|video|audio|source|canvas)\b|on[a-z]+\s*=|javascript:/i;
const allowedManagedAssetPathPattern = /^\/(?:uploads|upload_utils)\//i;
const forbiddenAssetValuePattern = /^(blob|data|file):|c:\\fakepath|^[a-z]:[\\/]|^\\\\/i;
const bareFileNamePattern = /^[^/\\]+\.(?:png|jpe?g|webp|gif|mp4|webm|ogg)$/i;
const sectionAnchorPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECTION_MOTIONS = ['none', 'fade', 'rise', 'slide', 'stagger', 'scale', 'blur-reveal'] as const;
const SECTION_DEPTHS = ['none', 'subtle', 'tilt', 'layered'] as const;
const GALLO_SINGLETON_VARIANTS = new Set([
  'gallo_workshop_hero',
  'gallo_partners_scene',
  'gallo_services_scene',
  'gallo_diagnostic_scene',
  'gallo_process_scene',
  'gallo_experience_scene',
  'gallo_evidence_scene',
  'gallo_contact_scene',
]);

const isAllowedPublicAssetUrl = (value = '') => {
  const path = String(value || '').trim();
  if (!path) return true;
  if (forbiddenAssetValuePattern.test(path) || bareFileNamePattern.test(path)) return false;
  return /^https:\/\//i.test(path) || allowedManagedAssetPathPattern.test(path);
};

const publicAssetUrlSchema = z.string().trim().refine(isAllowedPublicAssetUrl, {
  message: 'Asset URL must be https://, /uploads/... or /upload_utils/...',
}).optional();

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

const sectionInstanceSchema = z.object({
  schemaVersion: z.literal(1),
  templateKey: z.string().trim().min(1),
  semanticFamily: z.string().trim().min(1),
  anchor: z.string().trim().min(1).regex(sectionAnchorPattern, 'Section anchor must be URL-safe kebab-case'),
  navLabel: z.string().trim().min(1),
  showInNavigation: z.boolean(),
  repeatable: z.boolean(),
  motion: z.enum(SECTION_MOTIONS),
  depth: z.enum(SECTION_DEPTHS),
}).strict();

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
    avatarUrl: publicAssetUrlSchema,
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

  const seenIds = new Map<string, number>();
  const seenAnchors = new Map<string, number>();
  const seenSingletonVariants = new Map<string, number>();

  content.blocks.forEach((block, index) => {
    const previousIdIndex = seenIds.get(block.id);
    if (previousIdIndex !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', index, 'id'],
        message: `Landing block id must be unique; duplicates blocks.${previousIdIndex}.id`,
      });
    } else {
      seenIds.set(block.id, index);
    }

    const variant = block.layout?.variant || block.data?.variant;
    if (variant && GALLO_SINGLETON_VARIANTS.has(variant)) {
      const previousVariantIndex = seenSingletonVariants.get(variant);
      if (previousVariantIndex !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['blocks', index, 'layout', 'variant'],
          message: `Gallo singleton scene variant ${variant} must be unique; duplicates blocks.${previousVariantIndex}`,
        });
      } else {
        seenSingletonVariants.set(variant, index);
      }
    }

    const instance = block.data?.instance;
    if (instance === undefined) return;

    const parsed = sectionInstanceSchema.safeParse(instance);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: 'custom',
          path: ['blocks', index, 'data', 'instance', ...issue.path],
          message: issue.message,
        });
      }
      return;
    }

    const previousAnchorIndex = seenAnchors.get(parsed.data.anchor);
    if (previousAnchorIndex !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['blocks', index, 'data', 'instance', 'anchor'],
        message: `Section anchor must be unique; duplicates blocks.${previousAnchorIndex}.data.instance.anchor`,
      });
    } else {
      seenAnchors.set(parsed.data.anchor, index);
    }
  });
});

export const landingPagePatchSchema = z.object({
  title: z.string().min(1).optional(),
  draft: landingContentSchema.optional(),
});

export const assertLandingContent = (content: unknown) => landingContentSchema.parse(content);
