import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormHelperText
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  Code,
  QueryStats,
  TableChart
} from '@mui/icons-material';
import { PredefinedQuery, QueryParameter, QueryResult, ParameterType } from '../../types';
import { queryService } from '../../services/query.service';
import { formatRelativeDate } from '../../utils';

interface QueryExecutorProps {
  tableName: string;
  queries: PredefinedQuery[];
  onExecute?: (result: QueryResult) => void;
}

export const QueryExecutor: React.FC<QueryExecutorProps> = ({
  tableName,
  queries,
  onExecute
}) => {
  const [selectedQuery, setSelectedQuery] = useState<PredefinedQuery | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [parameterErrors, setParameterErrors] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    if (selectedQuery) {
      // Initialize parameters with default values
      const defaultParams: Record<string, any> = {};
      selectedQuery.parameters.forEach(param => {
        if (param.default !== null && param.default !== undefined) {
          defaultParams[param.name] = param.default;
        }
      });
      setParameters(defaultParams);
      setParameterErrors({});
      setResult(null);
      setError('');
    }
  }, [selectedQuery]);

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({ ...prev, [paramName]: value }));
    
    // Clear error for this parameter
    if (parameterErrors[paramName]) {
      setParameterErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  const validateParameters = (): boolean => {
    if (!selectedQuery) return false;

    const errors: Record<string, string> = {};
    
    selectedQuery.parameters.forEach(param => {
      const error = queryService.validateParameter(param, parameters[param.name]);
      if (error) {
        errors[param.name] = error;
      }
    });

    setParameterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExecute = async () => {
    if (!selectedQuery) return;

    if (!validateParameters()) {
      return;
    }

    try {
      setExecuting(true);
      setError('');
      
      const result = await queryService.executeQuery(tableName, {
        query_id: selectedQuery.id,
        parameters: parameters
      });
      
      setResult(result);
      onExecute?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setExecuting(false);
    }
  };

  const renderParameterInput = (param: QueryParameter) => {
    const value = parameters[param.name] ?? '';
    const error = parameterErrors[param.name];

    switch (param.type) {
      case ParameterType.SELECT:
        return (
          <FormControl fullWidth error={!!error}>
            <InputLabel>{param.name}</InputLabel>
            <Select
              value={value}
              label={param.name}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
            >
              {param.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
            <FormHelperText>{param.description}</FormHelperText>
          </FormControl>
        );

      case ParameterType.INTEGER:
        return (
          <TextField
            fullWidth
            type="number"
            label={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            error={!!error}
            helperText={error || param.description}
            InputProps={{
              inputProps: {
                min: param.min,
                max: param.max,
                step: 1
              }
            }}
          />
        );

      case ParameterType.DECIMAL:
        return (
          <TextField
            fullWidth
            type="number"
            label={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            error={!!error}
            helperText={error || param.description}
            InputProps={{
              inputProps: {
                min: param.min,
                max: param.max,
                step: 0.01
              }
            }}
          />
        );

      case ParameterType.TEXT:
        return (
          <TextField
            fullWidth
            label={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            error={!!error}
            helperText={error || param.description}
            inputProps={{
              maxLength: param.maxLength
            }}
          />
        );

      case ParameterType.DATE:
        return (
          <TextField
            fullWidth
            type="date"
            label={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            error={!!error}
            helperText={error || param.description}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            error={!!error}
            helperText={error || param.description}
          />
        );
    }
  };

  if (queries.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <QueryStats sx={{ mr: 1 }} color="disabled" />
            <Typography variant="h6" color="text.secondary">
              No Predefined Queries
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            No predefined queries are available for the {tableName} table.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <QueryStats sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">
              Predefined Queries
            </Typography>
          </Box>

          {/* Query Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Query</InputLabel>
            <Select
              value={selectedQuery?.id || ''}
              label="Select Query"
              onChange={(e) => {
                const query = queries.find(q => q.id === e.target.value);
                setSelectedQuery(query || null);
              }}
            >
              <MenuItem value="">
                <em>Choose a query...</em>
              </MenuItem>
              {queries.map((query) => (
                <MenuItem key={query.id} value={query.id}>
                  <Box>
                    <Typography variant="body1">{query.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {query.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Query Details */}
          {selectedQuery && (
            <Box>
              <Divider sx={{ mb: 2 }} />
              
              {/* Description */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedQuery.description}
              </Typography>

              {/* Parameters */}
              {selectedQuery.parameters.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Parameters
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {selectedQuery.parameters.map((param) => (
                      <Box key={param.name}>
                        {renderParameterInput(param)}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* SQL Preview */}
              <Accordion expanded={showSql} onChange={() => setShowSql(!showSql)}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center">
                    <Code sx={{ mr: 1 }} />
                    <Typography>SQL Preview</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    component="pre"
                    sx={{
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    {selectedQuery.parameters.length > 0 
                      ? queryService.formatSqlForDisplay(selectedQuery.sql, parameters)
                      : selectedQuery.sql
                    }
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Execute Button */}
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={executing ? <CircularProgress size={16} /> : <PlayArrow />}
                  onClick={handleExecute}
                  disabled={executing}
                  size="large"
                >
                  {executing ? 'Executing...' : 'Execute Query'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <TableChart sx={{ mr: 1 }} color="success" />
                <Typography variant="h6">
                  Query Results
                </Typography>
              </Box>
              <Chip 
                label={`${result.row_count} row${result.row_count !== 1 ? 's' : ''}`}
                color="primary"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {result.query_name}
            </Typography>

            {result.rows.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body1" color="text.secondary">
                  No results found
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {result.columns.map((column) => (
                        <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.rows.map((row, index) => (
                      <TableRow key={index}>
                        {result.columns.map((column) => (
                          <TableCell key={column}>
                            {row[column] !== null && row[column] !== undefined 
                              ? String(row[column]) 
                              : <em>NULL</em>
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};