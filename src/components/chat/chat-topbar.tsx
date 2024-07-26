import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { room, RoomData } from "@/app/data";
import { Info, Phone, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import Modal from "react-modal"; // Suponiendo que usas react-modal
import { useSocket } from "@/context/SocketContext";
import { initiateAudioCall, leaveAudioCall } from "@/utils/socketUtils";

interface ChatTopbarProps {
  selectedRoom: RoomData;
}

export const TopbarIcons = [
  { icon: Phone, action: "audio" },
  { icon: Video, action: "video" },
  { icon: Info, action: "" }
];

export default function ChatTopbar({ selectedRoom }: ChatTopbarProps) {
  const [callType, setCallType] = useState("");
  const [isOnCall, setIsOnCall] = useState(false);

  const { nickname, roomId } = useSocket();

  const handleCallClick = (type: any) => {
    setCallType(type);
    const confirm = window.confirm("¿Realmente quieres iniciar una llamada?");
    if (confirm) {
      if (type === "audio") {
        initiateAudioCall({roomId, nickname});
        setIsOnCall(true);
      } else if (type === "video") {
        initiateVideoCall();
      }
    }
  };

  // handle when leave call
  const handleLeaveCall = () => {
    leaveAudioCall({roomId, nickname});
    setIsOnCall(false);
    
  }

  const initiateVideoCall = () => {
    // Lógica para iniciar una llamada de video
    console.log("Iniciando llamada de video...");
  };
  return (
    <div className="w-full h-20 flex p-4 justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <Avatar className="flex justify-center items-center">
          <AvatarFallback
            className="flex justify-center items-center"
            title={selectedRoom.roomId}
          />
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">
            {selectedRoom.roomId}
          </span>
          {/* <span className="text-xs">Active 2 mins ago</span> */}
        </div>
      </div>

      <div>
        {TopbarIcons.map((icon, index) =>
          <Link
            key={index}
            href="#"
            onClick={() => handleCallClick(icon.action)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
            )}
          >
            <icon.icon size={20} className="text-muted-foreground" />
          </Link>
        )}
      </div>

      {isOnCall && (
        <div className="flex gap-4">
          <button onClick={() => handleLeaveCall()}>Colgar</button>
        </div>
      )}

      {/* <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setModalOpen(false)}
        style={customStyles}
        contentLabel="Confirm Call"
      >
        <h2>¿Realmente quieres iniciar una llamada?</h2>
        <div
          className="flex gap-4"
        >
          <button onClick={confirmCall}>Sí</button>
          <button onClick={() => setModalOpen(false)}>No</button>
        </div>
      </Modal> */}
    </div>
  );
}
