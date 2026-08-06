/**
 * Update Notification Component
 * Shows when data has been refreshed
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateNotificationProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  className?: string;
}

export function UpdateNotification({ 
  lastUpdated, 
  isLoading, 
  className 
}: UpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (lastUpdated && !isLoading) {
      setShowUpdate(true);
      const timer = setTimeout(() => setShowUpdate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, isLoading]);

  if (!lastUpdated && !isLoading) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isLoading ? (
        <Badge variant="secondary" className="animate-pulse">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Updating...
        </Badge>
      ) : showUpdate ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800 animate-fade-in">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Updated
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdated?.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
