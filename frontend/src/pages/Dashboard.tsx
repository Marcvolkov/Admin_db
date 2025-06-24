import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip
} from '@mui/material';
import {
  TableChart,
  PendingActions,
  Storage as DatabaseIcon,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEnvironment } from '../hooks/useEnvironment';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { currentEnvironment, getEnvironmentDisplayName, getEnvironmentColor } = useEnvironment();

  const quickActions = [
    {
      title: 'Browse Tables',
      description: 'View and manage database tables',
      icon: <TableChart sx={{ fontSize: 40 }} />,
      path: '/tables',
      color: 'primary'
    },
    ...(isAdmin() ? [{
      title: 'Pending Approvals',
      description: 'Review and approve change requests',
      icon: <PendingActions sx={{ fontSize: 40 }} />,
      path: '/approvals',
      color: 'warning'
    }] : [])
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Database Administration Dashboard
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <Chip
            icon={<DatabaseIcon />}
            label={`Current Environment: ${getEnvironmentDisplayName(currentEnvironment)}`}
            sx={{
              bgcolor: getEnvironmentColor(currentEnvironment),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          <Chip
            label={user?.role === 'admin' ? 'Administrator' : 'User'}
            color={user?.role === 'admin' ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box mb={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={3}>
          {quickActions.map((action) => (
            <Box key={action.title} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' } }}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                  <Box 
                    sx={{ 
                      color: `${action.color}.main`,
                      mb: 2 
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                  <Button size="small" color={action.color as any}>
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {/* System Info */}
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          System Information
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={3}>
          <Box flex="1 1 300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DatabaseIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Current Environment
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  You are currently working in the <strong>{getEnvironmentDisplayName(currentEnvironment)}</strong> environment.
                </Typography>
                {currentEnvironment === 'prod' && (
                  <Box mt={2}>
                    <Chip
                      label="⚠️ Production Environment"
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box flex="1 1 300px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Your Permissions
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {isAdmin() 
                    ? 'You have administrator privileges and can create, edit, and approve changes.'
                    : 'You have read-only access to view database tables and data.'
                  }
                </Typography>
                {!isAdmin() && (
                  <Typography variant="caption" color="text.secondary">
                    Contact an administrator for edit permissions.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};