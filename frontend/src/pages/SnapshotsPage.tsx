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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Visibility,
  Delete,
  Storage,
  Timeline,
  TableChart,
  CloudDownload
} from '@mui/icons-material';
import { SnapshotListResponse, SnapshotResponse, SnapshotStats } from '../types';
import { snapshotService } from '../services/snapshot.service';
import { useErrorHandler } from '../hooks/useErrorHandler';

export const SnapshotsPage: React.FC = () => {
  const { showSuccessSnackbar, showErrorSnackbar } = useErrorHandler();

  const [snapshots, setSnapshots] = useState<SnapshotListResponse[]>([]);
  const [filteredSnapshots, setFilteredSnapshots] = useState<SnapshotListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [stats, setStats] = useState<SnapshotStats | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Snapshot viewer dialog
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotResponse | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  useEffect(() => {
    loadSnapshots();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterEnvironment, filterTable, snapshots]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await snapshotService.getSnapshots({ limit: 100 });
      setSnapshots(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load snapshots';
      setError(errorMessage);
      showErrorSnackbar(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await snapshotService.getSnapshotStats();
      setStats(statsData);
    } catch (error) {
      console.warn('Failed to load snapshot statistics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...snapshots];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(snapshot =>
        snapshot.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snapshot.environment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snapshot.change_request_id.toString().includes(searchTerm.toLowerCase())
      );
    }

    // Environment filter
    if (filterEnvironment) {
      filtered = filtered.filter(snapshot => snapshot.environment === filterEnvironment);
    }

    // Table filter
    if (filterTable) {
      filtered = filtered.filter(snapshot => snapshot.table_name === filterTable);
    }

    setFilteredSnapshots(filtered);
    setPage(0); // Reset to first page when filtering
  };

  const handleViewSnapshot = async (snapshotId: number) => {
    try {
      setLoadingSnapshot(true);
      const snapshotData = await snapshotService.getSnapshot(snapshotId);
      setSelectedSnapshot(snapshotData);
      setViewerOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load snapshot data';
      showErrorSnackbar(errorMessage);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: number) => {
    if (!window.confirm('Are you sure you want to delete this snapshot? This action cannot be undone.')) {
      return;
    }

    try {
      await snapshotService.deleteSnapshot(snapshotId);
      showSuccessSnackbar('Snapshot deleted successfully');
      await loadSnapshots();
      await loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete snapshot';
      showErrorSnackbar(errorMessage);
    }
  };

  const handleExportSnapshot = (snapshot: SnapshotListResponse) => {
    // This would implement snapshot export functionality
    showSuccessSnackbar(`Export functionality for snapshot #${snapshot.id} coming soon!`);
  };

  const getUniqueValues = (key: keyof SnapshotListResponse) => {
    return Array.from(new Set(snapshots.map(snapshot => snapshot[key]).filter(Boolean)));
  };

  const paginatedSnapshots = filteredSnapshots.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Database Snapshots
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => { loadSnapshots(); loadStats(); }}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {stats.total_snapshots}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Snapshots
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="secondary">
                  {Object.keys(stats.by_environment).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Environments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {Object.keys(stats.by_table).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {Math.max(...Object.values(stats.by_environment))}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Max per Env
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search snapshots..."
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
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={filterEnvironment}
                  label="Environment"
                  onChange={(e) => setFilterEnvironment(e.target.value)}
                >
                  <MenuItem value="">All Environments</MenuItem>
                  {getUniqueValues('environment').map((env) => (
                    <MenuItem key={env} value={env}>
                      {String(env)?.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterEnvironment('');
                  setFilterTable('');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Snapshots Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Environment</TableCell>
                <TableCell>Table</TableCell>
                <TableCell>Change Request</TableCell>
                <TableCell>Rows</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSnapshots.map((snapshot) => (
                <TableRow key={snapshot.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{snapshot.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={snapshot.environment.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: snapshotService.getEnvironmentColor(snapshot.environment),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TableChart fontSize="small" />
                      {snapshot.table_name}
                    </Box>
                  </TableCell>
                  <TableCell>#{snapshot.change_request_id}</TableCell>
                  <TableCell>{snapshot.row_count.toLocaleString()}</TableCell>
                  <TableCell>{snapshotService.formatDataSize(snapshot.data_size)}</TableCell>
                  <TableCell>
                    <Tooltip title={snapshotService.formatSnapshotDate(snapshot.created_at)}>
                      <Typography variant="body2">
                        {new Date(snapshot.created_at).toLocaleDateString()}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Snapshot Data">
                        <IconButton
                          size="small"
                          onClick={() => handleViewSnapshot(snapshot.id)}
                          disabled={loadingSnapshot}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export Snapshot">
                        <IconButton
                          size="small"
                          onClick={() => handleExportSnapshot(snapshot)}
                        >
                          <CloudDownload />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Snapshot">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSnapshot(snapshot.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredSnapshots.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Snapshot Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Storage />
            Snapshot #{selectedSnapshot?.id} - {selectedSnapshot?.table_name}
            <Chip
              label={selectedSnapshot?.environment.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: selectedSnapshot ? snapshotService.getEnvironmentColor(selectedSnapshot.environment) : '',
                color: 'white'
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSnapshot && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">
                    Change Request ID
                  </Typography>
                  <Typography variant="body1">
                    #{selectedSnapshot.change_request_id}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {snapshotService.formatSnapshotDate(selectedSnapshot.created_at)}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">
                    Rows
                  </Typography>
                  <Typography variant="body1">
                    {selectedSnapshot.row_count.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="textSecondary">
                    Data Size
                  </Typography>
                  <Typography variant="body1">
                    {snapshotService.formatDataSize(selectedSnapshot.data_size)}
                  </Typography>
                </Grid>
              </Grid>

              {selectedSnapshot.snapshot_data.length > 0 && (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(selectedSnapshot.snapshot_data[0]).map((column) => (
                          <TableCell key={column}>
                            <Typography variant="body2" fontWeight="medium">
                              {column}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSnapshot.snapshot_data.slice(0, 100).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <Typography variant="body2">
                                {value !== null && value !== undefined ? String(value) : '—'}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selectedSnapshot.snapshot_data.length > 100 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Showing first 100 rows of {selectedSnapshot.row_count.toLocaleString()} total rows
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewerOpen(false)}>
            Close
          </Button>
          {selectedSnapshot && (
            <Button
              variant="contained"
              startIcon={<CloudDownload />}
              onClick={() => handleExportSnapshot(selectedSnapshot)}
            >
              Export
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};