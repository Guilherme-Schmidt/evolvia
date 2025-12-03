package com.evolvia.repository;

import com.evolvia.model.Budget;
import com.evolvia.model.TransactionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByUserId(UUID userId);
    List<Budget> findByUserIdAndMonthAndYear(UUID userId, Integer month, Integer year);
    Optional<Budget> findByUserIdAndCategoryAndMonthAndYear(UUID userId, TransactionCategory category, Integer month, Integer year);
}
