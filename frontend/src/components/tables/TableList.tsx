import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Search,
  TableChart,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { tableService } from '../../services/table.service';
import { useEnvironment } from '../../hooks/useEnvironment';

interface TableListProps {
  onTableSelect?: (tableName: string) => void;
}

export const TableList: React.FC<TableListProps> = ({ onTableSelect }) => {
  const navigate = useNavigate();
  const { currentEnvironment } = useEnvironment();

  const [tables, setTables] = useState<string[]>([]);
  const [filteredTables, setFilteredTables] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTables();
  }, [currentEnvironment]);

  useEffect(() => {
    // Filter tables based on search term
    if (searchTerm.trim() === '') {
      setFilteredTables(tables);
    } else {
      setFilteredTables(
        tables.filter(table =>
          table.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, tables]);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError('');
      
      const tableList = await tableService.getTables();
      setTables(tableList);
      
      // Load row counts for each table
      const counts: Record<string, number> = {};
      await Promise.all(
        tableList.map(async (table) => {
          try {
            const count = await tableService.getTableRowCount(table);
            counts[table] = count;
          } catch (error) {
            console.warn(`Failed to get row count for ${table}:`, error);
            counts[table] = 0;
          }
        })
      );
      setTableCounts(counts);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tables');
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (tableName: string) => {
    if (onTableSelect) {
      onTableSelect(tableName);
    } else {
      navigate(`/tables/${tableName}`);
    }
  };

  const handleRefresh = () => {
    loadTables();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Tables
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search tables..."
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

      {/* Tables grid */}
      {filteredTables.length === 0 ? (
        <Box textAlign="center" py={4}>
          <TableChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'No tables match your search' : 'No tables found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'This environment doesn\'t contain any tables'
            }
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={2}>
          {filteredTables.map((table) => (
            <Box key={table} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleTableClick(table)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <TableChart color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2" noWrap>
                      {table}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Records
                    </Typography>
                    <Chip
                      label={tableCounts[table]?.toLocaleString() || '0'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Summary */}
      <Box mt={4} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="body2" color="text.secondary">
          {filteredTables.length} table{filteredTables.length !== 1 ? 's' : ''} 
          {searchTerm && ` matching "${searchTerm}"`} in {currentEnvironment} environment
        </Typography>
      </Box>
    </Box>
  );
};