"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useUser, Protect } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DoorOpen } from "lucide-react"; // Import the icon

export default function SelectRoom() {
  const [room, setRoom] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?room=${room}`);
  };

  return (
    <Protect>
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <DoorOpen className="h-6 w-6" />
              Join a Room
            </CardTitle>
            <CardDescription>
              Welcome, {user?.username || 'Guest'}! Enter a room number to join the chat.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  type="number"
                  id="room"
                  placeholder="Enter room number..."
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="text-lg"
                  required
                  min="1"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                size="lg"
                disabled={!room}
              >
                Join Room
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Protect>
  );
}