export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorKey?: string;
  errorParams?: Record<string, string | number>;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
