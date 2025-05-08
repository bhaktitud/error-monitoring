import { FC } from 'react';
import { Card, CardContent, CardFooter } from './card';
import { Avatar } from './avatar';
import { AvatarFallback } from './avatar';
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
  const initials = author.user.email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-foreground">{author.user.email}</div>
            <p className="mt-1 text-foreground/90">{content}</p>
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