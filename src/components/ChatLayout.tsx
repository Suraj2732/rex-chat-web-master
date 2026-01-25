// src/components/ChatLayout.tsx
'use client';

import { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

import EmptyState from './EmptyState';
import SidebarNav from './SidebarNav';
import NewChatPanel from './new-chat/NewChatPanel';
import ToggleNotificationBar from './chat-list/ToggleNotificationBar';
// StateContext removed - using Zustand store now

export default function ChatLayout() {
   
    console.log("Chat layout")

    return (
        <>
        <ToggleNotificationBar />
        <div className="flex h-screen bg-[#0b141a] text-[#e9edef]">

            <SidebarNav />
            <ChatSidebar />

            <div className="flex-1">

                <ChatWindow />

            </div>


        </div>
    </>
    );
}