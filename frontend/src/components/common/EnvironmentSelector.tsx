import React, { useState } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useEnvironment } from '../../hooks/useEnvironment';

export const EnvironmentSelector: React.FC = () => {
  const {
    currentEnvironment,
    availableEnvironments,
    isLoading,
    switchEnvironment,
    getEnvironmentColor,
    getEnvironmentDisplayName
  } = useEnvironment();

  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleEnvironmentChange = (env: string) => {
    if (env === currentEnvironment) return;
    
    setSelectedEnv(env);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSwitch = async () => {
    try {
      setSwitching(true);
      await switchEnvironment(selectedEnv);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Failed to switch environment:', error);
      alert('Failed to switch environment. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  const handleCancelSwitch = () => {
    setSelectedEnv('');
    setConfirmDialogOpen(false);
  };

  const isProdEnvironment = (env: string) => env.toLowerCase() === 'prod';

  return (
    <>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Environment</InputLabel>
        <Select
          value={currentEnvironment}
          label="Environment"
          disabled={isLoading}
          renderValue={(value) => (
            <Chip
              label={getEnvironmentDisplayName(value)}
              size="small"
              sx={{
                bgcolor: getEnvironmentColor(value),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          )}
        >
          {availableEnvironments.map((env) => (
            <MenuItem
              key={env}
              value={env}
              onClick={() => handleEnvironmentChange(env)}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={getEnvironmentDisplayName(env)}
                  size="small"
                  sx={{
                    bgcolor: getEnvironmentColor(env),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                {isProdEnvironment(env) && (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelSwitch}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Switch Environment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to switch from{' '}
            <Chip
              label={getEnvironmentDisplayName(currentEnvironment)}
              size="small"
              sx={{
                bgcolor: getEnvironmentColor(currentEnvironment),
                color: 'white',
                fontWeight: 'bold'
              }}
            />{' '}
            to{' '}
            <Chip
              label={getEnvironmentDisplayName(selectedEnv)}
              size="small"
              sx={{
                bgcolor: getEnvironmentColor(selectedEnv),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            ?
          </Typography>

          {isProdEnvironment(selectedEnv) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> You are switching to the production environment. 
                Please be extra careful with any changes you make.
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The page will refresh to load data from the new environment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSwitch} disabled={switching}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSwitch}
            variant="contained"
            disabled={switching}
            color={isProdEnvironment(selectedEnv) ? 'warning' : 'primary'}
          >
            {switching ? 'Switching...' : 'Confirm Switch'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};