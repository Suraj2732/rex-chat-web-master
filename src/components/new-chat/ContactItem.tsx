import { useAuth } from "@/contexts/AuthContext";
import { useAppActions } from "@/store/appStore";
import { chatService } from "@/lib/services/chatService";
import { User } from "@/types";
import { Check, Edit, Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ContactFormModal from "../ContactFormModal";

interface ContactItemProps {
    user: User;
    handleDelete?: (user: User) => void;
    handleActivate?: (user: User) => void;
}

export default function ContactItem({
    user,
    handleDelete,
    handleActivate,
}: ContactItemProps) {
    const { currentUser } = useAuth();
    const { setSelectedChatId, setSelectedChatUser } = useAppActions();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showActions, setShowActions] = useState(currentUser?.role === 'admin');
    
    const handleSelectUser = async (user: User) => {
        if (!currentUser) return;

        const chatId = await chatService.createOrGetChat(currentUser.uid, user.uid);

        if (chatId) {
            setSelectedChatId(chatId)
            setSelectedChatUser(user)
        } else {
            toast.error('Failed to create chat');
        }
    };
    
    return (
        <>
            <div
                onClick={() => handleSelectUser(user)}
                className="group relative rounded-sm px-3 py-4 hover:bg-[#202c33] cursor-pointer transition-colors"
            >
                <div className="flex items-center">
                    <div className="relative w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {user.displayName.charAt(0).toUpperCase()}
                        {user.isOnline && (
                            <span className="absolute bottom-1 right-0 w-3 h-3 bg-green-500 rounded-full"></span>
                        )}
                    </div>
                    <div className="ml-3 flex-1">
                        <span className="flex justify-between">
                            <h3 className="font-medium text-white truncate">{user.displayName}</h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                user.role === 'admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                            }`}>
                                {user.role}
                            </span>
                        </span>
                        <p className="text-sm opacity-70 truncate w-auto">{user.email}</p>
                    </div>
                </div>

                {showActions && (
                    <div className="hidden group-hover:flex space-x-2 pt-3 justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete?.(user);
                            }}
                            className="p-2 rounded-full text-white hover:text-red-400 cursor-pointer transition"
                        >
                            <Trash size={15} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleActivate?.(user);
                            }}
                            className="p-2 rounded-full text-white hover:text-green-400 cursor-pointer transition"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingUser(user);
                            }}
                            className="p-2 rounded-full text-white hover:text-blue-400 cursor-pointer transition"
                        >
                            <Edit size={15} />
                        </button>
                    </div>
                )}
            </div>
            
            {editingUser && (
                <ContactFormModal
                    editingUser={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => setEditingUser(null)}
                />
            )}
        </>
    );
}