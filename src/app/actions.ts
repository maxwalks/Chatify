import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Message } from "@types"

export async function fetchMessages(roomId: number) {
  try {
    const q = query(
      collection(db, "rooms", roomId.toString(), "messages"),
      orderBy("timestamp", "asc")
    );
    
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        message: data.text,
        sender: data.sender,
        timestamp: data.timestamp?.toDate().toISOString(),
        room: roomId
      } as Message;
    });
    
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

export async function sendMessage(
  message: string, 
  roomId: number, 
  sender: string,
) {
  try {
    const messagesCollection = collection(
      db,
      "rooms",
      roomId.toString(),
      "messages"
    );
    
    await addDoc(messagesCollection, {
      sender,
      text: message,
      timestamp: Timestamp.now(),
      room: roomId
    });
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
}