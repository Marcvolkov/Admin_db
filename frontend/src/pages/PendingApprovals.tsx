import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Visibility,
  Check,
  Close,
  Schedule,
  Person,
  TableChart
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ChangeRequestResponse } from '../types';
import { approvalService } from '../services/approval.service';
import { snapshotService } from '../services/snapshot.service';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { formatRelativeDate } from '../utils';

export const PendingApprovals: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessSnackbar, showErrorSnackbar } = useErrorHandler();

  const [changes, setChanges] = useState<ChangeRequestResponse[]>([]);
  const [filteredChanges, setFilteredChanges] = useState<ChangeRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterOperation, setFilterOperation] = useState('');

  useEffect(() => {
    loadPendingChanges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterTable, filterOperation, changes]);

  const loadPendingChanges = async () => {
    try {
      setLoading(true);
      setError('');
      const pending = await approvalService.getPendingChanges();
      setChanges(pending);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load pending changes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...changes];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(change =>
        change.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        change.requester_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        change.operation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Table filter
    if (filterTable) {
      filtered = filtered.filter(change => change.table_name === filterTable);
    }

    // Operation filter
    if (filterOperation) {
      filtered = filtered.filter(change => change.operation === filterOperation);
    }

    setFilteredChanges(filtered);
  };

  const handleViewDetails = (changeId: number) => {
    navigate(`/approvals/${changeId}`);
  };

  const handleQuickApprove = async (changeId: number) => {
    try {
      const result = await approvalService.approveChange(changeId);
      
      // Extract snapshot ID from the response message
      const snapshotId = snapshotService.extractSnapshotIdFromMessage(result.message);
      
      // Show success notification with snapshot information
      if (snapshotId) {
        showSuccessSnackbar(`✅ Change approved and applied! Snapshot #${snapshotId} created.`);
      } else {
        showSuccessSnackbar('✅ Change approved and applied successfully!');
      }
      
      await loadPendingChanges(); // Refresh the list
    } catch (error) {
      showErrorSnackbar(error instanceof Error ? error.message : 'Failed to approve change');
    }
  };

  const handleQuickReject = async (changeId: number) => {
    try {
      await approvalService.rejectChange(changeId, 'Quick reject from list view');
      await loadPendingChanges(); // Refresh the list
    } catch (error) {
      console.error('Failed to reject change:', error);
    }
  };

  const getUniqueValues = (key: keyof ChangeRequestResponse) => {
    return Array.from(new Set(changes.map(change => change[key]).filter(Boolean)));
  };

  const renderChangeCard = (change: ChangeRequestResponse) => {
    const formattedChange = approvalService.formatChangeForDisplay(change);

    return (
      <Box key={change.id} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)' } }}>
        <Card 
          sx={{ 
            height: '100%',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          <CardContent>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  #{change.id}
                </Typography>
                <Chip
                  icon={approvalService.getOperationIcon(change.operation) === 'add' ? <Check /> : 
                        approvalService.getOperationIcon(change.operation) === 'edit' ? <Refresh /> : <Close />}
                  label={change.operation}
                  size="small"
                  color={
                    change.operation === 'CREATE' ? 'success' : 
                    change.operation === 'UPDATE' ? 'info' : 'error'
                  }
                />
              </Box>
              <Chip
                icon={<Schedule />}
                label="PENDING"
                size="small"
                color="warning"
                variant="outlined"
              />
            </Box>

            {/* Details */}
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <TableChart fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {change.table_name} • {change.environment}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={1}>
                <Person fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {change.requester_username || `User #${change.requested_by}`}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                {formatRelativeDate(change.requested_at)}
              </Typography>
            </Box>

            {/* Description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {formattedChange.description}
            </Typography>

            {/* Actions */}
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Visibility />}
                onClick={() => handleViewDetails(change.id)}
                fullWidth
              >
                View Details
              </Button>
              <Tooltip title="Quick approve">
                <IconButton
                  color="success"
                  onClick={() => handleQuickApprove(change.id)}
                  size="small"
                >
                  <Check />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quick reject">
                <IconButton
                  color="error"
                  onClick={() => handleQuickReject(change.id)}
                  size="small"
                >
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Pending Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve database change requests
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadPendingChanges}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">
              Filters
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
            <Box flex={1}>
              <TextField
                fullWidth
                placeholder="Search by table, user, or operation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box flex={1}>
              <FormControl fullWidth>
                <InputLabel>Table</InputLabel>
                <Select
                  value={filterTable}
                  label="Table"
                  onChange={(e) => setFilterTable(e.target.value)}
                >
                  <MenuItem value="">All Tables</MenuItem>
                  {getUniqueValues('table_name').map((table) => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box flex={1}>
              <FormControl fullWidth>
                <InputLabel>Operation</InputLabel>
                <Select
                  value={filterOperation}
                  label="Operation"
                  onChange={(e) => setFilterOperation(e.target.value)}
                >
                  <MenuItem value="">All Operations</MenuItem>
                  <MenuItem value="CREATE">Create</MenuItem>
                  <MenuItem value="UPDATE">Update</MenuItem>
                  <MenuItem value="DELETE">Delete</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Changes List */}
      {filteredChanges.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || filterTable || filterOperation 
              ? 'No pending changes match your filters'
              : 'No pending changes'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterTable || filterOperation
              ? 'Try adjusting your search or filter criteria'
              : 'All change requests have been processed'
            }
          </Typography>
        </Box>
      ) : (
        <>
          {/* Summary */}
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredChanges.length} of {changes.length} pending change{changes.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Changes Grid */}
          <Box display="flex" flexWrap="wrap" gap={3}>
            {filteredChanges.map(renderChangeCard)}
          </Box>
        </>
      )}
    </Box>
  );
};