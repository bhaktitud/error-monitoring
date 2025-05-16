import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNotification } from '@/hooks/useNotification';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NotificationStatus } from '@/components/ui/notification-status';

interface NotificationData {
  errorGroupId?: string;
  projectId?: string;
  commentId?: string;
  [key: string]: unknown;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: NotificationData;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    sendTestNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotification();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  // Handle navigasi ketika notifikasi diklik
  const handleNotificationClick = async (notification: NotificationItem) => {
    // Tandai notifikasi sebagai telah dibaca jika belum dibaca
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Tutup dropdown setelah navigasi
    setIsOpen(false);
    
    // Navigasi berdasarkan data notifikasi
    const { data } = notification;
    
    // Handle navigasi berdasarkan data
    if (data) {
      // Notifikasi terkait error group (komentar, assignment, dll)
      if (data.errorGroupId && data.projectId) {
        // Navigasi ke halaman error group detail
        router.push(`/projects/${data.projectId}/groups/${data.errorGroupId}`);
      }
      // Notifikasi terkait project
      else if (data.projectId) {
        // Navigasi ke dashboard project
        router.push(`/projects/${data.projectId}`);
      }
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${!isConnected ? 'text-gray-400' : ''}`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h4 className="font-medium">Notifikasi</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Tandai semua dibaca
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="text-xs"
              title="Kirim test notification"
            >
              Test
            </Button>
          </div>
        </div>
        
        <Link href="/notifications" onClick={() => setIsOpen(false)} className="block">
          <div className="p-2 text-center text-sm text-primary hover:bg-muted transition-colors border-b">
            Lihat Semua Notifikasi
          </div>
        </Link>
        
        <ScrollArea className="h-[300px]">
          <NotificationStatus 
            isConnected={isConnected}
            isLoading={isLoading}
            error={error}
            isEmpty={!isLoading && notifications.length === 0}
          />
          
          {!isLoading && notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-4 border-b last:border-0 ${
                !notification.read ? 'bg-muted/50' : ''
              } cursor-pointer`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-start justify-between">
                  <span className="font-medium">{notification.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 