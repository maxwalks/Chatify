"use client";
import { io, Socket } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { sendMessage, fetchMessages } from "@/app/actions";
import { useQuery } from "@tanstack/react-query";
import { Message } from "@types"
import { useUser } from "@clerk/nextjs";
import { Send, ArrowLeft, Moon, Sun, AlertCircle, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { nanoid } from "nanoid"
import { format } from "date-fns";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface HomePagePropTypes {
  roomId: number
}

// Define a proper type for the Socket
interface ClientToServerEvents {
  join_room: (data: { roomId: number; user: string }) => void;
  send_message: (data: { message: string; room: number | null; messageId: string }) => void;
}

interface ServerToClientEvents {
  recieved_message: (data: Message) => void;
  user_join: (data: { username: string; roomId: number }) => void;
}

const ConnectionStatus = ({ isConnected, onClick }: { isConnected: boolean, onClick: () => void }) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 h-auto ${isConnected ? 'text-green-500' : 'text-red-500'}`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span className="text-xs">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span className="text-xs">Disconnected</span>
        </>
      )}
    </Button>
  );
};

export default function HomePage(props: HomePagePropTypes) {
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [room, setRoom] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    console.log("Connecting to backend at:", BACKEND_URL);
    
    const socketInstance = io(BACKEND_URL);
    
    setSocket(socketInstance);
    socketInstance.on("connect", () => {
      console.log("Socket connected", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.log("Connection error:", err.message);
      setIsConnected(false);
    });

    socketInstance.on("error", (err) => {
      console.log("Socket error:", err);
      setIsConnected(false);
    });

    socketInstance.connect();
    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("connect_error");
      socketInstance.off("error");
      socketInstance.off("recieved_message");
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !user?.username) return;
    
    if (props.roomId !== null) {
      setRoom(props.roomId);
      const data : {roomId: number, user: string} = {
        roomId: props.roomId,
        user: user?.username
      }
      socket.emit("join_room", data);
    }
    inputRef.current?.focus();
  }, [props.roomId, user, socket]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", props.roomId],
    queryFn: () => fetchMessages(room || 0),
    enabled: room !== null,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (messages) {
      setMessageList(messages);
      setTimeout(scrollToBottom, 300);
    }
  }, [messages]);

  useEffect(() => {
    if (messageList.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 100);
      });
    }
  }, [messageList, messageList.length]);

  useEffect(() => {
    const handleResize = () => {
      if (messageList.length > 0) {
        scrollToBottom();
      }
    };

    window.addEventListener('resize', handleResize);
    
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [messageList.length]);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceivedMessage = (data: Message) => {
      setMessageList((prevList) => {
        if (prevList.some(msg => msg.messageId === data.messageId)) {
          return prevList;
        }
        return [...prevList, data];
      });
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 100);
      });
    };
    
    socket.on("recieved_message", handleReceivedMessage);
    
    return () => {
      socket.off("recieved_message", handleReceivedMessage);
    };
  }, [socket]);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const timeDiff = now - lastMessageTime;
    if (timeDiff < 500) {
      setRateLimited(true);
      setTimeout(() => setRateLimited(false), 500 - timeDiff);
      return false;
    }

    setLastMessageTime(now);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || rateLimited || !socket || !isConnected) return;
    
    if (!checkRateLimit()) return;

    const messageId = nanoid(10)

    const newMessage = {
      message: message.trim(),
      sender: user?.username || "Anonymous",
      room: room || 0,
      messageId,
      timestamp: new Date().toISOString()
    };

    setMessageList((prevList) => [...prevList, newMessage]);
    
    socket.emit("send_message", {
      message: message.trim(),
      room,
      messageId
    });
    sendMessage(message.trim(), room || 0, user?.username || "Anonymous");
    setMessage("");
  };
  
  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "h:mm a");
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div
      className={`flex flex-col h-screen w-full ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* Chat Header */}
      <header
        className={`flex items-center justify-between px-4 py-3 border-b ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } shadow-sm`}
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => (window.location.href = "/select-room")}
            variant="ghost"
            size="icon"
            className={darkMode ? "text-gray-300 hover:bg-gray-700" : ""}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">Room #{props.roomId}</h2>
              <Badge variant={isConnected ? "secondary" : "destructive"} className={`h-5 px-1.5 py-0 ${isConnected ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}>
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    Disconnected
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Secure chat room
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className={
                    darkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-200"
                  }
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{darkMode ? "Light mode" : "Dark mode"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    darkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-200"
                  }
                >
                  <ShieldCheck className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>End-to-end encrypted</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SignedOut>
            <SignInButton>
              <Button
                variant="ghost"
                size="sm"
                className={darkMode ? "text-blue-400" : "text-blue-600"}
              >
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/select-room" />
          </SignedIn>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden z-10">
        <ScrollArea 
          className="h-full" 
          scrollHideDelay={100}
          type="always"
        >
          <div className={`p-4 ${darkMode ? "bg-transparent" : "bg-transparent"}`}>
            {isLoading ? (
              <div className="flex h-full items-center justify-center py-12">
                <div
                  className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                    darkMode ? "border-gray-300" : "border-gray-600"
                  }`}
                />
              </div>
            ) : messageList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={`p-4 rounded-full ${darkMode ? "bg-gray-800/50 backdrop-blur-sm" : "bg-white/50 backdrop-blur-sm shadow-lg"} mb-4`}>
                  <ShieldCheck className={`h-8 w-8 ${darkMode ? "text-blue-400" : "text-blue-500"}`} />
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} max-w-xs`}>
                  Be the first to start a conversation in this room
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messageList.map((item, idx) => {
                  const isCurrentUser = item.sender === user?.username;
                  const showSender =
                    idx === 0 || messageList[idx - 1]?.sender !== item.sender;

                  return (
                    <div key={item.messageId || idx} className="mb-4">
                      {showSender && (
                        <div
                          className={`flex items-center ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          } mb-1`}
                        >
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isCurrentUser ? "You" : item.sender} •{" "}
                            {formatMessageTime(item.timestamp)}
                          </p>
                        </div>
                      )}

                      <div
                        className={`flex ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isCurrentUser && showSender && (
                          <Avatar className="h-8 w-8 mr-2 mt-1 ring-2 ring-white dark:ring-gray-800">
                            <AvatarFallback
                              className={darkMode ? "bg-gray-700" : "bg-gray-200"}
                            >
                              {item.sender?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-xs sm:max-w-md px-4 py-2 rounded-2xl backdrop-blur-sm transition-all duration-200 ${
                            isCurrentUser
                              ? darkMode
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                              : darkMode
                              ? "bg-gray-800/80 text-gray-100 shadow-md"
                              : "bg-white/80 text-gray-800 shadow-md"
                          } ${
                            idx > 0 &&
                            messageList[idx - 1]?.sender === item.sender
                              ? isCurrentUser
                                ? "rounded-tr-md"
                                : "rounded-tl-md"
                              : ""
                          } hover:shadow-lg`}
                        >
                          <p className="whitespace-pre-wrap break-words">{item.message}</p>
                        </div>

                        {isCurrentUser && showSender && (
                          <Avatar className="h-8 w-8 ml-2 mt-1 ring-2 ring-white dark:ring-gray-800">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback
                              className={darkMode ? "bg-gray-700" : "bg-gray-200"}
                            >
                              {user?.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* This is the scroll anchor */}
                <div ref={messagesEndRef} className="h-1" id="messages-end" />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div
        className={`p-4 border-t ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500} // Security: limit message length
            className={`flex-1 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-blue-600"
                : "bg-gray-50 border-gray-200"
            }`}
            disabled={!isConnected || rateLimited}
          />
          <Button
            type="submit"
            className={`${
              message.trim() && isConnected && !rateLimited
                ? darkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
                : darkMode
                ? "bg-gray-700 text-gray-400"
                : "bg-gray-200 text-gray-400"
            }`}
            disabled={!message.trim() || !isConnected || rateLimited}
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </form>
        {rateLimited && (
          <p className="text-xs text-yellow-500 mt-1 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Slow down! You&apos;re sending messages too quickly.
          </p>
        )}
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Disconnected from server. Reconnecting...
          </p>
        )}
      </div>
    </div>
  );
}