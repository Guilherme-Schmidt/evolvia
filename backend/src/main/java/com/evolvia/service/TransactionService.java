package com.evolvia.service;

import com.evolvia.model.Transaction;
import com.evolvia.model.User;
import com.evolvia.repository.TransactionRepository;
import com.evolvia.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

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
