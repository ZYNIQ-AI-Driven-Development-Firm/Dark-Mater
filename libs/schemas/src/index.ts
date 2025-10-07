import { z } from 'zod';

// Common schemas
export const UuidSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime();
export const EmailSchema = z.string().email();

// User schemas
export const UserSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  username: z.string().min(3),
  roles: z.array(z.string()),
  tenants: z.array(z.string()),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
});

// Agent/Tool manifest schema
export const AgentManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  category: z.enum(['recon', 'exploit', 'postex', 'social', 'defense', 'report']),
  containerImage: z.string(),
  capabilities: z.array(z.string()),
  requirements: z.object({
    cpu: z.string(),
    memMb: z.number().positive()
  }),
  permissions: z.array(z.string()),
  runtime: z.enum(['orchestrated', 'long-running', 'on-demand']),
  inputs: z.array(z.object({
    key: z.string(),
    type: z.string(),
    required: z.boolean()
  })),
  outputs: z.array(z.object({
    key: z.string(),
    type: z.string()
  }))
});

// Team bundle schema
export const TeamBundleSchema = z.object({
  name: z.string().min(1),
  members: z.array(z.object({
    ref: z.string() // format: "name:version"
  })),
  playbooks: z.array(z.object({
    mission: z.string(),
    steps: z.array(z.string())
  }))
});

// License token payload schema
export const LicenseTokenSchema = z.object({
  sub: UuidSchema, // user_id
  listingId: UuidSchema,
  type: z.enum(['agent', 'team', 'tool', 'plugin']),
  scope: z.object({
    tenants: z.array(z.string()),
    labs: z.array(z.string()),
    durationMin: z.number().positive()
  }),
  exp: z.number(), // Unix timestamp
  sig: z.string()
});

// Eligibility response schema
export const EligibilitySchema = z.object({
  labs: z.boolean(),
  arena: z.boolean(),
  reasons: z.array(z.string()).optional()
});

// Marketplace schemas
export const ListingSchema = z.object({
  id: UuidSchema,
  type: z.enum(['agent', 'team', 'tool', 'plugin']),
  title: z.string().min(1),
  summary: z.string(),
  priceCents: z.number().nonnegative(),
  billingCycle: z.enum(['one-time', 'hourly', 'daily', 'monthly']),
  vendorId: UuidSchema,
  manifestJson: z.union([AgentManifestSchema, TeamBundleSchema]),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
});

export const OrderSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  items: z.array(z.object({
    listingId: UuidSchema,
    type: z.enum(['agent', 'team', 'tool', 'plugin']),
    priceCents: z.number().nonnegative()
  })),
  totalCents: z.number().nonnegative(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  createdAt: TimestampSchema
});

// Academy schemas
export const CourseSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1),
  synopsis: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()),
  outlineMd: z.string(),
  passingScore: z.number().min(0).max(100),
  prereqJson: z.record(z.any()).optional(),
  createdAt: TimestampSchema
});

export const CertificateSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  courseId: UuidSchema,
  verifiableCredJws: z.string(),
  issuedAt: TimestampSchema
});

// Labs schemas
export const LabTemplateSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  category: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  runtime: z.enum(['docker', 'k8s']),
  maxDurationMin: z.number().positive(),
  imageRefsJson: z.array(z.string()),
  composeYaml: z.string().optional(),
  safetyRulesJson: z.record(z.any()),
  docsMd: z.string(),
  createdAt: TimestampSchema
});

export const LabSessionSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  templateId: UuidSchema,
  teamId: UuidSchema.optional(),
  agentIds: z.array(UuidSchema),
  licenseTokens: z.array(z.string()),
  status: z.enum(['starting', 'running', 'stopping', 'stopped', 'error']),
  durationMin: z.number().positive(),
  startedAt: TimestampSchema.optional(),
  stoppedAt: TimestampSchema.optional()
});

// Arena schemas
export const ProgramSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1),
  scopeMd: z.string(),
  rulesMd: z.string(),
  startAt: TimestampSchema,
  endAt: TimestampSchema,
  eligibilityRule: z.string(),
  status: z.enum(['draft', 'active', 'ended']),
  createdAt: TimestampSchema
});

export const SubmissionSchema = z.object({
  id: UuidSchema,
  programId: UuidSchema,
  userId: UuidSchema,
  teamId: UuidSchema.optional(),
  reportMd: z.string(),
  evidenceUrls: z.array(z.string().url()),
  cvss: z.number().min(0).max(10),
  status: z.enum(['submitted', 'under-review', 'accepted', 'rejected', 'duplicate']),
  triageNotesMd: z.string().optional(),
  awardCents: z.number().nonnegative().optional(),
  createdAt: TimestampSchema
});

// Export type utilities
export type User = z.infer<typeof UserSchema>;
export type AgentManifest = z.infer<typeof AgentManifestSchema>;
export type TeamBundle = z.infer<typeof TeamBundleSchema>;
export type LicenseToken = z.infer<typeof LicenseTokenSchema>;
export type Eligibility = z.infer<typeof EligibilitySchema>;
export type Listing = z.infer<typeof ListingSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
export type LabTemplate = z.infer<typeof LabTemplateSchema>;
export type LabSession = z.infer<typeof LabSessionSchema>;
export type Program = z.infer<typeof ProgramSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;