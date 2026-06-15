package com.techlance.recrute.Controllers;

import com.techlance.recrute.Entities.CompanyProfiles;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Entities.Messages;
import com.techlance.recrute.Entities.Users;
import com.techlance.recrute.Repositories.CompanyProfilesRepository;
import com.techlance.recrute.Repositories.JobOfferRepository;
import com.techlance.recrute.Repositories.MessagesRepository;
import com.techlance.recrute.Repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/messages")
public class MessagesController {

    private final MessagesRepository messagesRepository;
    private final JobOfferRepository jobOfferRepository;
    private final UserRepository userRepository;
    private final CompanyProfilesRepository companyProfilesRepository;

    public MessagesController(MessagesRepository messagesRepository,
                              JobOfferRepository jobOfferRepository,
                              UserRepository userRepository,
                              CompanyProfilesRepository companyProfilesRepository) {
        this.messagesRepository = messagesRepository;
        this.jobOfferRepository = jobOfferRepository;
        this.userRepository = userRepository;
        this.companyProfilesRepository = companyProfilesRepository;
    }

    @GetMapping("/thread")
    public List<Map<String, Object>> getThread(@RequestParam Long offerId,
                                               @RequestParam Long myUserId,
                                               @RequestParam Long otherUserId) {
        messagesRepository.markRead(offerId, myUserId, otherUserId);
        return messagesRepository.findThread(offerId, myUserId, otherUserId)
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    @PostMapping
    public Map<String, Object> send(@RequestBody Map<String, Object> body) {
        Long offerId     = toLong(body.get("offerId"));
        Long senderUserId    = toLong(body.get("senderUserId"));
        Long recipientUserId = toLong(body.get("recipientUserId"));
        String text      = (String) body.get("body");

        if (offerId == null || senderUserId == null || recipientUserId == null
                || text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Champs manquants");
        }

        JobOffers offer = jobOfferRepository.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre introuvable"));
        Users sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expéditeur introuvable"));
        Users recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destinataire introuvable"));

        Messages msg = new Messages();
        msg.setOffer(offer);
        msg.setSender(sender);
        msg.setRecipient(recipient);
        msg.setBody(text.trim());
        return toMap(messagesRepository.save(msg));
    }

    @GetMapping("/conversations")
    public List<Map<String, Object>> getConversations(@RequestParam Long userId) {
        List<Messages> all = messagesRepository.findAllForUser(userId);
        Map<String, Map<String, Object>> convMap = new LinkedHashMap<>();
        for (Messages m : all) {
            Long otherId = m.getSender().getId().equals(userId)
                    ? m.getRecipient().getId()
                    : m.getSender().getId();
            String key = m.getOffer().getId() + "_" + otherId;
            if (!convMap.containsKey(key)) {
                Users other = m.getSender().getId().equals(userId) ? m.getRecipient() : m.getSender();
                String otherType = other.getUserType();
                Long otherProfileId = null;
                if ("company".equals(otherType)) {
                    CompanyProfiles cp = companyProfilesRepository.findByUserId(otherId);
                    if (cp != null) otherProfileId = cp.getId();
                }
                Map<String, Object> conv = new LinkedHashMap<>();
                conv.put("offerId", m.getOffer().getId());
                conv.put("offerTitle", m.getOffer().getTitle());
                conv.put("otherUserId", otherId);
                conv.put("otherName", other.getFirstName() + " " + other.getLastName());
                conv.put("otherUserType", otherType);
                conv.put("otherProfileId", otherProfileId);
                conv.put("lastBody", m.getBody());
                conv.put("lastAt", m.getCreatedAt().toString());
                conv.put("unreadCount", 0L);
                convMap.put(key, conv);
            }
            if (m.getRecipient().getId().equals(userId) && !m.isRead()) {
                Map<String, Object> conv = convMap.get(key);
                conv.put("unreadCount", ((Long) conv.get("unreadCount")) + 1L);
            }
        }
        return new ArrayList<>(convMap.values());
    }

    @GetMapping("/unread")
    public Map<String, Long> unreadCount(@RequestParam Long userId) {
        return Map.of("count", messagesRepository.countUnread(userId));
    }

    private Map<String, Object> toMap(Messages m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("offerId", m.getOffer().getId());
        map.put("senderUserId", m.getSender().getId());
        map.put("senderName", m.getSender().getFirstName() + " " + m.getSender().getLastName());
        map.put("recipientUserId", m.getRecipient().getId());
        map.put("body", m.getBody());
        map.put("isRead", m.isRead());
        map.put("createdAt", m.getCreatedAt().toString());
        return map;
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).longValue();
        try { return Long.parseLong(v.toString()); } catch (Exception e) { return null; }
    }
}
