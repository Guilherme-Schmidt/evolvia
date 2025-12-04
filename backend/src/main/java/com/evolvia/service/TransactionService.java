package com.evolvia.service;

import com.evolvia.exception.BadRequestException;
import com.evolvia.exception.ResourceNotFoundException;
import com.evolvia.model.Transaction;
import com.evolvia.model.User;
import com.evolvia.repository.TransactionRepository;
import com.evolvia.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public List<Transaction> getAllTransactions(String email, LocalDate startDate, LocalDate endDate, String type) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (startDate != null && endDate != null) {
            if (startDate.isAfter(endDate)) {
                throw new BadRequestException("Start date must be before or equal to end date");
            }
            return transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate);
        }

        return transactionRepository.findByUserIdOrderByDateDesc(user.getId());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Transaction createTransaction(String email, Transaction transaction) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        validateTransaction(transaction);

        transaction.setUser(user);
        return transactionRepository.save(transaction);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<Transaction> createTransactions(String email, Object transactionData) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (transactionData == null) {
            throw new BadRequestException("Transaction data cannot be null");
        }

        List<Transaction> transactions = new ArrayList<>();

        try {
            // Verifica se é um array ou objeto único
            if (transactionData instanceof List<?>) {
                // É um array de transações
                List<?> dataList = (List<?>) transactionData;
                if (dataList.isEmpty()) {
                    throw new BadRequestException("Transaction list cannot be empty");
                }
                for (Object item : dataList) {
                    Transaction transaction = objectMapper.convertValue(item, Transaction.class);
                    validateTransaction(transaction);
                    transaction.setUser(user);
                    transactions.add(transaction);
                }
            } else {
                // É uma única transação
                Transaction transaction = objectMapper.convertValue(transactionData, Transaction.class);
                validateTransaction(transaction);
                transaction.setUser(user);
                transactions.add(transaction);
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid transaction data format: " + e.getMessage());
        }

        return transactionRepository.saveAll(transactions);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void deleteTransaction(String email, UUID id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", id));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this transaction");
        }

        transactionRepository.delete(transaction);
    }

    private void validateTransaction(Transaction transaction) {
        if (transaction == null) {
            throw new BadRequestException("Transaction cannot be null");
        }

        if (transaction.getAmount() == null) {
            throw new BadRequestException("Transaction amount is required");
        }

        if (transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transaction amount must be greater than zero");
        }

        if (transaction.getDate() == null) {
            throw new BadRequestException("Transaction date is required");
        }

        if (transaction.getCategory() == null) {
            throw new BadRequestException("Transaction category is required");
        }

        if (transaction.getType() == null) {
            throw new BadRequestException("Transaction type is required");
        }
    }
}
