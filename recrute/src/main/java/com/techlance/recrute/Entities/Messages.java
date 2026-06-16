package com.techlance.recrute.Entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Messages {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "offer_id", nullable = false)
    private JobOffers offer;

    @ManyToOne
    @JoinColumn(name = "sender_user_id", nullable = false)
    private Users sender;

    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private Users recipient;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public JobOffers getOffer() { return offer; }
    public void setOffer(JobOffers offer) { this.offer = offer; }
    public Users getSender() { return sender; }
    public void setSender(Users sender) { this.sender = sender; }
    public Users getRecipient() { return recipient; }
    public void setRecipient(Users recipient) { this.recipient = recipient; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
