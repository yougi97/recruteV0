import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessagesService, ConversationItem } from '../services/messages';
import { ChatComponent } from '../components/chat/chat';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  templateUrl: './messagerie.html',
  styleUrls: ['./messagerie.scss'],
})
export class MessagerieComponent implements OnInit, OnDestroy {
  myUserId = 0;
  conversations: ConversationItem[] = [];
  selected: ConversationItem | null = null;
  loading = true;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private svc: MessagesService) {}

  ngOnInit(): void {
    this.myUserId = Number(localStorage.getItem('user_id'));
    this.load();
    this.pollTimer = setInterval(() => this.load(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  load(): void {
    if (!this.myUserId) return;
    this.svc.getConversations(this.myUserId).subscribe({
      next: (convs) => {
        this.conversations = convs;
        if (this.selected) {
          const refreshed = convs.find(
            c => c.offerId === this.selected!.offerId && c.otherUserId === this.selected!.otherUserId
          );
          if (refreshed) this.selected = refreshed;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  select(conv: ConversationItem): void {
    this.selected = conv;
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }
}
