package com.evolvia.repository;

import com.evolvia.model.Dividend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DividendRepository extends JpaRepository<Dividend, UUID> {
    List<Dividend> findByUserId(UUID userId);
    List<Dividend> findByUserIdAndTicker(UUID userId, String ticker);
    List<Dividend> findByUserIdAndPaymentDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);
}
