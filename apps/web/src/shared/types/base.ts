export interface BaseEntity {
  id: string;
  created_date: string;
  updated_date: string;
}

export type Iso8601Date = string;
export type Iso8601DateTime = string;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
