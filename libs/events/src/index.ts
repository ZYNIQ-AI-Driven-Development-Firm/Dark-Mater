import { z } from 'zod';
import { connect, NatsConnection, JSONCodec } from 'nats';
import { createClient, RedisClientType } from 'redis';

// Event schemas using Zod
export const UserEnrolledSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

export const SandboxLaunchedSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  templateId: z.string(),
  agentIds: z.array(z.string()),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

export const SubmissionCreatedSchema = z.object({
  submissionId: z.string(),
  programId: z.string(),
  userId: z.string(),
  teamId: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

export const OrderCompletedSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    listingId: z.string(),
    type: z.enum(['agent', 'team', 'tool', 'plugin']),
    priceCents: z.number()
  })),
  totalCents: z.number(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

export const CertificateIssuedSchema = z.object({
  certificateId: z.string(),
  userId: z.string(),
  courseId: z.string(),
  credentialJws: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

// Event type map
export const EventSchemas = {
  'dm.user.enrolled': UserEnrolledSchema,
  'dm.labs.sandbox.launched': SandboxLaunchedSchema,
  'dm.arena.submitted': SubmissionCreatedSchema,
  'dm.marketplace.order.completed': OrderCompletedSchema,
  'dm.academy.cert.issued': CertificateIssuedSchema
} as const;

export type EventType = keyof typeof EventSchemas;
export type EventData<T extends EventType> = z.infer<typeof EventSchemas[T]>;

// Event publisher interface
export interface EventPublisher {
  publish<T extends EventType>(topic: T, data: EventData<T>): Promise<void>;
  close(): Promise<void>;
}

// NATS implementation
export class NatsEventPublisher implements EventPublisher {
  private nc: NatsConnection | null = null;
  private jc = JSONCodec();

  constructor(private url: string) {}

  async connect(): Promise<void> {
    this.nc = await connect({ servers: this.url });
  }

  async publish<T extends EventType>(topic: T, data: EventData<T>): Promise<void> {
    if (!this.nc) {
      throw new Error('Not connected to NATS');
    }

    // Validate data against schema
    const schema = EventSchemas[topic];
    const validatedData = schema.parse(data);

    await this.nc.publish(topic, this.jc.encode(validatedData));
  }

  async close(): Promise<void> {
    if (this.nc) {
      await this.nc.close();
    }
  }
}

// Redis Streams implementation
export class RedisEventPublisher implements EventPublisher {
  private client: RedisClientType | null = null;

  constructor(private url: string) {}

  async connect(): Promise<void> {
    this.client = createClient({ url: this.url });
    await this.client.connect();
  }

  async publish<T extends EventType>(topic: T, data: EventData<T>): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Redis');
    }

    // Validate data against schema
    const schema = EventSchemas[topic];
    const validatedData = schema.parse(data);

    await this.client.xAdd(topic, '*', validatedData as any);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

// Factory function
export function createEventPublisher(type: 'nats' | 'redis', url: string): EventPublisher {
  switch (type) {
    case 'nats':
      return new NatsEventPublisher(url);
    case 'redis':
      return new RedisEventPublisher(url);
    default:
      throw new Error(`Unknown publisher type: ${type}`);
  }
}