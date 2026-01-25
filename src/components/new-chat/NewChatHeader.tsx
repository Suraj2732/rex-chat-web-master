import ContactFormModal from "../ContactFormModal";
import QuickActionItem from "./QuickActionItem";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function NewChatHeader() {
    const { currentUser } = useAuth();
    const [showContactForm, setShowContactForm] = useState(false);
     
    return (
        <>
            {currentUser?.role === 'admin' && (
                <>
                    <QuickActionItem
                        handleOnClick={() => setShowContactForm(true)}
                        title="New contact"
                        icon="person"
                    />
                    
                    {showContactForm && (
                        <ContactFormModal
                            onClose={() => setShowContactForm(false)}
                        />
                    )}
                </>
            )}
        </>
    );
}