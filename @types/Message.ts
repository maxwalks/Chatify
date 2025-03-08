interface Message {
  message: string;
  sender: string;
  room?: string | number;
  userId?: string;
  timestamp?: string;
  messageId?: string;
}

export default Message