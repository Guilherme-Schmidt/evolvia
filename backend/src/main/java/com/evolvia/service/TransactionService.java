package com.evolvia.service;

import com.evolvia.model.Transaction;
import com.evolvia.model.User;
import com.evolvia.repository.TransactionRepository;
import com.evolvia.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (startDate != null && endDate != null) {
            return transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), startDate, endDate);
        }

        return transactionRepository.findByUserIdOrderByDateDesc(user.getId());
    }

    @Transactional
    public Transaction createTransaction(String email, Transaction transaction) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        transaction.setUser(user);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public List<Transaction> createTransactions(String email, Object transactionData) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Transaction> transactions = new ArrayList<>();

        // Verifica se é um array ou objeto único
        if (transactionData instanceof List<?>) {
            // É um array de transações
            List<?> dataList = (List<?>) transactionData;
            for (Object item : dataList) {
                Transaction transaction = objectMapper.convertValue(item, Transaction.class);
                transaction.setUser(user);
                transactions.add(transaction);
            }
        } else {
            // É uma única transação
            Transaction transaction = objectMapper.convertValue(transactionData, Transaction.class);
            transaction.setUser(user);
            transactions.add(transaction);
        }

        return transactionRepository.saveAll(transactions);
    }

    @Transactional
    public void deleteTransaction(String email, UUID id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        transactionRepository.delete(transaction);
    }
}
