import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  TableChart,
  NavigateNext
} from '@mui/icons-material';
import { TableSchema } from '../components/tables/TableSchema';
import { DataGrid } from '../components/tables/DataGrid';
import { EditDialog } from '../components/tables/EditDialog';
import { useAuth } from '../hooks/useAuth';
import { useEnvironment } from '../hooks/useEnvironment';

export const TablePage: React.FC = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { currentEnvironment } = useEnvironment();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  if (!tableName) {
    return (
      <Box p={3}>
        <Alert severity="error">
          No table specified in the URL
        </Alert>
      </Box>
    );
  }

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setEditDialogOpen(true);
  };

  const handleEditRecord = (recordId: any, rowData: any) => {
    setEditingRecord(rowData);
    setEditDialogOpen(true);
  };

  const handleDeleteRecord = (recordId: any, rowData: any) => {
    // TODO: Implement delete confirmation dialog
    console.log('Delete record:', recordId, rowData);
    setSnackbar({
      open: true,
      message: 'Delete functionality will be implemented in the approval workflow',
      severity: 'info'
    });
  };

  const handleEditSuccess = (changeRequestId: number) => {
    setSnackbar({
      open: true,
      message: `Change request #${changeRequestId} created successfully. Awaiting approval.`,
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2 }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            Dashboard
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/tables')}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <TableChart sx={{ mr: 0.5 }} fontSize="inherit" />
            Tables
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {tableName}
          </Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {tableName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Environment: {currentEnvironment} • 
              {isAdmin() ? ' Admin view (can edit)' : ' Read-only view'}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/tables')}
            variant="outlined"
          >
            Back to Tables
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box display="flex" flexDirection="column" gap={3}>
        {/* Table Schema */}
        <Box>
          <TableSchema tableName={tableName} />
        </Box>

        {/* Data Grid */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Table Data
          </Typography>
          <DataGrid
            tableName={tableName}
            onEditRecord={isAdmin() ? handleEditRecord : undefined}
            onDeleteRecord={isAdmin() ? handleDeleteRecord : undefined}
            onCreateRecord={isAdmin() ? handleCreateRecord : undefined}
          />
        </Box>
      </Box>

      {/* Edit Dialog */}
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        tableName={tableName}
        recordData={editingRecord}
        onSuccess={handleEditSuccess}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};