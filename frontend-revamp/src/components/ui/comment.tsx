import { FC, useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './card';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { FiClock, FiMessageSquare, FiEdit, FiTrash, FiMoreVertical } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from './textarea';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

interface CommentProps {
  id?: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    user: {
      id: string;
      email: string;
      avatar?: string;
      name?: string;
    };
  };
  currentUserId?: string;
  onEdit?: (id: string, content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const Comment: FC<CommentProps> = ({
  id,
  content,
  createdAt,
  author,
  currentUserId,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { user } = author;
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email.split('@')[0].slice(0, 2).toUpperCase();

  // Mendapatkan URL avatar dari database atau relative path
  const avatarUrl = user.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`)
    : undefined;
    
  // Cek apakah user saat ini adalah pemilik komentar
  const isOwner = currentUserId === user.id;
  
  // Focus pada textarea saat mode edit aktif
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);
  
  const handleEdit = async () => {
    if (!id || !onEdit || editedContent.trim() === '') return;
    
    try {
      setIsSubmitting(true);
      await onEdit(id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!id || !onDelete) return;
    
    try {
      setIsSubmitting(true);
      await onDelete(id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className="border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
        <CardContent className="p-4">
          <div className="flex gap-3 items-start">
            <div className="relative">
              <Avatar className="size-10 border-2 border-background shadow-sm">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name || user.email} />}
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px]">
                <div className="bg-primary rounded-full flex items-center justify-center w-4 h-4">
                  <FiMessageSquare className="text-background w-2 h-2" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <div className="font-medium text-foreground flex items-center flex-wrap">
                  <span className="mr-2">{user.name || user.email}</span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground flex items-center">
                    <FiClock className="mr-1 h-3 w-3" />
                    <span>{formatDate(createdAt)}</span>
                  </span>
                </div>
                
                {isOwner && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <FiMoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <FiEdit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <FiTrash className="mr-2 h-4 w-4" />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="editing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2"
                  >
                    <Textarea
                      ref={textareaRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[100px] bg-muted/30 focus:bg-background transition-all resize-none"
                      placeholder="Tulis komentar..."
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedContent(content);
                        }}
                        disabled={isSubmitting}
                      >
                        Batal
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleEdit}
                        disabled={isSubmitting || !editedContent.trim()}
                      >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mt-2 text-foreground/90 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/40 group-hover:border-primary/20 transition-all duration-300">
                      {content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komentar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}; 