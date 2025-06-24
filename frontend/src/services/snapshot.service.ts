import { api } from './api';
import { SnapshotResponse, SnapshotListResponse, SnapshotStats } from '../types/snapshot';

class SnapshotService {
  /**
   * Get list of snapshots with optional filtering (admin only)
   */
  async getSnapshots(params?: {
    environment?: string;
    table_name?: string;
    change_request_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<SnapshotListResponse[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.environment) queryParams.append('environment', params.environment);
      if (params?.table_name) queryParams.append('table_name', params.table_name);
      if (params?.change_request_id) queryParams.append('change_request_id', params.change_request_id.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const url = `/snapshots/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await api.get<SnapshotListResponse[]>(url);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get snapshots: ${errorMessage}`);
    }
  }

  /**
   * Get specific snapshot data (admin only)
   */
  async getSnapshot(snapshotId: number): Promise<SnapshotResponse> {
    try {
      return await api.get<SnapshotResponse>(`/snapshots/${snapshotId}`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get snapshot ${snapshotId}: ${errorMessage}`);
    }
  }

  /**
   * Get snapshots for a specific change request (admin only)
   */
  async getSnapshotsForChangeRequest(changeRequestId: number): Promise<SnapshotListResponse[]> {
    try {
      return await api.get<SnapshotListResponse[]>(`/snapshots/change-request/${changeRequestId}`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get snapshots for change request ${changeRequestId}: ${errorMessage}`);
    }
  }

  /**
   * Delete a snapshot (admin only)
   */
  async deleteSnapshot(snapshotId: number): Promise<{ message: string }> {
    try {
      return await api.delete<{ message: string }>(`/snapshots/${snapshotId}`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to delete snapshot ${snapshotId}: ${errorMessage}`);
    }
  }

  /**
   * Get snapshot statistics (admin only)
   */
  async getSnapshotStats(): Promise<SnapshotStats> {
    try {
      return await api.get<SnapshotStats>('/snapshots/stats/summary');
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get snapshot statistics: ${errorMessage}`);
    }
  }

  /**
   * Format snapshot data size for display
   */
  formatDataSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format snapshot creation date for display
   */
  formatSnapshotDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Get environment color for UI
   */
  getEnvironmentColor(environment: string): string {
    const colors: Record<string, string> = {
      'dev': '#2196f3',      // Blue
      'test': '#ff9800',     // Orange
      'stage': '#9c27b0',    // Purple
      'prod': '#f44336',     // Red
    };
    
    return colors[environment.toLowerCase()] || '#757575';
  }

  /**
   * Extract snapshot ID from approval message
   */
  extractSnapshotIdFromMessage(message: string): number | null {
    const match = message.match(/snapshot #(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Generate snapshot summary text
   */
  generateSnapshotSummary(snapshot: SnapshotListResponse): string {
    return `${snapshot.table_name} (${snapshot.environment}) - ${snapshot.row_count} rows, ${this.formatDataSize(snapshot.data_size)}`;
  }
}

export const snapshotService = new SnapshotService();