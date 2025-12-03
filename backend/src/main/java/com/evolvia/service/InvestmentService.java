package com.evolvia.service;

import com.evolvia.model.Investment;
import com.evolvia.model.InvestmentTransaction;
import com.evolvia.model.User;
import com.evolvia.repository.InvestmentRepository;
import com.evolvia.repository.InvestmentTransactionRepository;
import com.evolvia.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final InvestmentTransactionRepository investmentTransactionRepository;
    private final UserRepository userRepository;

    public List<Investment> getAllInvestments(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return investmentRepository.findByUserId(user.getId());
    }

    @Transactional
    public Investment createInvestment(String email, Investment investment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        investment.setUser(user);
        return investmentRepository.save(investment);
    }

    @Transactional
    public Investment updateInvestment(String email, UUID id, Investment investment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Investment existing = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        existing.setTicker(investment.getTicker());
        existing.setType(investment.getType());
        existing.setQuantity(investment.getQuantity());
        existing.setAveragePrice(investment.getAveragePrice());
        existing.setTargetQuantity(investment.getTargetQuantity());
        existing.setTotalValue(investment.getTotalValue());

        return investmentRepository.save(existing);
    }

    @Transactional
    public Investment updateInvestmentByTicker(String email, String ticker, Investment investment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Investment existing = investmentRepository.findByUserIdAndTicker(user.getId(), ticker)
                .orElseThrow(() -> new RuntimeException("Investment not found"));

        existing.setQuantity(investment.getQuantity());
        existing.setAveragePrice(investment.getAveragePrice());
        existing.setTargetQuantity(investment.getTargetQuantity());
        existing.setTotalValue(investment.getTotalValue());

        return investmentRepository.save(existing);
    }

    @Transactional
    public void deleteInvestment(String email, UUID id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));

        if (!investment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        investmentRepository.delete(investment);
    }

    public List<InvestmentTransaction> getAllInvestmentTransactions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return investmentTransactionRepository.findByUserId(user.getId());
    }

    @Transactional
    public InvestmentTransaction createInvestmentTransaction(String email, InvestmentTransaction transaction) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verificar se o investment pertence ao usuário
        Investment investment = transaction.getInvestment();
        if (investment != null && !investment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        return investmentTransactionRepository.save(transaction);
    }
}
