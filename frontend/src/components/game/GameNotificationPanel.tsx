import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  ListItemIcon,
  Popover,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { gameNotificationService, GameNotification } from '../../services/game/game-notification.service';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';

interface GameNotificationPanelProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const StyledPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    width: 400,
    maxHeight: 500,
    overflow: 'auto'
  },
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const EmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  textAlign: 'center'
}));

const NotificationItem = styled(ListItem)<{isRead?: boolean}>(({ theme, isRead }) => ({
  backgroundColor: isRead ? 'transparent' : theme.palette.action.hover,
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

/**
 * Game notification panel component
 * Displays a list of game notifications in a popover
 */
export const GameNotificationPanel: React.FC<GameNotificationPanelProps> = ({ 
  anchorEl, 
  onClose 
}) => {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const isOpen = Boolean(anchorEl);
  const id = isOpen ? 'game-notification-popover' : undefined;
  
  // Fetch notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, page]);
  
  // Listen for new notifications
  useEffect(() => {
    const unsubscribe = gameNotificationService.onNotification(notification => {
      setNotifications(prevNotifications => [notification, ...prevNotifications]);
      setTotal(prevTotal => prevTotal + 1);
    });
    
    return unsubscribe;
  }, []);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await gameNotificationService.getNotifications(page, 10);
      setNotifications(result.notifications);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      enqueueSnackbar('Failed to load notifications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const success = await gameNotificationService.markAllAsRead();
      if (success) {
        // Update all notifications as read locally
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({
            ...notification,
            isRead: true
          }))
        );
        enqueueSnackbar('All notifications marked as read', { variant: 'success' });
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      enqueueSnackbar('Failed to update notifications', { variant: 'error' });
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await gameNotificationService.markAsRead(notificationId);
      if (success) {
        // Update the notification as read locally
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const handleNotificationClick = async (notification: GameNotification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    
    // Handle navigation based on notification data
    if (notification.data) {
      if (notification.data.moduleId) {
        // Navigate to module
        router.push(`/game/modules/${notification.data.moduleId}`);
        onClose();
      } else if (notification.data.achievementId) {
        // Navigate to achievements
        router.push('/game/achievements');
        onClose();
      } else if (notification.data.action === 'view_module_status') {
        // Navigate to module status
        router.push(`/game/modules/${notification.data.moduleId}`);
        onClose();
      }
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  const getTimeText = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
  };
  
  return (
    <StyledPopover
      id={id}
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <NotificationHeader>
        <Typography variant="subtitle1" fontWeight="bold">
          Game Notifications
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Mark all as read">
            <IconButton size="small" onClick={handleMarkAllAsRead}>
              <DoneAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </NotificationHeader>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : notifications.length === 0 ? (
        <EmptyState>
          <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
          <Typography variant="subtitle1">No notifications</Typography>
          <Typography variant="body2">
            You don&apos;t have any game notifications yet.
          </Typography>
        </EmptyState>
      ) : (
        <>
          <List disablePadding>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationItem 
                  isRead={notification.isRead}
                  onClick={() => handleNotificationClick(notification)}
                  button
                  alignItems="flex-start"
                >
                  <ListItemIcon sx={{ mt: 1 }}>
                    {getCategoryIcon(notification.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {notification.message}
                        </Typography>
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ display: 'block', mt: 0.5, opacity: 0.6 }}
                        >
                          {getTimeText(notification.sentAt)}
                        </Typography>
                      </>
                    }
                  />
                </NotificationItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
          
          {notifications.length < total && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleLoadMore}
                disabled={loading}
              >
                Load More
              </Button>
            </Box>
          )}
        </>
      )}
    </StyledPopover>
  );
};

export default GameNotificationPanel;