package com.evolvia.repository;

import com.evolvia.model.TreasuryBond;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TreasuryBondRepository extends JpaRepository<TreasuryBond, UUID> {
    List<TreasuryBond> findByUserId(UUID userId);
}
