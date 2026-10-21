import z from 'zod';

const SubscriptionEventSchema = z.object({
  event: z.record(z.string(), z.any()),
  subscription: z.object({
    type: z.string(),
  }),
});

type SubscriptionEvent = z.infer<typeof SubscriptionEventSchema>;

export const isSubscriptionEvent = (data: unknown): data is SubscriptionEvent => {
  return SubscriptionEventSchema.safeParse(data).success;
};

const EventSubReconnectMessageSchema = z.object({
  metadata: z.object({
    message_id: z.string(),
    message_type: z.literal('session_reconnect'),
    message_timestamp: z.string(),
  }),
  payload: z.object({
    session: z.object({
      id: z.string(),
      status: z.string(),
      keepalive_timeout_seconds: z.number().nullable(),
      reconnect_url: z.string(),
      connected_at: z.string(),
    }),
  }),
});

type EventSubReconnectMessage = z.infer<typeof EventSubReconnectMessageSchema>;

export const isEventSubReconnectMessage = (data: unknown): data is EventSubReconnectMessage => {
  return EventSubReconnectMessageSchema.safeParse(data).success;
};

const EventSubWelcomeMessageSchema = z.object({
  metadata: z.object({
    message_id: z.string(),
    message_type: z.literal('session_welcome'),
    message_timestamp: z.string(),
  }),
  payload: z.object({
    session: z.object({
      id: z.string(),
      status: z.string(),
      connected_at: z.string(),
      keepalive_timeout_seconds: z.number().nullable(),
      reconnect_url: z.string().nullable(),
    }),
  }),
});

type EventSubWelcomeMessage = z.infer<typeof EventSubWelcomeMessageSchema>;

export const isEventSubWelcomeMessage = (data: unknown): data is EventSubWelcomeMessage => {
  return EventSubWelcomeMessageSchema.safeParse(data).success;
};
