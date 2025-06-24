import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Add,
  Remove,
  Edit,
  Code
} from '@mui/icons-material';

interface DiffViewerProps {
  oldData: any;
  newData: any;
  operation: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldData,
  newData,
  operation
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  const generateDiff = () => {
    const diff: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: 'added' | 'removed' | 'changed' | 'unchanged';
    }> = [];

    if (operation === 'CREATE' && newData) {
      // For CREATE operations, all fields are "added"
      Object.entries(newData).forEach(([key, value]) => {
        diff.push({
          field: key,
          oldValue: null,
          newValue: value,
          type: 'added'
        });
      });
    } else if (operation === 'DELETE' && oldData) {
      // For DELETE operations, all fields are "removed"
      Object.entries(oldData).forEach(([key, value]) => {
        diff.push({
          field: key,
          oldValue: value,
          newValue: null,
          type: 'removed'
        });
      });
    } else if (operation === 'UPDATE' && oldData && newData) {
      // For UPDATE operations, compare old and new
      const allKeys = new Set([
        ...Object.keys(oldData || {}),
        ...Object.keys(newData || {})
      ]);

      allKeys.forEach(key => {
        const oldValue = oldData[key];
        const newValue = newData[key];

        if (oldValue === undefined && newValue !== undefined) {
          diff.push({ field: key, oldValue, newValue, type: 'added' });
        } else if (oldValue !== undefined && newValue === undefined) {
          diff.push({ field: key, oldValue, newValue, type: 'removed' });
        } else if (oldValue !== newValue) {
          diff.push({ field: key, oldValue, newValue, type: 'changed' });
        } else {
          diff.push({ field: key, oldValue, newValue, type: 'unchanged' });
        }
      });
    }

    return diff;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Add color="success" fontSize="small" />;
      case 'removed':
        return <Remove color="error" fontSize="small" />;
      case 'changed':
        return <Edit color="info" fontSize="small" />;
      default:
        return null;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'success.light';
      case 'removed':
        return 'error.light';
      case 'changed':
        return 'info.light';
      default:
        return 'transparent';
    }
  };

  const diff = generateDiff();
  const changedFields = diff.filter(item => item.type !== 'unchanged');

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center">
          <Typography variant="subtitle1" fontWeight="bold">
            Data Changes
          </Typography>
          <Chip
            label={`${changedFields.length} change${changedFields.length !== 1 ? 's' : ''}`}
            size="small"
            color={changedFields.length > 0 ? 'primary' : 'default'}
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Box>
          <IconButton
            size="small"
            onClick={() => setShowRaw(!showRaw)}
            title="Toggle raw JSON view"
          >
            <Code />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        {showRaw ? (
          /* Raw JSON View */
          <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
            {operation !== 'CREATE' && oldData && (
              <Box flex={1}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Old Data (Before)
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 300,
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1
                    }}
                  >
                    {JSON.stringify(oldData, null, 2)}
                  </Box>
                </Paper>
              </Box>
            )}
            
            {operation !== 'DELETE' && newData && (
              <Box flex={1}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="success.main">
                    New Data (After)
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 300,
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1
                    }}
                  >
                    {JSON.stringify(newData, null, 2)}
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        ) : (
          /* Diff Table View */
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Before</TableCell>
                  <TableCell>After</TableCell>
                  <TableCell width={60}>Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No data changes to display
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  diff.map((item, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        bgcolor: getChangeColor(item.type),
                        '&:hover': {
                          bgcolor: item.type !== 'unchanged' ? getChangeColor(item.type) : 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.field}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {item.type === 'added' ? (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            (not set)
                          </Typography>
                        ) : (
                          <Box
                            component="pre"
                            sx={{
                              fontSize: '0.75rem',
                              margin: 0,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {formatValue(item.oldValue)}
                          </Box>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {item.type === 'removed' ? (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            (deleted)
                          </Typography>
                        ) : (
                          <Box
                            component="pre"
                            sx={{
                              fontSize: '0.75rem',
                              margin: 0,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {formatValue(item.newValue)}
                          </Box>
                        )}
                      </TableCell>
                      
                      <TableCell align="center">
                        {getChangeIcon(item.type)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary */}
        {changedFields.length > 0 && (
          <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              Summary: {changedFields.filter(f => f.type === 'added').length} added, {' '}
              {changedFields.filter(f => f.type === 'changed').length} modified, {' '}
              {changedFields.filter(f => f.type === 'removed').length} removed
            </Typography>
          </Box>
        )}

        {changedFields.length === 0 && operation === 'UPDATE' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No data changes detected. This might be a metadata-only update.
          </Alert>
        )}
      </Collapse>
    </Box>
  );
};