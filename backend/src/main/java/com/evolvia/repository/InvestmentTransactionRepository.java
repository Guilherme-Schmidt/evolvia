package com.evolvia.repository;

import com.evolvia.model.InvestmentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransaction, UUID> {
    List<InvestmentTransaction> findByInvestmentId(UUID investmentId);

    @Query("SELECT it FROM InvestmentTransaction it WHERE it.investment.user.id = :userId ORDER BY it.transactionDate DESC")
    List<InvestmentTransaction> findByUserId(UUID userId);
}
