import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Toolbar,
  Tooltip
} from '@mui/material';
import {
  DataGrid as MuiDataGrid,
  GridColDef,
  GridRowsProp,
  GridPaginationModel,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridRenderCellParams,
  GridActionsCellItem
} from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Visibility
} from '@mui/icons-material';
import { TableData, ColumnInfo, PaginationParams } from '../../types';
import { tableService } from '../../services/table.service';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, truncateText } from '../../utils';

interface DataGridProps {
  tableName: string;
  onEditRecord?: (recordId: any, rowData: any) => void;
  onDeleteRecord?: (recordId: any, rowData: any) => void;
  onCreateRecord?: () => void;
}

function CustomToolbar(props: any) {
  return (
    <GridToolbarContainer>
      <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
        <Box>
          <GridToolbarFilterButton />
          <GridToolbarDensitySelector />
          <GridToolbarExport />
        </Box>
        <Box>
          {props.canEdit && props.onCreateRecord && (
            <Button
              startIcon={<Add />}
              onClick={props.onCreateRecord}
              variant="contained"
              size="small"
              sx={{ mr: 1 }}
            >
              Add Record
            </Button>
          )}
          <Tooltip title="Refresh data">
            <IconButton onClick={props.onRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </GridToolbarContainer>
  );
}

export const DataGrid: React.FC<DataGridProps> = ({
  tableName,
  onEditRecord,
  onDeleteRecord,
  onCreateRecord
}) => {
  const { isAdmin } = useAuth();
  const canEdit = isAdmin();

  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const loadData = useCallback(async (pagination?: GridPaginationModel) => {
    try {
      setLoading(true);
      setError('');
      
      const paginationParams: PaginationParams = {
        limit: pagination?.pageSize || paginationModel.pageSize,
        offset: (pagination?.page || paginationModel.page) * (pagination?.pageSize || paginationModel.pageSize),
      };
      
      const data = await tableService.getTableData(tableName, paginationParams);
      setTableData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load table data');
      setTableData(null);
    } finally {
      setLoading(false);
    }
  }, [tableName, paginationModel.pageSize, paginationModel.page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
    loadData(newModel);
  };

  const handleRefresh = () => {
    loadData();
  };

  const renderCellValue = (params: GridRenderCellParams) => {
    const { value } = params;
    
    if (value === null || value === undefined) {
      return (
        <Chip label="NULL" size="small" variant="outlined" color="default" />
      );
    }
    
    if (typeof value === 'boolean') {
      return (
        <Chip 
          label={value ? 'TRUE' : 'FALSE'} 
          size="small" 
          color={value ? 'success' : 'error'}
          variant="outlined"
        />
      );
    }
    
    if (typeof value === 'string') {
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
        return (
          <Tooltip title={value}>
            <span>{formatDate(value)}</span>
          </Tooltip>
        );
      }
      
      // Truncate long strings
      if (value.length > 50) {
        return (
          <Tooltip title={value}>
            <span>{truncateText(value, 50)}</span>
          </Tooltip>
        );
      }
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  const generateColumns = (): GridColDef[] => {
    if (!tableData) return [];
    
    const columns: GridColDef[] = tableData.columns.map((columnName, index) => ({
      field: columnName,
      headerName: columnName,
      flex: 1,
      minWidth: 120,
      renderCell: renderCellValue,
    }));

    // Add actions column for admins
    if (canEdit && (onEditRecord || onDeleteRecord)) {
      columns.push({
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 120,
        getActions: (params) => {
          const actions = [];
          
          if (onEditRecord) {
            actions.push(
              <GridActionsCellItem
                icon={<Edit />}
                label="Edit"
                onClick={() => onEditRecord(params.row[tableData.columns[0]], params.row)}
              />
            );
          }
          
          if (onDeleteRecord) {
            actions.push(
              <GridActionsCellItem
                icon={<Delete style={{ color: '#d32f2f' }} />}
                label="Delete"
                onClick={() => onDeleteRecord(params.row[tableData.columns[0]], params.row)}
              />
            );
          }
          
          // Always add view action
          actions.push(
            <GridActionsCellItem
              icon={<Visibility />}
              label="View"
              onClick={() => {
                // TODO: Implement view dialog
                console.log('View record:', params.row);
              }}
            />
          );
          
          return actions;
        },
      });
    }

    return columns;
  };

  const generateRows = (): GridRowsProp => {
    if (!tableData) return [];
    
    return tableData.rows.map((row, index) => {
      const rowObject: any = { id: index };
      tableData.columns.forEach((column, colIndex) => {
        rowObject[column] = row[colIndex];
      });
      return rowObject;
    });
  };

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ height: 600, width: '100%' }}>
        {loading && <LinearProgress />}
        
        <MuiDataGrid
          rows={generateRows()}
          columns={generateColumns()}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 25, 50, 100]}
          rowCount={tableData?.total_count || 0}
          paginationMode="server"
          loading={loading}
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomToolbar,
          }}
          slotProps={{
            toolbar: {
              onRefresh: handleRefresh,
              onCreateRecord: onCreateRecord,
              canEdit: canEdit,
            } as any,
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              borderRight: 1,
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'grey.50',
              borderBottom: 2,
              borderColor: 'primary.main',
            },
          }}
        />
      </Paper>
      
      {tableData && (
        <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            Showing {tableData.rows.length} of {tableData.total_count.toLocaleString()} records
            {canEdit ? ' • Click on actions to edit or delete records' : ' • Read-only view'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};