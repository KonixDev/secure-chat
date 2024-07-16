import React from 'react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { RoomData } from '@/app/data';
import { Info, Phone, Video } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';

interface ChatTopbarProps {
    selectedRoom: RoomData;
    }
    
    export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];


export default function ChatTopbar({selectedRoom}: ChatTopbarProps) {
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
            <span className="font-medium">{selectedRoom.roomId}</span>
            {/* <span className="text-xs">Active 2 mins ago</span> */}
          </div>
        </div>

        <div>
          {TopbarIcons.map((icon, index) => (
            <Link
              key={index}
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
                "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
              )}
            >
              <icon.icon size={20} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
  )
}
