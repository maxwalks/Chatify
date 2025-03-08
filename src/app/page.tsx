"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import HomePage from "@/components/HomePage";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomParam = searchParams.get("room");

  useEffect(() => {
    if (!roomParam) {
      router.push("/select-room");
    }
  }, [roomParam, router]);

  if (!roomParam) {
    return null;
  }

  const roomId = parseInt(roomParam, 10);

  return <HomePage roomId={roomId} />;
}
