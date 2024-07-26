'use client';

import { LoggedInUserData, Message, RoomData } from "@/app/data";
import { cn } from "@/lib/utils";
import React, { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ChatBottombar from "./chat-bottombar";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import ImageModal from "./ImageModal";

interface ChatListProps {
  messages?: Message[];
  selectedRoom: RoomData;
  sendMessage: (newMessage: Message) => void;
  sendAudioMessage: (audioBlob: Blob) => void;
  isMobile: boolean;
}

export function ChatList({
  messages,
  selectedRoom,
  sendMessage,
  sendAudioMessage,
  isMobile,
}: ChatListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { nickname, socket } = useSocket();
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on('userTyping', (userNickname: string) => {
      if (!typingUsers.includes(userNickname)) {
        setTypingUsers([...typingUsers, userNickname]);
      }
    });

    socket.on('userStopTyping', (userNickname: string) => {
      setTypingUsers(typingUsers.filter(name => name !== userNickname));
    });

    return () => {
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [socket, typingUsers]);

  const handleSelectMessage = (messageId: string) => {
    if (selectedMessage === messageId) {
      setSelectedMessage(null);
    } else {
      setSelectedMessage(messageId);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  const closeImageModal = () => {
    setFullscreenImage(null);
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      {fullscreenImage && (
        <ImageModal imageUrl={fullscreenImage} onClose={closeImageModal} />
      )}
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
                <span className={cn(
                  "bg-accent p-3 rounded-md max-w-xs",
                  message.type === "emoji" ? "text-4xl" : ""
                )}>
                  {message.nickname !== nickname && (
                    <span className="text-xs text-gray-500">{message.nickname}:</span>
                  )}
                  {message.nickname === nickname && (
                    <span className="text-xs text-gray-500">Yo:</span>
                  )}
                  {" "}
                  {message.type === 'image' ? (
                    <img 
                      src={message.text} 
                      alt="image" 
                      className="cursor-pointer" 
                      onClick={() => handleImageClick(message.text)} 
                    />
                  ) : typeof message.text === 'string' && message.text !== "[Encrypted Audio]" ? (
                    message.text
                  ) : (
                    <audio
                      className={cn(
                        isMobile === true ? "w-full" : "",
                      )}
                      controls src={message.audio}>
                      Your browser does not support the
                      <code>audio</code> element.
                    </audio>
                  )}
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
          {typingUsers.length > 0 && (
            <div className="text-xs text-gray-500 p-4">
              {typingUsers.join(", ")} {typingUsers.length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
        </AnimatePresence>
      </div>
      <ChatBottombar sendMessage={sendMessage} isMobile={isMobile} sendAudioMessage={sendAudioMessage} />
    </div>
  );
}
