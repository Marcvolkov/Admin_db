import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Alert,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import { Save, Cancel, Compare } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { TableInfo, RecordFormData } from '../../types';
import { tableService } from '../../services/table.service';
import { dataService } from '../../services/data.service';

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  tableName: string;
  recordData?: any; // Existing record data for editing, null for new record
  onSuccess?: (changeRequestId: number) => void;
}

export const EditDialog: React.FC<EditDialogProps> = ({
  open,
  onClose,
  tableName,
  recordData,
  onSuccess
}) => {
  const isEdit = !!recordData;
  const [schema, setSchema] = useState<TableInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<RecordFormData>();
  const formValues = watch();

  useEffect(() => {
    if (open) {
      loadSchema();
    }
  }, [open, tableName]);

  useEffect(() => {
    if (schema && recordData) {
      // Populate form with existing data
      const formData: RecordFormData = {};
      schema.columns.forEach((column, index) => {
        formData[column.name] = recordData[column.name] || '';
      });
      reset(formData);
    } else if (schema) {
      // Reset form for new record
      const formData: RecordFormData = {};
      schema.columns.forEach((column) => {
        formData[column.name] = '';
      });
      reset(formData);
    }
  }, [schema, recordData, reset]);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError('');
      const tableSchema = await tableService.getTableSchema(tableName);
      setSchema(tableSchema);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load table schema');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RecordFormData) => {
    if (!schema) return;

    try {
      setSubmitting(true);
      setError('');

      // Validate and sanitize data
      const requiredFields = schema.columns
        .filter(col => !col.nullable && !col.primary_key)
        .map(col => col.name);

      const validation = dataService.validateRecordData(data, requiredFields);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      const sanitizedData = dataService.sanitizeRecordData(data);

      let result;
      if (isEdit && recordData) {
        // Update existing record
        const primaryKey = schema.columns.find(col => col.primary_key);
        if (!primaryKey) {
          setError('No primary key found for this table');
          return;
        }
        const recordId = recordData[primaryKey.name];
        result = await dataService.updateRecord(tableName, recordId, sanitizedData);
      } else {
        // Create new record
        result = await dataService.createRecord(tableName, sanitizedData);
      }

      onSuccess?.(result.change_request_id);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (column: any) => {
    const fieldName = column.name;
    const dataType = column.type.toLowerCase();
    const isRequired = !column.nullable && !column.primary_key;
    const isPrimaryKey = column.primary_key;

    // Skip auto-generated primary keys for new records
    if (!isEdit && isPrimaryKey && (dataType.includes('serial') || dataType.includes('auto'))) {
      return null;
    }

    const commonProps = {
      fullWidth: true,
      margin: 'normal' as const,
      disabled: isPrimaryKey && isEdit, // Disable primary key editing
      required: isRequired,
      error: !!errors[fieldName],
      helperText: (errors[fieldName]?.message as string) || `${column.type}${isRequired ? ' (Required)' : ''}`,
    };

    if (dataType.includes('boolean') || dataType.includes('bool')) {
      return (
        <Controller
          key={fieldName}
          name={fieldName}
          control={control}
          rules={{ required: isRequired ? `${fieldName} is required` : false }}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value === true || field.value === 'true'}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={`${fieldName} ${isRequired ? '*' : ''}`}
            />
          )}
        />
      );
    }

    if (dataType.includes('text') || (dataType.includes('varchar') && dataType.includes('255'))) {
      return (
        <Controller
          key={fieldName}
          name={fieldName}
          control={control}
          rules={{ required: isRequired ? `${fieldName} is required` : false }}
          render={({ field }) => (
            <TextField
              {...field}
              {...commonProps}
              label={fieldName}
              multiline
              rows={3}
            />
          )}
        />
      );
    }

    if (dataType.includes('int') || dataType.includes('decimal') || dataType.includes('numeric')) {
      return (
        <Controller
          key={fieldName}
          name={fieldName}
          control={control}
          rules={{ required: isRequired ? `${fieldName} is required` : false }}
          render={({ field }) => (
            <TextField
              {...field}
              {...commonProps}
              label={fieldName}
              type="number"
            />
          )}
        />
      );
    }

    return (
      <Controller
        key={fieldName}
        name={fieldName}
        control={control}
        rules={{ required: isRequired ? `${fieldName} is required` : false }}
        render={({ field }) => (
          <TextField
            {...field}
            {...commonProps}
            label={fieldName}
          />
        )}
      />
    );
  };

  const renderDiff = () => {
    if (!isEdit || !recordData || !schema) return null;

    return (
      <Box mt={2}>
        <Typography variant="h6" gutterBottom>
          Changes Preview
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          {schema.columns.map((column) => {
            const oldValue = recordData[column.name];
            const newValue = formValues[column.name];
            const hasChanged = oldValue !== newValue;

            if (!hasChanged) return null;

            return (
              <Box key={column.name} width="100%">
                <Box p={1} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    {column.name}
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip
                      label={oldValue || 'NULL'}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                    <Typography variant="caption">→</Typography>
                    <Chip
                      label={newValue || 'NULL'}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isEdit ? 'Edit Record' : 'Create Record'} - {tableName}
          </Typography>
          {isEdit && (
            <Button
              startIcon={<Compare />}
              onClick={() => setShowDiff(!showDiff)}
              size="small"
            >
              {showDiff ? 'Hide' : 'Show'} Changes
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : schema ? (
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {isEdit 
                ? 'Changes will be submitted for approval before being applied to the database.'
                : 'This record will be submitted for approval before being added to the database.'
              }
            </Alert>

            <Box display="flex" flexDirection="column" gap={2}>
              {schema.columns.map((column) => (
                <Box key={column.name}>
                  {renderField(column)}
                </Box>
              ))}
            </Box>

            {showDiff && (
              <>
                <Divider sx={{ my: 3 }} />
                {renderDiff()}
              </>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          <Cancel sx={{ mr: 1 }} />
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={submitting || loading || !schema}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ mr: 1 }} />
          ) : (
            <Save sx={{ mr: 1 }} />
          )}
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};