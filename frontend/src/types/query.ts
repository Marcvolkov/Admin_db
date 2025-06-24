export enum ParameterType {
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  TEXT = 'text',
  SELECT = 'select',
  DATE = 'date',
  BOOLEAN = 'boolean'
}

export interface QueryParameter {
  name: string;
  type: ParameterType;
  description: string;
  default?: string | number | boolean;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  options?: string[];
}

export interface PredefinedQuery {
  id: string;
  name: string;
  description: string;
  sql: string;
  parameters: QueryParameter[];
}

export interface QueryExecution {
  query_id: string;
  parameters: Record<string, any>;
}

export interface QueryResult {
  query_id: string;
  query_name: string;
  columns: string[];
  rows: Record<string, any>[];
  row_count: number;
  executed_sql: string;
  parameters: Record<string, any>;
}

export interface QueriesListResponse {
  table_name: string;
  queries: PredefinedQuery[];
}