import React, { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { gameNotificationService, GameNotification, GameNotificationCountSummary } from "../../services/game/gameNotification.service";
import GameNotificationPanel from "./GameNotificationPanel";

interface GameNotificationBellProps {
  userId: string;
  className?: string;
}

const GameNotificationBell: React.FC<GameNotificationBellProps> = ({ userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState<GameNotificationCountSummary>({ total: 0, unread: 0 });
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  
  useEffect(() => {
    if (!userId) return;

    // Initialize the notification service when the component mounts
    gameNotificationService.init(userId);
    
    const countsSubscription = gameNotificationService
      .getNotificationCounts()
      .subscribe((newCounts: GameNotificationCountSummary) => setCounts(newCounts));
    
    // Get initial notifications
    gameNotificationService.getNotifications().then(result => {
      setNotifications(result.notifications);
    });
    
    // Clean up subscriptions when the component unmounts
    return () => {
      countsSubscription.unsubscribe();
      gameNotificationService.cleanup();
    };
  }, [userId]);
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const hasUnread = counts.unread > 0;
  
  return (
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className={`relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
        aria-label={`${counts.unread} unread notifications`}
      >
        {hasUnread ? (
          <BellAlertIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        )}
        
        {hasUnread && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500" />
        )}
      </button>
      
      {isOpen && (
        <GameNotificationPanel 
          notifications={notifications}
          onClose={handleClose}
          onMarkAllAsRead={() => gameNotificationService.markAllAsRead()}
          onMarkAsRead={(id: string) => gameNotificationService.markAsRead(id)}
        />
      )}
    </div>
  );
};

export default GameNotificationBell;