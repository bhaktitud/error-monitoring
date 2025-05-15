'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Bell, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotification } from '@/hooks/useNotification';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NotificationData {
  errorGroupId?: string;
  projectId?: string;
  commentId?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: NotificationData;
}

export default function NotificationsPage() {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotification();

  // Filter notifikasi berdasarkan tab aktif dan pencarian
  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'unread' && !notification.read) ||
      (activeTab === 'read' && notification.read);
    
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Menampilkan notifikasi pertama ketika halaman dimuat
  useEffect(() => {
    if (filteredNotifications.length > 0 && !selectedNotification) {
      setSelectedNotification(filteredNotifications[0]);
    }
  }, [filteredNotifications, selectedNotification]);

  // Refresh notifikasi
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
    toast.success('Notifikasi berhasil diperbarui');
  };

  // Tandai sebagai telah dibaca
  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      toast.success('Notifikasi ditandai sebagai telah dibaca');
    }
  };

  // Tandai semua sebagai telah dibaca
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('Semua notifikasi ditandai sebagai telah dibaca');
  };

  // Hapus notifikasi
  const handleDeleteNotification = async (notification: Notification) => {
    await deleteNotification(notification.id);
    
    // Jika notifikasi yang dihapus adalah yang sedang ditampilkan
    if (selectedNotification?.id === notification.id) {
      setSelectedNotification(filteredNotifications.length > 1 ? filteredNotifications[1] : null);
    }
    
    toast.success('Notifikasi berhasil dihapus');
  };

  // Navigasi ke halaman terkait
  const handleNavigateToRelated = (notification: Notification) => {
    if (!notification.data) return;
    
    const { data } = notification;
    
    // Tandai sebagai telah dibaca sebelum navigasi
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigasi berdasarkan data notifikasi
    if (data.errorGroupId && data.projectId) {
      router.push(`/projects/${data.projectId}/groups/${data.errorGroupId}`);
    } else if (data.projectId) {
      router.push(`/projects/${data.projectId}`);
    }
  };

  // Format tanggal dengan detail lengkap
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy, HH:mm:ss', { locale: id });
  };

  // Tampilkan status koneksi
  const connectionStatus = !isConnected && (
    <div className="p-2 text-xs text-amber-500 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 rounded-md mb-4 flex items-center">
      <AlertCircle className="h-4 w-4 mr-2" />
      Koneksi notifikasi sedang terputus, mencoba menghubungkan kembali...
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Link href="/" passHref>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center">
          <Bell className="h-6 w-6 mr-2" />
          Notifikasi
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-3">
              {unreadCount} belum dibaca
            </Badge>
          )}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Tandai Semua Dibaca</span>
            </Button>
          )}
        </div>
      </div>

      {connectionStatus}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel Daftar Notifikasi */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Notifikasi</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActiveTab('all')}>
                      Semua Notifikasi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('unread')}>
                      Belum Dibaca
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('read')}>
                      Sudah Dibaca
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleMarkAllAsRead}>
                      Tandai Semua Dibaca
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-2">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="unread">
                      Belum Dibaca
                      {unreadCount > 0 && <Badge className="ml-1">{unreadCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="read">Sudah Dibaca</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari notifikasi..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Memuat notifikasi...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
                  {searchQuery ? (
                    <p className="text-muted-foreground">Tidak ada notifikasi yang cocok dengan pencarian</p>
                  ) : activeTab !== 'all' ? (
                    <p className="text-muted-foreground">
                      Tidak ada notifikasi yang {activeTab === 'unread' ? 'belum dibaca' : 'sudah dibaca'}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Tidak ada notifikasi</p>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedNotification?.id === notification.id ? 'bg-muted' : ''
                      } ${!notification.read ? 'bg-muted/50' : ''}`}
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-2 w-2 rounded-full mt-2 ${!notification.read ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{notification.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Detail Notifikasi */}
        <div className="md:col-span-2">
          <Card className="h-full">
            {selectedNotification ? (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedNotification.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(selectedNotification.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!selectedNotification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(selectedNotification)}
                          className="gap-2"
                        >
                          <CheckCheck className="h-4 w-4" />
                          <span>Tandai Dibaca</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNotification(selectedNotification)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Hapus</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Pesan</h3>
                    <div className="p-4 rounded-md bg-muted">
                      <p>{selectedNotification.message}</p>
                    </div>
                  </div>

                  {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Informasi Terkait</h3>
                      <div className="p-4 rounded-md bg-muted space-y-2">
                        {selectedNotification.data.projectId && (
                          <div className="flex">
                            <span className="text-sm font-medium w-32">Project ID:</span>
                            <span className="text-sm">{selectedNotification.data.projectId}</span>
                          </div>
                        )}
                        {selectedNotification.data.errorGroupId && (
                          <div className="flex">
                            <span className="text-sm font-medium w-32">Error Group ID:</span>
                            <span className="text-sm">{selectedNotification.data.errorGroupId}</span>
                          </div>
                        )}
                        {selectedNotification.data.commentId && (
                          <div className="flex">
                            <span className="text-sm font-medium w-32">Comment ID:</span>
                            <span className="text-sm">{selectedNotification.data.commentId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium mb-2">Detail Notifikasi</h3>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-sm font-medium w-32">ID:</span>
                        <span className="text-sm font-mono">{selectedNotification.id}</span>
                      </div>
                      <div className="flex">
                        <span className="text-sm font-medium w-32">Tipe:</span>
                        <span className="text-sm">{selectedNotification.type}</span>
                      </div>
                      <div className="flex">
                        <span className="text-sm font-medium w-32">Status:</span>
                        <Badge variant={selectedNotification.read ? "outline" : "secondary"}>
                          {selectedNotification.read ? 'Sudah dibaca' : 'Belum dibaca'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedNotification.data && (selectedNotification.data.projectId || selectedNotification.data.errorGroupId) && (
                    <div>
                      <Button 
                        onClick={() => handleNavigateToRelated(selectedNotification)}
                        className="w-full"
                      >
                        Lihat Detail Terkait
                      </Button>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Bell className="h-16 w-16 text-muted-foreground opacity-20 mb-3" />
                <h3 className="text-lg font-medium">Tidak Ada Notifikasi yang Dipilih</h3>
                <p className="text-muted-foreground mt-1">
                  Pilih notifikasi dari daftar untuk melihat detailnya
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 