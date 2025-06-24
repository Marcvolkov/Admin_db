import { api } from './api';
import { TableInfo, TableData, DataFilter, PaginationParams } from '../types';

class TableService {
  /**
   * Get list of all tables in current environment
   */
  async getTables(): Promise<string[]> {
    try {
      return await api.get<string[]>('/tables');
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get tables: ${errorMessage}`);
    }
  }

  /**
   * Get table schema information
   */
  async getTableSchema(tableName: string): Promise<TableInfo> {
    try {
      return await api.get<TableInfo>(`/tables/${tableName}/schema`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get table schema for ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Get paginated table data with optional filters
   */
  async getTableData(
    tableName: string, 
    pagination: PaginationParams = { limit: 100, offset: 0 },
    filters?: DataFilter[]
  ): Promise<TableData> {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      // Add filters as query parameters if provided
      if (filters && filters.length > 0) {
        filters.forEach((filter, index) => {
          params.append(`filter_${index}_column`, filter.column);
          params.append(`filter_${index}_operator`, filter.operator);
          params.append(`filter_${index}_value`, filter.value);
        });
      }

      return await api.get<TableData>(`/tables/${tableName}/data?${params.toString()}`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get table data for ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Execute predefined query on table
   */
  async executeQuery(tableName: string, queryId: string, params?: Record<string, any>): Promise<any> {
    try {
      return await api.post(`/tables/${tableName}/query`, {
        query_id: queryId,
        parameters: params || {}
      });
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to execute query ${queryId} on ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Get table row count
   */
  async getTableRowCount(tableName: string): Promise<number> {
    try {
      const data = await this.getTableData(tableName, { limit: 1, offset: 0 });
      return data.total_count;
    } catch (error) {
      throw new Error(`Failed to get row count for ${tableName}: ${error}`);
    }
  }

  /**
   * Build filter query string
   */
  buildFilterQuery(filters: DataFilter[]): string {
    if (!filters || filters.length === 0) return '';
    
    const filterParams = filters.map((filter, index) => {
      return `filter_${index}_column=${encodeURIComponent(filter.column)}&` +
             `filter_${index}_operator=${encodeURIComponent(filter.operator)}&` +
             `filter_${index}_value=${encodeURIComponent(filter.value)}`;
    });
    
    return filterParams.join('&');
  }

  /**
   * Validate filter parameters
   */
  validateFilter(filter: DataFilter): boolean {
    const validOperators = ['eq', 'like', 'gt', 'lt', 'gte', 'lte', 'ne'];
    
    return !!(
      filter.column && 
      filter.operator && 
      validOperators.includes(filter.operator) &&
      filter.value !== undefined
    );
  }
}

export const tableService = new TableService();