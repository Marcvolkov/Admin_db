import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  ArrowBack,
  TableChart,
  NavigateNext,
  QueryStats
} from '@mui/icons-material';
import { TableSchema } from '../components/tables/TableSchema';
import { DataGrid } from '../components/tables/DataGrid';
import { EditDialog } from '../components/tables/EditDialog';
import { QueryExecutor } from '../components/queries/QueryExecutor';
import { queryService } from '../services/query.service';
import { dataService } from '../services/data.service';
import { PredefinedQuery, QueryResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useEnvironment } from '../hooks/useEnvironment';

export const TablePage: React.FC = () => {
  const { tableName } = useParams<{ tableName: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { currentEnvironment } = useEnvironment();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{ id: any; data: any } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [queries, setQueries] = useState<PredefinedQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);

  useEffect(() => {
    const loadQueries = async () => {
      if (!tableName) return;
      
      try {
        setLoadingQueries(true);
        const response = await queryService.getTableQueries(tableName);
        setQueries(response.queries);
      } catch (error) {
        console.error('Failed to load queries:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load predefined queries',
          severity: 'warning'
        });
      } finally {
        setLoadingQueries(false);
      }
    };

    loadQueries();
  }, [tableName]);

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
    setDeletingRecord({ id: recordId, data: rowData });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord || !tableName) return;

    try {
      const response = await dataService.deleteRecord(tableName, deletingRecord.id);
      setSnackbar({
        open: true,
        message: `Delete request created successfully. Change Request ID: ${response.change_request_id}`,
        severity: 'success'
      });
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to create delete request',
        severity: 'error'
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingRecord(null);
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

  const handleQueryExecute = (result: QueryResult) => {
    setSnackbar({
      open: true,
      message: `Query executed successfully. ${result.row_count} rows returned.`,
      severity: 'success'
    });
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
      <Box>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            aria-label="table page tabs"
          >
            <Tab 
              label="Table Data" 
              icon={<TableChart />}
              iconPosition="start"
            />
            <Tab 
              label={`Queries ${queries.length > 0 ? `(${queries.length})` : ''}`}
              icon={<QueryStats />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && (
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
        )}

        {currentTab === 1 && (
          <Box>
            <QueryExecutor
              tableName={tableName}
              queries={queries}
              onExecute={handleQueryExecute}
            />
          </Box>
        )}
      </Box>

      {/* Edit Dialog */}
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        tableName={tableName}
        recordData={editingRecord}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this record? This action will create a change request that requires approval.
            {deletingRecord && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Record ID: {deletingRecord.id}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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