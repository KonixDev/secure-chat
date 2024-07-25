// src/components/SocketClient.jsx
"use client";

import { useState } from "react";
import LoginForm from "./LoginForm.jsx";
import { ChatLayout } from "@/components/chat/chat-layout";
import { useSocket } from "@/context/SocketContext";

const SocketClient = () => {
  const {
    messages,
    nickname,
    authenticated,
    selectedRoom,
    authenticate,
    sendMessage,
    sendAudioMessage,
    editMessage,
    deleteMessage,
    clearMessages
  } = useSocket();

  return (
    <div className="flex h-[calc(100dvh)] flex-col items-center justify-center p-4 md:px-24 py-4 gap-4 w-full bg-cover bg-center bg-no-repeat">
      {!authenticated
        ? <LoginForm onAuthenticate={authenticate} />
        : <main className="flex h-[calc(100dvh)] w-full flex-col items-center justify-center p-2 md:px-24 py-2 gap-4">
            <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm lg:flex">
              <ChatLayout
                defaultLayout={undefined}
                selectedRoom={selectedRoom}
                messages={messages}
                currentUser={nickname}
                sendMessageIo={sendMessage}
                sendAudioIo={sendAudioMessage}
              />
            </div>
          </main>}
    </div>
  );
};

export default SocketClient;
