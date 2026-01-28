import { useAuth } from "@/contexts/AuthContext";
import { useAppActions } from "@/store/appStore";
import { chatService } from "@/lib/services/chatService";
import { User } from "@/types";
import { Check, Edit, Trash, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ContactFormModal from "../ContactFormModal";
import UserAvatar from "../UserAvatar";

interface ContactItemProps {
    user: User;
}

export default function ContactItem({ user }: ContactItemProps) {
    const { currentUser, firebaseUser } = useAuth();
    const { setSelectedChatId, setSelectedChatUser, setRefresh } = useAppActions();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const showActions = currentUser?.role === 'admin';
    
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

    const handleToggleStatus = async (user: User) => {
        if (!firebaseUser || loading) return;
        
        setLoading(true);
        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/admin/toggle-user-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ 
                    userId: user.uid, 
                    isActive: !user.isActive 
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to toggle user status');
            }

            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            setRefresh(true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to toggle user status');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!firebaseUser || loading) return;
        
        if (!confirm(`Are you sure you want to delete ${user.displayName}?`)) return;
        
        setLoading(true);
        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/admin/delete-user', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ userId: user.uid }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            toast.success('User deleted successfully');
            setRefresh(true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            <div
                onClick={() => handleSelectUser(user)}
                className="group relative rounded-sm px-3 py-4 hover:bg-[#202c33] cursor-pointer transition-colors"
            >
                <div className="flex items-center">
                    <UserAvatar user={user} showOnlineStatus={true} />
                    <div className="ml-3 flex-1">
                        <span className="flex justify-between">
                            <h3 className="font-medium text-white truncate">{user.displayName}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    user.role === 'admin'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                } ${user.isActive ? '  ' : 'bg-red-100 text-red-800'} `}>
                                    {user.role}
                                </span>
                                {/* {!user.isActive && (
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                        Inactive
                                    </span>
                                )} */}
                            </div>
                        </span>
                        <p className="text-sm opacity-70 truncate w-auto">{user.email}</p>
                    </div>
                </div>

                {showActions && (
                    <div className="hidden group-hover:flex space-x-2 pt-3 justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user);
                            }}
                            disabled={loading}
                            className="p-2 rounded-full text-white hover:text-red-400 cursor-pointer transition disabled:opacity-50"
                            title="Delete user"
                        >
                            <Trash size={15} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(user);
                            }}
                            disabled={loading}
                            className="p-2 rounded-full text-white hover:text-green-400 cursor-pointer transition disabled:opacity-50"
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                            {user.isActive ? <X size={16} /> : <Check size={16} />}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingUser(user);
                            }}
                            disabled={loading}
                            className="p-2 rounded-full text-white hover:text-blue-400 cursor-pointer transition disabled:opacity-50"
                            title="Edit user"
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