import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Check,
  Close,
  Person,
  Schedule,
  TableChart,
  Storage,
  ArrowBack
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ChangeRequestResponse } from '../../types';
import { approvalService } from '../../services/approval.service';
import { formatDate, formatRelativeDate } from '../../utils';
import { DiffViewer } from './DiffViewer';

export const ChangeDetails: React.FC = () => {
  const { changeId } = useParams<{ changeId: string }>();
  const navigate = useNavigate();

  const [change, setChange] = useState<ChangeRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  
  // Approval/Rejection dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (changeId) {
      loadChangeDetails();
    }
  }, [changeId]);

  const loadChangeDetails = async () => {
    if (!changeId) return;

    try {
      setLoading(true);
      setError('');
      const details = await approvalService.getChangeDetails(parseInt(changeId));
      setChange(details);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load change details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (approve: boolean) => {
    setIsApproving(approve);
    setComment('');
    setApprovalDialogOpen(true);
  };

  const executeApprovalAction = async () => {
    if (!change) return;

    try {
      setProcessing(true);
      
      if (isApproving) {
        await approvalService.approveChange(change.id, comment || undefined);
      } else {
        await approvalService.rejectChange(change.id, comment || 'Rejected from details view');
      }

      setApprovalDialogOpen(false);
      // Reload to get updated status
      await loadChangeDetails();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !change) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/approvals')}
          sx={{ mb: 2 }}
        >
          Back to Approvals
        </Button>
        <Alert severity="error">
          {error || 'Change request not found'}
        </Alert>
      </Box>
    );
  }

  const formattedChange = approvalService.formatChangeForDisplay(change);
  const isPending = change.status === 'PENDING';

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/approvals')}
          sx={{ mb: 2 }}
        >
          Back to Approvals
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Change Request #{change.id}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {formattedChange.title}
            </Typography>
          </Box>
          
          <Chip
            label={change.status}
            color={approvalService.getStatusColor(change.status) as any}
            variant={isPending ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>

      <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Change Overview */}
        <Box flex={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Overview
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
                <Box flex="1 1 200px">
                  <Box display="flex" alignItems="center" mb={1}>
                    <TableChart fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Table:
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {change.table_name}
                  </Typography>
                </Box>
                
                <Box flex="1 1 200px">
                  <Box display="flex" alignItems="center" mb={1}>
                    <Storage fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Environment:
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {change.environment}
                  </Typography>
                </Box>
                
                <Box flex="1 1 200px">
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Requested by:
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {change.requester_username || `User #${change.requested_by}`}
                  </Typography>
                </Box>
                
                <Box flex="1 1 200px">
                  <Box display="flex" alignItems="center" mb={1}>
                    <Schedule fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" fontWeight="bold">
                      Requested:
                    </Typography>
                  </Box>
                  <Typography variant="body2" title={formatDate(change.requested_at)}>
                    {formatRelativeDate(change.requested_at)}
                  </Typography>
                </Box>
                
                {change.record_id && (
                  <Box flex="1 1 200px">
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Record ID:
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {change.record_id}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Data Changes */}
              <Typography variant="h6" gutterBottom>
                Data Changes
              </Typography>
              
              <DiffViewer
                oldData={formattedChange.oldData}
                newData={formattedChange.newData}
                operation={change.operation}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Actions Panel */}
        <Box flex={1} minWidth="300px">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              {isPending ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This change request is pending approval.
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      onClick={() => handleApprovalAction(true)}
                      fullWidth
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Close />}
                      onClick={() => handleApprovalAction(false)}
                      fullWidth
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This change request has been {change.status.toLowerCase()}.
                  </Typography>
                  
                  {change.reviewed_by && (
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Reviewed by:
                      </Typography>
                      <Typography variant="body2">
                        {change.reviewer_username || `User #${change.reviewed_by}`}
                      </Typography>
                      
                      {change.reviewed_at && (
                        <>
                          <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                            Reviewed:
                          </Typography>
                          <Typography variant="body2" title={formatDate(change.reviewed_at)}>
                            {formatRelativeDate(change.reviewed_at)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isApproving ? 'Approve' : 'Reject'} Change Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to {isApproving ? 'approve' : 'reject'} this change request?
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={`${isApproving ? 'Approval' : 'Rejection'} Comment (optional)`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isApproving 
              ? 'Add any notes about this approval...'
              : 'Please provide a reason for rejection...'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={executeApprovalAction}
            variant="contained"
            color={isApproving ? 'success' : 'error'}
            disabled={processing}
          >
            {processing ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : (
              isApproving ? <Check sx={{ mr: 1 }} /> : <Close sx={{ mr: 1 }} />
            )}
            {isApproving ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};