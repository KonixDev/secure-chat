"use client";

import { LoggedInUserData, RoomData } from "@/app/data";
import React, { useEffect, useState } from "react";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Chat } from "./chat";

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  selectedRoom: RoomData;
  messages: any;
  sendMessageIo: (newMessage: any) => void;
}

export function ChatLayout({
  defaultLayout = [320, 480],
  selectedRoom,
  sendMessageIo,
  messages
}: ChatLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="h-full items-stretch"
    >
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <Chat
          messages={messages}
          selectedRoom={selectedRoom}
          isMobile={isMobile}
          sendMessageIo={sendMessageIo}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
