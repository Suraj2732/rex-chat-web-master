import { useShowUserList, useAppActions } from "@/store/appStore";
import ChatUserList from "./chat-list/ChatUserList";
import NewChatPanel from "./new-chat/NewChatPanel";

export default function ChatSidebar() {
  const showUserList = useShowUserList();
  const { setShowUserList } = useAppActions();
  return (
    <>
      {showUserList ? (

        <NewChatPanel
          onClose={() => setShowUserList(false)}
        />
      ) : (
        <ChatUserList />
      )
      }
    </>

  )
}