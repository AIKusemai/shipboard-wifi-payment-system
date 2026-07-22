package com.shiptourwifi.backend.repository;

import com.shiptourwifi.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Finds a user by email (needed for Login)
    Optional<User> findByEmail(String email);

}