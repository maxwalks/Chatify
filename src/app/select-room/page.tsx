"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useUser, Protect } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, History, Plus, MessageSquare } from "lucide-react";

export default function SelectRoom() {
  const [room, setRoom] = useState("");
  const router = useRouter();
  const { user } = useUser();
  
  const recentRooms = [1, 42, 99];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?room=${room}`);
  };
  
  const joinRoom = (roomNumber: number | string) => {
    router.push(`/?room=${roomNumber}`);
  };
  
  return (
    <Protect>
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl bg-blue-400" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl bg-indigo-500" />
        
        {/* Small decorative circles */}
        <div className="absolute top-1/4 left-1/3">
          <div className="w-2 h-2 rounded-full bg-blue-500 opacity-30"></div>
        </div>
        <div className="absolute bottom-1/3 right-1/4">
          <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-30"></div>
        </div>
        <div className="absolute top-1/2 right-1/3">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-30"></div>
        </div>
        
        <Card className="w-full max-w-md mx-4 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-lg">
              <MessageSquare className="h-6 w-6" />
            </div>
          </div>
          
          <CardHeader className="text-center pt-12">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Join a Chat Room
            </CardTitle>
            <CardDescription className="text-gray-500">
              Welcome back, <span className="font-medium text-indigo-500">{user?.username || 'Guest'}</span>!
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="room" className="text-sm font-medium text-gray-700">Room Number</Label>
                <div className="relative">
                  <Input
                    type="number"
                    id="room"
                    placeholder="Enter room number..."
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="text-lg pr-10 bg-gray-50/70 border-gray-100 focus-visible:ring-indigo-400 rounded-full"
                    required
                    min="1"
                  />
                  {room && (
                    <Button
                      type="submit" 
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {recentRooms.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-500">Recent Rooms</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {recentRooms.map(roomNumber => (
                      <Button
                        key={roomNumber}
                        variant="outline"
                        className="border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 rounded-full"
                        onClick={() => joinRoom(roomNumber)}
                      >
                        Room #{roomNumber}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      className="border-dashed border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-all duration-200 rounded-full"
                      onClick={() => document.getElementById('room')?.focus()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
                size="lg"
                disabled={!room}
              >
                Join Room
              </Button>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Enter any room number to start chatting with others
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Protect>
  );
}