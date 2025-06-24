import { api } from './api';
import { ChangeRequestResponse, ApprovalRequest } from '../types';

class ApprovalService {
  /**
   * Get list of pending change requests (admin only)
   */
  async getPendingChanges(): Promise<ChangeRequestResponse[]> {
    try {
      return await api.get<ChangeRequestResponse[]>('/approvals/pending');
    } catch (error) {
      throw new Error(`Failed to get pending changes: ${error}`);
    }
  }

  /**
   * Get specific change request details with diff (admin only)
   */
  async getChangeDetails(changeId: number): Promise<ChangeRequestResponse> {
    try {
      return await api.get<ChangeRequestResponse>(`/approvals/${changeId}`);
    } catch (error) {
      throw new Error(`Failed to get change details for ID ${changeId}: ${error}`);
    }
  }

  /**
   * Approve change request (admin only)
   */
  async approveChange(
    changeId: number, 
    comment?: string
  ): Promise<{ message: string; status: string }> {
    try {
      const approvalRequest: ApprovalRequest = {
        approved: true,
        comment
      };
      
      return await api.post<{ message: string; status: string }>(
        `/approvals/${changeId}/approve`,
        approvalRequest
      );
    } catch (error) {
      throw new Error(`Failed to approve change ${changeId}: ${error}`);
    }
  }

  /**
   * Reject change request (admin only)
   */
  async rejectChange(
    changeId: number, 
    reason?: string
  ): Promise<{ message: string; status: string }> {
    try {
      const approvalRequest: ApprovalRequest = {
        approved: false,
        comment: reason
      };
      
      return await api.post<{ message: string; status: string }>(
        `/approvals/${changeId}/reject`,
        approvalRequest
      );
    } catch (error) {
      throw new Error(`Failed to reject change ${changeId}: ${error}`);
    }
  }

  /**
   * Get history of all processed changes (admin only)
   */
  async getChangeHistory(): Promise<ChangeRequestResponse[]> {
    try {
      return await api.get<ChangeRequestResponse[]>('/approvals/history');
    } catch (error) {
      throw new Error(`Failed to get change history: ${error}`);
    }
  }

  /**
   * Parse JSON data safely
   */
  parseJsonData(jsonString: string | null | undefined): any {
    if (!jsonString) return null;
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON data:', error);
      return null;
    }
  }

  /**
   * Generate diff between old and new data
   */
  generateDiff(oldData: any, newData: any): Array<{ field: string; oldValue: any; newValue: any; type: 'added' | 'removed' | 'changed' }> {
    const diff: Array<{ field: string; oldValue: any; newValue: any; type: 'added' | 'removed' | 'changed' }> = [];
    
    if (!oldData && newData) {
      // New record
      Object.entries(newData).forEach(([key, value]) => {
        diff.push({
          field: key,
          oldValue: null,
          newValue: value,
          type: 'added'
        });
      });
    } else if (oldData && !newData) {
      // Deleted record
      Object.entries(oldData).forEach(([key, value]) => {
        diff.push({
          field: key,
          oldValue: value,
          newValue: null,
          type: 'removed'
        });
      });
    } else if (oldData && newData) {
      // Modified record
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      
      allKeys.forEach(key => {
        const oldValue = oldData[key];
        const newValue = newData[key];
        
        if (oldValue !== newValue) {
          diff.push({
            field: key,
            oldValue,
            newValue,
            type: oldValue === undefined ? 'added' : newValue === undefined ? 'removed' : 'changed'
          });
        }
      });
    }
    
    return diff;
  }

  /**
   * Format change request for display
   */
  formatChangeForDisplay(change: ChangeRequestResponse): {
    title: string;
    description: string;
    oldData: any;
    newData: any;
    diff: any[];
  } {
    const oldData = this.parseJsonData(change.old_data);
    const newData = this.parseJsonData(change.new_data);
    const diff = this.generateDiff(oldData, newData);
    
    const operationTitles = {
      CREATE: 'Create New Record',
      UPDATE: 'Update Record',
      DELETE: 'Delete Record'
    };
    
    const title = `${operationTitles[change.operation]} in ${change.table_name}`;
    const description = `${change.operation} operation in ${change.environment} environment`;
    
    return {
      title,
      description,
      oldData,
      newData,
      diff
    };
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': '#ff9800',   // Orange
      'APPROVED': '#4caf50',  // Green
      'REJECTED': '#f44336',  // Red
    };
    
    return colors[status] || '#757575';
  }

  /**
   * Get operation icon
   */
  getOperationIcon(operation: string): string {
    const icons: Record<string, string> = {
      'CREATE': 'add',
      'UPDATE': 'edit',
      'DELETE': 'delete',
    };
    
    return icons[operation] || 'help';
  }
}

export const approvalService = new ApprovalService();