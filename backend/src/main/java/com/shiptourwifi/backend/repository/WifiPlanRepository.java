package com.shiptourwifi.backend.repository;

import com.shiptourwifi.backend.model.WifiPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WifiPlanRepository extends JpaRepository<WifiPlan, Long> {

    List<WifiPlan> findByActiveTrueOrderByPriceAsc();
}
