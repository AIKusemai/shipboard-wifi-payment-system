package com.shiptourwifi.backend.repository;

import com.shiptourwifi.backend.model.WifiSession;
import com.shiptourwifi.backend.model.WifiSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WifiSessionRepository extends JpaRepository<WifiSession, Long> {

    List<WifiSession> findByUserEmailOrderByStartTimeDesc(String userEmail);

    List<WifiSession> findByStatusOrderByStartTimeDesc(WifiSessionStatus status);

    Optional<WifiSession> findFirstByUserEmailOrderByStartTimeDesc(String userEmail);
}
