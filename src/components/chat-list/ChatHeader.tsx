import { companyName } from "@/config/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useAppActions } from "@/store/appStore";
import { handleSignOut } from "@/utils";
import { LogOut, MessageCircle, User, Settings } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function ChatHeader() {
    const { currentUser } = useAuth();
    const { setShowUserList } = useAppActions();
    const MySwal = withReactContent(Swal);

    const confirmSignOut = () => {
        MySwal.fire({
            title: "Are you sure?",
            text: "You will be signed out of your account.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#007930",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, sign out",
            cancelButtonText: "Cancel",
            background: "#1e1e1e",
            color: "#e4e4e4",
        }).then((result) => {
            if (result.isConfirmed) {
                handleSignOut(currentUser?.uid as string);
            }
        });
    };
    return (
        <>
            <div className="px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold">{companyName} WEB</h1>
                <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                        <Link href="/profile">
                            <button
                                className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                                title="Profile"
                            >
                                <User size={18} />
                            </button>
                        </Link>

                        <Link href="/settings">
                            <button
                                className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </Link>

                        {
                            currentUser?.role === 'admin' && (
                                <button
                                    onClick={() => setShowUserList(true)}
                                    className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                                    title="New Chat"
                                >
                                    <MessageCircle size={18} />
                                </button>
                            )

                        }


                        <button
                            onClick={confirmSignOut}
                            className="hover:bg-gray-100 hover:text-gray-800 p-2 cursor-pointer rounded-full transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}