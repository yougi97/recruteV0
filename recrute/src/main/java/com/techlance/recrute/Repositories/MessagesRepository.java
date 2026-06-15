package com.techlance.recrute.Repositories;

import com.techlance.recrute.Entities.Messages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MessagesRepository extends JpaRepository<Messages, Long> {

    @Query("SELECT m FROM Messages m WHERE m.offer.id = :offerId " +
           "AND ((m.sender.id = :userA AND m.recipient.id = :userB) " +
           "OR (m.sender.id = :userB AND m.recipient.id = :userA)) " +
           "ORDER BY m.createdAt ASC")
    List<Messages> findThread(@Param("offerId") Long offerId,
                              @Param("userA") Long userA,
                              @Param("userB") Long userB);

    @Query("SELECT COUNT(m) FROM Messages m WHERE m.recipient.id = :userId AND m.isRead = false")
    long countUnread(@Param("userId") Long userId);

    @Query("SELECT m FROM Messages m WHERE m.sender.id = :userId OR m.recipient.id = :userId ORDER BY m.createdAt DESC")
    List<Messages> findAllForUser(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Messages m SET m.isRead = true " +
           "WHERE m.offer.id = :offerId AND m.recipient.id = :myUserId AND m.sender.id = :otherUserId")
    void markRead(@Param("offerId") Long offerId,
                  @Param("myUserId") Long myUserId,
                  @Param("otherUserId") Long otherUserId);
}
