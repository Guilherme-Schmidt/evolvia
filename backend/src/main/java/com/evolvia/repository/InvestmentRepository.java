package com.evolvia.repository;

import com.evolvia.model.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, UUID> {
    List<Investment> findByUserId(UUID userId);
    Optional<Investment> findByUserIdAndTicker(UUID userId, String ticker);
    List<Investment> findByUserIdAndTickerContainingIgnoreCase(UUID userId, String ticker);
}
