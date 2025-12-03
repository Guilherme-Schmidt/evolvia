package com.evolvia.repository;

import com.evolvia.model.FinancialGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FinancialGoalRepository extends JpaRepository<FinancialGoal, UUID> {
    List<FinancialGoal> findByUserId(UUID userId);
    List<FinancialGoal> findByUserIdAndStatus(UUID userId, String status);
}
