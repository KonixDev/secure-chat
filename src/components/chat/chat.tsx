import { LoggedInUserData, Message, RoomData } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React from "react";

interface ChatProps {
  messages?: Message[];
  selectedRoom: RoomData;
  isMobile: boolean;
  sendMessageIo: (newMessage: Message) => void;
}

export function Chat({ messages, selectedRoom, isMobile, sendMessageIo }: ChatProps) {
  const sendMessage = (newMessage: Message) => {
    sendMessageIo(newMessage);
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar selectedRoom={selectedRoom} />
      <ChatList
        messages={messages}
        selectedRoom={selectedRoom}
        sendMessage={sendMessage}
        isMobile={isMobile}
      />
    </div>
  );
}
