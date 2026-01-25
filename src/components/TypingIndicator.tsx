

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;
  
  return (
    <div className="flex items-center space-x-2 italic text-gray-300 text-sm bg-[#202c33] w-max p-3 py-2 rounded-lg ml-4 mb-2">
      <div className="flex space-x-1">
        <span className="animate-pulse text-xs">●</span>
        <span className="animate-pulse text-xs" style={{ animationDelay: '0.2s' }}>●</span>
        <span className="animate-pulse text-xs" style={{ animationDelay: '0.4s' }}>●</span>
      </div>
      <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
    </div>
  );
}

export default TypingIndicator;
