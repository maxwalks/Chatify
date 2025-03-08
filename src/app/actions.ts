import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query } from "firebase/firestore";
import { Message } from "@types"

export async function fetchMessages(roomId: number) {
  try {
    const q = query(collection(db, "rooms", roomId.toString(), "messages"));
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map((doc) => ({
      sender: doc.data().sender,
      message: doc.data().text,
    })) as Message[];

    return messages;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function sendMessage(message: string, roomId: number) {
  try {
    const messagesCollection = collection(
      db,
      "rooms",
      roomId.toString(),
      "messages"
    );
    await addDoc(messagesCollection, {
      sender: "test",
      text: message,
    });
  } catch (error) {
    console.error(error);
  }
}
