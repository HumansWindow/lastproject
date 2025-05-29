import React, { useEffect, useState } from 'react';
import { Badge, IconButton, Tooltip } from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import { gameNotificationService } from "../../services/game/gameNotification.service";
import { useAuth } from "../../hooks/useAuth";

interface GameNotificationIconProps {
  onClick?: () => void;
}

/**
 * Game notification bell icon with unread count indicator
 */
export const GameNotificationIcon: React.FC<GameNotificationIconProps> = ({
  onClick
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { user } = useAuth();
  
  useEffect(() => {
    // Initialize notification service when user is authenticated
    if (user?.id) {
      gameNotificationService.initialize(user.id);
      
      // Subscribe to count updates
      const unsubscribe = gameNotificationService.onCountUpdate(count => {
        setUnreadCount(count);
      });
      
      return () => {
        unsubscribe();
        gameNotificationService.cleanup();
      };
    }
  }, [user?.id]);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <Tooltip title="Game Notifications">
      <IconButton
        color="inherit"
        aria-label="Game Notifications"
        onClick={handleClick}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default GameNotificationIcon;