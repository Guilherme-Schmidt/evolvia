package com.evolvia.repository;

import com.evolvia.model.Transaction;
import com.evolvia.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    List<Transaction> findByUserIdOrderByDateDesc(UUID userId);
    List<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(UUID userId, LocalDate startDate, LocalDate endDate);
    List<Transaction> findByUserIdAndTypeOrderByDateDesc(UUID userId, TransactionType type);
    List<Transaction> findByUserIdAndCreditCardIdOrderByDateDesc(UUID userId, UUID creditCardId);
}
