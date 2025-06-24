import { api } from './api';
import { RecordFormData } from '../types';

class DataService {
  /**
   * Create new record in table (admin only)
   * Creates a change request, not direct change
   */
  async createRecord(tableName: string, data: RecordFormData): Promise<{ message: string; change_request_id: number }> {
    try {
      return await api.post<{ message: string; change_request_id: number }>(
        `/data/${tableName}/records`, 
        data
      );
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to create record in ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Update existing record in table (admin only)
   * Creates a change request, not direct change
   */
  async updateRecord(
    tableName: string, 
    recordId: string | number, 
    data: RecordFormData
  ): Promise<{ message: string; change_request_id: number }> {
    try {
      return await api.put<{ message: string; change_request_id: number }>(
        `/data/${tableName}/records/${recordId}`, 
        data
      );
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to update record ${recordId} in ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Delete record from table (admin only)
   * Creates a change request, not direct change
   */
  async deleteRecord(
    tableName: string, 
    recordId: string | number
  ): Promise<{ message: string; change_request_id: number }> {
    try {
      return await api.delete<{ message: string; change_request_id: number }>(
        `/data/${tableName}/records/${recordId}`
      );
    } catch (error: any) {
      const errorMessage = error?.message || error?.details?.message || 'Unknown error occurred';
      throw new Error(`Failed to delete record ${recordId} from ${tableName}: ${errorMessage}`);
    }
  }

  /**
   * Validate record data against table schema
   */
  validateRecordData(data: RecordFormData, requiredFields: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        errors.push(`${field} is required`);
      }
    });

    // Basic data type validation
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Email validation
        if (key.toLowerCase().includes('email') && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${key} must be a valid email address`);
          }
        }
        
        // Numeric validation for price fields
        if (key.toLowerCase().includes('price') && isNaN(Number(value))) {
          errors.push(`${key} must be a valid number`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize record data for submission
   */
  sanitizeRecordData(data: RecordFormData): RecordFormData {
    const sanitized: RecordFormData = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip empty strings and null values for optional fields
      if (value === '' || value === null) {
        return;
      }
      
      // Convert string numbers to actual numbers for numeric fields
      if (typeof value === 'string' && !isNaN(Number(value)) && 
          (key.toLowerCase().includes('price') || key.toLowerCase().includes('id'))) {
        sanitized[key] = Number(value);
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Prepare form data for editing
   */
  prepareFormData(rowData: any[], columns: string[]): RecordFormData {
    const formData: RecordFormData = {};
    
    columns.forEach((column, index) => {
      formData[column] = rowData[index] || '';
    });
    
    return formData;
  }
}

export const dataService = new DataService();