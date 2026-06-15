export interface Message {
  id: number;
  offerId: number;
  senderUserId: number;
  senderName: string;
  recipientUserId: number;
  body: string;
  isRead: boolean;
  createdAt: string;
}
