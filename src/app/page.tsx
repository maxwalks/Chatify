"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import HomePage from "@/components/HomePage";

// Create a client component that uses useSearchParams
function HomeContent() {
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

// Main page component with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
} 