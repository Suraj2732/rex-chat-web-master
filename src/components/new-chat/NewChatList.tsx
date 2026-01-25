import { companyName } from "@/config/constants";
import { useAuth } from "@/contexts/AuthContext";
import { chatServiceOptimized } from "@/lib/services/chatServiceOptimized";
import { userService } from "@/lib/services/userService";
import { User } from "@/types";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ContactItem from "./ContactItem";
import { useSearchQuery, useRefresh } from "@/store/appStore";
import EditAdminPanel from "../EditAdminPanel";



export default function NewChatList() {
    const { currentUser } = useAuth();
    const searchQuery = useSearchQuery();
    const refresh = useRefresh();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [currentUser, refresh]);

    const fetchUsers = async () => {
        if (!currentUser) return;

        try {
            let usersList: User[] = [];

            if (currentUser.role === 'admin') {
                usersList = await userService.getAllUsers();
            } else {
                usersList = await userService.getEmployees();
            }
            setUsers(usersList.filter(u => u.uid !== currentUser.uid));
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <p className="text-xs text-gray-400 px-3 mt-4 mb-2">
                Contacts on {companyName}
            </p>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No users found
                </div>
            ) : (
                filteredUsers.map((user, index) => (
                    <div className="" key={index}>

                        <ContactItem
                            key={user.uid}
                            user={user}
                        
                        />
                        
                    </div>

                ))
            )}



        </>
    );
}