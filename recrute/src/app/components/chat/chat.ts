import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../../services/messages';
import { Message } from '../../model/message';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss'],
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() offerId!: number;
  @Input() myUserId!: number;
  @Input() otherUserId!: number;
  @Input() otherName = '';
  @Input() fullHeight = false;

  @ViewChild('bottom') private bottom!: ElementRef;

  messages: Message[] = [];
  draft = '';
  sending = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private shouldScroll = false;
  private initialized = false;

  constructor(private svc: MessagesService) {}

  ngOnInit(): void {
    this.load();
    this.pollTimer = setInterval(() => this.load(), 4000);
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['offerId'] || changes['otherUserId']) {
      this.messages = [];
      this.draft = '';
      this.load();
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.bottom?.nativeElement?.scrollIntoView({ block: 'end' });
      this.shouldScroll = false;
    }
  }

  load(): void {
    this.svc.getThread(this.offerId, this.myUserId, this.otherUserId).subscribe({
      next: (msgs) => {
        if (msgs.length !== this.messages.length) this.shouldScroll = true;
        this.messages = msgs;
      },
      error: () => {},
    });
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.sending) return;
    this.sending = true;
    this.svc.send(this.offerId, this.myUserId, this.otherUserId, text).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.draft = '';
        this.sending = false;
        this.shouldScroll = true;
      },
      error: () => { this.sending = false; },
    });
  }

  isMine(msg: Message): boolean {
    return msg.senderUserId === this.myUserId;
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }
}
