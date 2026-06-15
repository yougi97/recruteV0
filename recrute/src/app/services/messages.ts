import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../model/message';

export interface ConversationItem {
  offerId: number;
  offerTitle: string;
  otherUserId: number;
  otherName: string;
  lastBody: string;
  lastAt: string;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/messages';

  getConversations(userId: number): Observable<ConversationItem[]> {
    return this.http.get<ConversationItem[]>(`${this.base}/conversations?userId=${userId}`);
  }

  getThread(offerId: number, myUserId: number, otherUserId: number): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.base}/thread?offerId=${offerId}&myUserId=${myUserId}&otherUserId=${otherUserId}`
    );
  }

  send(offerId: number, senderUserId: number, recipientUserId: number, body: string): Observable<Message> {
    return this.http.post<Message>(this.base, { offerId, senderUserId, recipientUserId, body });
  }

  unreadCount(userId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/unread?userId=${userId}`);
  }
}
