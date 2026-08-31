export interface WebhookLog {
  id: string;
  brandId?: string | null;
  event: string;
  url: string;
  status?: number | null;
  success: boolean;
  payload: string;
  response?: string | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  attempts: number;
  nextAttemptAt?: string | Date | null;
  createdAt: string | Date;
}
