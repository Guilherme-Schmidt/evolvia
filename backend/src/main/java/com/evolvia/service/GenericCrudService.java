package com.evolvia.service;

import com.evolvia.model.*;
import com.evolvia.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GenericCrudService {

    private final ProfileRepository profileRepository;
    private final CreditCardRepository creditCardRepository;
    private final BudgetRepository budgetRepository;
    private final FinancialGoalRepository financialGoalRepository;
    private final BrokerAccountRepository brokerAccountRepository;
    private final DividendRepository dividendRepository;
    private final TreasuryBondRepository treasuryBondRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @SuppressWarnings("unchecked")
    public <T> JpaRepository<T, UUID> getRepository(String tableName) {
        return switch (tableName) {
            case "profiles" -> (JpaRepository<T, UUID>) profileRepository;
            case "credit_cards" -> (JpaRepository<T, UUID>) creditCardRepository;
            case "budgets" -> (JpaRepository<T, UUID>) budgetRepository;
            case "financial_goals" -> (JpaRepository<T, UUID>) financialGoalRepository;
            case "broker_accounts" -> (JpaRepository<T, UUID>) brokerAccountRepository;
            case "dividends" -> (JpaRepository<T, UUID>) dividendRepository;
            case "treasury_bonds" -> (JpaRepository<T, UUID>) treasuryBondRepository;
            default -> throw new RuntimeException("Invalid table: " + tableName);
        };
    }

    private Class<?> getEntityClass(String tableName) {
        return switch (tableName) {
            case "profiles" -> Profile.class;
            case "credit_cards" -> CreditCard.class;
            case "budgets" -> Budget.class;
            case "financial_goals" -> FinancialGoal.class;
            case "broker_accounts" -> BrokerAccount.class;
            case "dividends" -> Dividend.class;
            case "treasury_bonds" -> TreasuryBond.class;
            default -> throw new RuntimeException("Invalid table: " + tableName);
        };
    }

    public <T> List<T> findAll(String tableName, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return switch (tableName) {
            case "profiles" -> (List<T>) profileRepository.findById(user.getId())
                    .map(List::of)
                    .orElse(List.of());
            case "credit_cards" -> (List<T>) creditCardRepository.findByUserId(user.getId());
            case "budgets" -> (List<T>) budgetRepository.findByUserId(user.getId());
            case "financial_goals" -> (List<T>) financialGoalRepository.findByUserId(user.getId());
            case "broker_accounts" -> (List<T>) brokerAccountRepository.findByUserId(user.getId());
            case "dividends" -> (List<T>) dividendRepository.findByUserId(user.getId());
            case "treasury_bonds" -> (List<T>) treasuryBondRepository.findByUserId(user.getId());
            default -> throw new RuntimeException("Invalid table: " + tableName);
        };
    }

    public <T> T findById(String tableName, UUID id) {
        JpaRepository<T, UUID> repo = getRepository(tableName);
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found"));
    }

    @Transactional
    public <T> T create(String tableName, Map<String, Object> entityData) {
        JpaRepository<T, UUID> repo = getRepository(tableName);
        Class<?> entityClass = getEntityClass(tableName);

        T entity = (T) objectMapper.convertValue(entityData, entityClass);
        return repo.save(entity);
    }

    @Transactional
    public <T> T update(String tableName, UUID id, Map<String, Object> entityData) {
        JpaRepository<T, UUID> repo = getRepository(tableName);
        Class<?> entityClass = getEntityClass(tableName);

        if (!repo.existsById(id)) {
            throw new RuntimeException("Record not found");
        }

        // Garante que o ID está presente nos dados
        entityData.put("id", id);

        T entity = (T) objectMapper.convertValue(entityData, entityClass);
        return repo.save(entity);
    }

    @Transactional
    public <T> void delete(String tableName, UUID id) {
        JpaRepository<T, UUID> repo = getRepository(tableName);
        repo.deleteById(id);
    }
}
