/**
 * Snapshot-related TypeScript interfaces
 */

export interface SnapshotBase {
  environment: string;
  table_name: string;
  change_request_id: number;
}

export interface SnapshotListResponse extends SnapshotBase {
  id: number;
  created_at: string;
  row_count: number;
  data_size: number;
}

export interface SnapshotResponse extends SnapshotBase {
  id: number;
  created_at: string;
  snapshot_data: Array<Record<string, any>>;
  row_count: number;
  data_size: number;
}

export interface SnapshotStats {
  total_snapshots: number;
  by_environment: Record<string, number>;
  by_table: Record<string, number>;
}

export interface SnapshotFilters {
  environment?: string;
  table_name?: string;
  change_request_id?: number;
  limit?: number;
  offset?: number;
}