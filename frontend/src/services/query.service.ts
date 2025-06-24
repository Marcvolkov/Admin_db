import { api } from './api';
import { QueriesListResponse, QueryExecution, QueryResult } from '../types';

class QueryService {
  /**
   * Get predefined queries for a table
   */
  async getTableQueries(tableName: string): Promise<QueriesListResponse> {
    try {
      return await api.get<QueriesListResponse>(`/tables/${tableName}/queries`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to get queries for table ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Execute a predefined query
   */
  async executeQuery(tableName: string, queryExecution: QueryExecution): Promise<QueryResult> {
    try {
      return await api.post<QueryResult>(`/tables/${tableName}/query`, queryExecution);
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to execute query: ${errorMessage}`);
    }
  }

  /**
   * Validate parameter value based on its type and constraints
   */
  validateParameter(parameter: any, value: any): string | null {
    if (value === null || value === undefined || value === '') {
      if (parameter.required && parameter.default === null) {
        return `${parameter.name} is required`;
      }
      return null;
    }

    switch (parameter.type) {
      case 'integer':
        const intValue = parseInt(value);
        if (isNaN(intValue)) {
          return 'Must be a valid integer';
        }
        if (parameter.min !== undefined && intValue < parameter.min) {
          return `Must be at least ${parameter.min}`;
        }
        if (parameter.max !== undefined && intValue > parameter.max) {
          return `Must be at most ${parameter.max}`;
        }
        break;

      case 'decimal':
        const floatValue = parseFloat(value);
        if (isNaN(floatValue)) {
          return 'Must be a valid number';
        }
        if (parameter.min !== undefined && floatValue < parameter.min) {
          return `Must be at least ${parameter.min}`;
        }
        if (parameter.max !== undefined && floatValue > parameter.max) {
          return `Must be at most ${parameter.max}`;
        }
        break;

      case 'text':
        if (parameter.maxLength !== undefined && value.length > parameter.maxLength) {
          return `Must be at most ${parameter.maxLength} characters`;
        }
        break;

      case 'select':
        if (parameter.options && !parameter.options.includes(value)) {
          return `Must be one of: ${parameter.options.join(', ')}`;
        }
        break;

      default:
        break;
    }

    return null;
  }

  /**
   * Get formatted SQL for display (safely escape parameter values)
   */
  formatSqlForDisplay(sql: string, parameters: Record<string, any>): string {
    let formattedSql = sql;
    
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{${key}}`;
      let displayValue = value;
      
      // Format value for display (escape quotes for strings)
      if (typeof value === 'string') {
        displayValue = `'${value.replace(/'/g, "''")}'`;
      }
      
      formattedSql = formattedSql.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), displayValue);
    }
    
    return formattedSql;
  }
}

export const queryService = new QueryService();