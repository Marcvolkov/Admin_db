// User and Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  created_at: string;
}

export enum Role {
  ADMIN = "admin",
  REGULAR_USER = "regular_user"
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

// Environment Types
export enum Environment {
  DEV = "dev",
  TEST = "test",
  STAGE = "stage",
  PROD = "prod"
}

// Table and Data Types
export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

export interface TableData {
  columns: string[];
  rows: any[][];
  total_count: number;
}

export interface DataFilter {
  column: string;
  operator: string;
  value: string;
}

// Change Request Types
export interface ChangeRequest {
  id: number;
  environment: string;
  table_name: string;
  record_id?: string;
  operation: OperationType;
  old_data?: string;
  new_data?: string;
  requested_by: number;
  requested_at: string;
  status: ChangeRequestStatus;
  reviewed_by?: number;
  reviewed_at?: string;
}

export interface ChangeRequestResponse extends ChangeRequest {
  requester_username?: string;
  reviewer_username?: string;
}

export enum OperationType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE"
}

export enum ChangeRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface ApprovalRequest {
  approved: boolean;
  comment?: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Form Types
export interface RecordFormData {
  [key: string]: any;
}

// Pagination Types
export interface PaginationParams {
  limit: number;
  offset: number;
}

// Navigation Types
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  adminOnly?: boolean;
}