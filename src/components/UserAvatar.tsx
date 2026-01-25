import { User } from '@/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showOnlineStatus?: boolean;
}

export default function UserAvatar({ user, size = 'md', showOnlineStatus = false }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0`}>
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        user.displayName?.charAt(0).toUpperCase()
      )}
      {showOnlineStatus && user.isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      )}
    </div>
  );
}