import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Key,
  NotInterested
} from '@mui/icons-material';
import { TableInfo, ColumnInfo } from '../../types';
import { tableService } from '../../services/table.service';

interface TableSchemaProps {
  tableName: string;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export const TableSchema: React.FC<TableSchemaProps> = ({
  tableName,
  expanded = false,
  onExpandChange
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [schema, setSchema] = useState<TableInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isExpanded && !schema) {
      loadSchema();
    }
  }, [isExpanded, tableName, schema]);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError('');
      const tableSchema = await tableService.getTableSchema(tableName);
      setSchema(tableSchema);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClick = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const getDataTypeColor = (dataType: string): string => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('serial')) return 'info';
    if (type.includes('varchar') || type.includes('text') || type.includes('char')) return 'success';
    if (type.includes('timestamp') || type.includes('date') || type.includes('time')) return 'warning';
    if (type.includes('decimal') || type.includes('numeric') || type.includes('float')) return 'secondary';
    if (type.includes('boolean') || type.includes('bool')) return 'primary';
    return 'default';
  };

  const renderColumnConstraints = (column: ColumnInfo) => {
    const constraints = [];
    
    if (column.primary_key) {
      constraints.push(
        <Chip
          key="pk"
          icon={<Key />}
          label="Primary Key"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }
    
    if (!column.nullable) {
      constraints.push(
        <Chip
          key="not_null"
          icon={<NotInterested />}
          label="Not Null"
          size="small"
          color="error"
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }
    
    return constraints.length > 0 ? (
      <Box>{constraints}</Box>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No constraints
      </Typography>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ cursor: 'pointer' }}
          onClick={handleExpandClick}
        >
          <Typography variant="h6" component="h3">
            Table Schema
          </Typography>
          <IconButton size="small">
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box mt={2}>
            {loading && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {schema && !loading && !error && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Column Name</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Constraints</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schema.columns.map((column) => (
                      <TableRow key={column.name}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={column.primary_key ? 'bold' : 'normal'}
                          >
                            {column.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={column.type}
                            size="small"
                            // @ts-ignore - color prop accepts string
                            color={getDataTypeColor(column.type)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {renderColumnConstraints(column)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {schema && (
              <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="caption" color="text.secondary">
                  {schema.columns.length} column{schema.columns.length !== 1 ? 's' : ''} • 
                  Primary keys: {schema.columns.filter(c => c.primary_key).length} • 
                  Nullable: {schema.columns.filter(c => c.nullable).length}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};