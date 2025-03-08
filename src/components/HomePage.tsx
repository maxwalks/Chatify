"use client";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { sendMessage, fetchMessages } from "@/app/actions";
import { useQuery } from "@tanstack/react-query";
import { Message } from "@types"
import { useUser } from "@clerk/nextjs";
import { Send } from "lucide-react";

interface HomePagePropTypes {
  roomId: number
}

export default function HomePage(props: HomePagePropTypes) {
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [room, setRoom] = useState<number | null>(null);
  const socket = io("http://localhost:5000");
  const { user } = useUser()

  useEffect(() => {
    if (props.roomId !== null) {
      setRoom(props.roomId);
      socket.emit("join_room", props.roomId);
    }
  }, [props.roomId]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => fetchMessages(room || 0),
    enabled: room !== null,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (messages) {
      setMessageList(messages);
    }
  }, [messages]);

  socket.on("recieved_message", (data: Message) => {
    setMessageList((prevList) => [...prevList, data]);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    socket.emit("send_message", {
      message,
      room,
    });
    sendMessage(message, room || 0);
    setMessage("");
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex-none">
          <CardTitle className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            Room #{props.roomId}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4 h-full">
            <div className="space-y-4 pb-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : (
                messageList.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${
                      item.sender === user?.username ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback>
                        {item.sender?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        item.sender === user?.username
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">{item.sender}</p>
                      <p>{item.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2 mt-4 pt-4 border-t flex-none"
          >
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}