export const LANDING_BLOCK_TYPES = [
  'hero',
  'catalog',
  'stats',
  'about',
  'gallery',
  'testimonials',
  'promotion',
  'call_to_action',
  'contact',
  'agent_call_to_action',
  'structured_content',
  'footer',
] as const;

export type LandingBlockType = typeof LANDING_BLOCK_TYPES[number];
export type LandingStatus = 'draft' | 'published' | 'archived';
export type LandingFrameHeight = 'viewport' | 'compact' | 'content';

export interface LandingBlock {
  id: string;
  type: LandingBlockType;
  enabled: boolean;
  order: number;
  frameHeight?: LandingFrameHeight;
  layout?: {
    variant?: string;
    media?: 'background' | 'side' | 'none';
    align?: 'left' | 'right' | 'center';
    density?: 'compact' | 'comfortable';
  };
  data: Record<string, any>;
}

export interface LandingTheme {
  primary: string;
  accent: string;
  surface: string;
  text: string;
}

export interface LandingContent {
  theme: LandingTheme;
  navigation: Array<{ label: string; href: string }>;
  motion?: 'soft' | 'dynamic' | 'signature' | 'none';
  agent?: {
    name?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    welcomeMessage?: string;
    nameColor?: string;
    avatarAlignment?: 'left' | 'center' | 'right';
  };
  blocks: LandingBlock[];
}

export interface LandingPageSnapshot {
  _id: string;
  businessSlug: string;
  pageSlug: string;
  title: string;
  status: LandingStatus;
  draft: LandingContent;
  published?: LandingContent;
  publishedVersion?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
