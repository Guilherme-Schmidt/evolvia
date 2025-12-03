package com.evolvia.repository;

import com.evolvia.model.BrokerAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BrokerAccountRepository extends JpaRepository<BrokerAccount, UUID> {
    List<BrokerAccount> findByUserId(UUID userId);
}
