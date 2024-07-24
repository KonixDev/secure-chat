'use client';

import { LoggedInUserData, Message, RoomData } from "@/app/data";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ChatBottombar from "./chat-bottombar";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";

interface ChatListProps {
  messages?: Message[];
  selectedRoom: RoomData;
  sendMessage: (newMessage: Message) => void;
  isMobile: boolean;
}

export function ChatList({
  messages,
  selectedRoom,
  sendMessage,
  isMobile,
}: ChatListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { nickname } = useSocket();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectMessage = (messageId: string) => {
    if (selectedMessage === messageId) {
      setSelectedMessage(null);
    } else {
      setSelectedMessage(messageId);
    }
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
      >
        <AnimatePresence>
          {messages && messages?.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: messages.indexOf(message) * 0.05 + 0.2,
                },
              }}
              style={{
                originX: 0.5,
                originY: 0.5,
              }}
              className={cn(
                "flex flex-col gap-2 p-4 whitespace-pre-wrap",
                message.nickname.toLocaleLowerCase().trim() !== nickname.toLocaleLowerCase().trim() ? "items-start" : "items-end"
              )}
              onClick={() => handleSelectMessage(message.id.toString())}
            >
              <div className="flex gap-3 items-center">
                {message.nickname !== nickname && (
                  <Avatar className="flex justify-center items-center" data-tip={message.nickname}>
                    <AvatarFallback className="flex justify-center items-center">
                      {message.nickname[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="bg-accent p-3 rounded-md max-w-xs">
                  {message.nickname !== nickname && (
                    <span className="text-xs text-gray-500">{message.nickname}:</span>
                  )}
                  {message.nickname === nickname && (
                    <span className="text-xs text-gray-500">Yo:</span>
                  )}
                  {" "}{message.text}
                  {selectedMessage === message.id.toString() && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expires at: {new Date(message.expiresAt).toLocaleString()}
                    </div>
                  )}
                </span>
                {message.nickname === nickname && (
                  <Avatar className="flex justify-center items-center" data-tip={message.nickname}>
                    <AvatarFallback className="flex justify-center items-center">
                      {message.nickname[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleString()}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ChatBottombar sendMessage={sendMessage} isMobile={isMobile} />
    </div>
  );
}
