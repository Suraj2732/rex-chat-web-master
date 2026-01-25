
"use client";

 
import { User } from "@/types";
import React, { createContext, useContext, useState } from "react";



interface StateContextType {
    refresh: boolean;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    showUserList: boolean;
    setShowUserList: React.Dispatch<React.SetStateAction<boolean>>;
    selectedChatId: string | null;
    setSelectedChatId: React.Dispatch<React.SetStateAction<string | null>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    selectedChatUser: User | null;
    setSelectedChatUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);


export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [refresh, setRefresh] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showUserList, setShowUserList] = useState<boolean>(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <StateContext.Provider value={{ refresh, setRefresh, loading, setLoading ,selectedChatId, setSelectedChatId , selectedChatUser,showUserList, setShowUserList, setSelectedChatUser,searchQuery, setSearchQuery }}>
            {children}
        </StateContext.Provider>
    );
};


export const useStateContext = (): StateContextType => {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error("useStateContext must be used within a StateProvider");
    }
    return context;
};