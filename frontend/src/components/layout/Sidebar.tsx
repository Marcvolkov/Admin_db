import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  Badge,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  TableChart,
  PendingActions,
  Dashboard,
  Storage as DatabaseIcon,
  Warning,
  CameraAlt as SnapshotIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEnvironment } from '../../hooks/useEnvironment';
import { tableService } from '../../services/table.service';
import { approvalService } from '../../services/approval.service';

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { currentEnvironment, getEnvironmentColor } = useEnvironment();

  const [tables, setTables] = useState<string[]>([]);
  const [tablesOpen, setTablesOpen] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [tablesError, setTablesError] = useState<string>('');
  const [pendingCount, setPendingCount] = useState(0);

  // Load tables for current environment
  useEffect(() => {
    loadTables();
  }, [currentEnvironment]);

  // Load pending approvals count for admins
  useEffect(() => {
    if (isAdmin()) {
      loadPendingCount();
    }
  }, [isAdmin]);

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      setTablesError('');
      const tableList = await tableService.getTables();
      setTables(tableList);
    } catch (error) {
      setTablesError(error instanceof Error ? error.message : 'Failed to load tables');
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const pending = await approvalService.getPendingChanges();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Dashboard />,
      adminOnly: false
    },
    ...(isAdmin() ? [
      {
        label: 'Pending Approvals',
        path: '/approvals',
        icon: <PendingActions />,
        adminOnly: true,
        badge: pendingCount > 0 ? pendingCount : undefined
      },
      {
        label: 'Snapshots',
        path: '/snapshots',
        icon: <SnapshotIcon />,
        adminOnly: true
      }
    ] : [])
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <DatabaseIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Admin DB
          </Typography>
        </Box>
        <Chip
          label={currentEnvironment.toUpperCase()}
          size="small"
          sx={{
            bgcolor: getEnvironmentColor(currentEnvironment),
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Navigation items */}
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isCurrentPath(item.path)}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Tables section */}
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setTablesOpen(!tablesOpen)}>
              <ListItemIcon>
                <TableChart />
              </ListItemIcon>
              <ListItemText 
                primary="Tables" 
                secondary={`${tables.length} table${tables.length !== 1 ? 's' : ''}`}
              />
              {tablesOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={tablesOpen} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2 }}>
              {loadingTables && (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {tablesError && (
                <Box p={1}>
                  <Alert 
                    severity="error" 
                    action={
                      <ListItemButton 
                        onClick={loadTables}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        Retry
                      </ListItemButton>
                    }
                  >
                    {tablesError}
                  </Alert>
                </Box>
              )}

              {!loadingTables && !tablesError && tables.length === 0 && (
                <Box p={2}>
                  <Typography variant="caption" color="text.secondary">
                    No tables found
                  </Typography>
                </Box>
              )}

              {tables.map((table) => (
                <ListItem key={table} disablePadding>
                  <ListItemButton
                    selected={isCurrentPath(`/tables/${table}`)}
                    onClick={() => handleNavigation(`/tables/${table}`)}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TableChart fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={table}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        noWrap: true,
                        title: table
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </Box>
          </Collapse>
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Environment: {currentEnvironment}
        </Typography>
        {currentEnvironment === 'prod' && (
          <Box display="flex" alignItems="center" mt={0.5}>
            <Warning color="warning" fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="caption" color="warning.main">
              Production Mode
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};