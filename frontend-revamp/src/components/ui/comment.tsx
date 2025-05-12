import { FC } from 'react';
import { Card, CardContent, CardFooter } from './card';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { FiClock } from 'react-icons/fi';

interface CommentProps {
  id: string;
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
  content,
  createdAt,
  author
}) => {
  const { user } = author;
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email.split('@')[0].slice(0, 2).toUpperCase();

  // Mendapatkan URL avatar dari database atau relative path
  const avatarUrl = user.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`)
    : undefined;

  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex gap-3 items-start">
          <Avatar className="size-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name || user.email} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-foreground">{user.name || user.email}</div>
            <p className="mt-1 text-foreground/90 whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground flex items-center">
        <FiClock className="mr-1" />
        <span>{formatDate(createdAt)}</span>
      </CardFooter>
    </Card>
  );
}; 