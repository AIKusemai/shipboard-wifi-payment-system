package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.WifiSession;
import com.ticketblitz.backend.model.WifiSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WifiSessionRepository extends JpaRepository<WifiSession, Long> {
    Optional<WifiSession> findTopByUserEmailOrderByStartTimeDesc(String userEmail);

    List<WifiSession> findByUserEmailAndStatus(String userEmail, WifiSessionStatus status);

    List<WifiSession> findAllByOrderByStartTimeDesc();
}
