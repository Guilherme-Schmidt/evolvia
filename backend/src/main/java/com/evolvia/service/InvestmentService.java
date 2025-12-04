package com.evolvia.service;

import com.evolvia.exception.BadRequestException;
import com.evolvia.exception.ResourceNotFoundException;
import com.evolvia.model.Investment;
import com.evolvia.model.InvestmentTransaction;
import com.evolvia.model.User;
import com.evolvia.repository.InvestmentRepository;
import com.evolvia.repository.InvestmentTransactionRepository;
import com.evolvia.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return investmentRepository.findByUserId(user.getId());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Investment createInvestment(String email, Investment investment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        validateInvestment(investment);

        investment.setUser(user);
        return investmentRepository.save(investment);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public Investment updateInvestment(String email, UUID id, Investment investment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Investment existing = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", "id", id));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to update this investment");
        }

        validateInvestmentUpdate(investment);

        existing.setTicker(investment.getTicker());
        existing.setType(investment.getType());
        existing.setQuantity(investment.getQuantity());
        existing.setAveragePrice(investment.getAveragePrice());
        existing.setTargetQuantity(investment.getTargetQuantity());
        existing.setTotalValue(investment.getTotalValue());

        return investmentRepository.save(existing);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public Investment updateInvestmentByTicker(String email, String ticker, Investment investment) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (ticker == null || ticker.trim().isEmpty()) {
            throw new BadRequestException("Ticker cannot be empty");
        }

        Investment existing = investmentRepository.findByUserIdAndTicker(user.getId(), ticker)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", "ticker", ticker));

        validateInvestmentUpdate(investment);

        existing.setQuantity(investment.getQuantity());
        existing.setAveragePrice(investment.getAveragePrice());
        existing.setTargetQuantity(investment.getTargetQuantity());
        existing.setTotalValue(investment.getTotalValue());

        return investmentRepository.save(existing);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void deleteInvestment(String email, UUID id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", "id", id));

        if (!investment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this investment");
        }

        investmentRepository.delete(investment);
    }

    public List<InvestmentTransaction> getAllInvestmentTransactions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return investmentTransactionRepository.findByUserId(user.getId());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public InvestmentTransaction createInvestmentTransaction(String email, InvestmentTransaction transaction) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        validateInvestmentTransaction(transaction);

        // Verificar se o investment pertence ao usuário
        Investment investment = transaction.getInvestment();
        if (investment != null && investment.getUser() != null
                && !investment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You don't have permission to create transactions for this investment");
        }

        return investmentTransactionRepository.save(transaction);
    }

    private void validateInvestment(Investment investment) {
        if (investment == null) {
            throw new BadRequestException("Investment cannot be null");
        }

        if (investment.getTicker() == null || investment.getTicker().trim().isEmpty()) {
            throw new BadRequestException("Investment ticker is required");
        }

        if (investment.getType() == null) {
            throw new BadRequestException("Investment type is required");
        }

        if (investment.getQuantity() != null && investment.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Investment quantity cannot be negative");
        }

        if (investment.getAveragePrice() != null && investment.getAveragePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Investment average price cannot be negative");
        }
    }

    private void validateInvestmentUpdate(Investment investment) {
        if (investment == null) {
            throw new BadRequestException("Investment cannot be null");
        }

        if (investment.getQuantity() != null && investment.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Investment quantity cannot be negative");
        }

        if (investment.getAveragePrice() != null && investment.getAveragePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Investment average price cannot be negative");
        }
    }

    private void validateInvestmentTransaction(InvestmentTransaction transaction) {
        if (transaction == null) {
            throw new BadRequestException("Investment transaction cannot be null");
        }

        if (transaction.getQuantity() == null) {
            throw new BadRequestException("Transaction quantity is required");
        }

        if (transaction.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transaction quantity must be greater than zero");
        }

        if (transaction.getPrice() == null) {
            throw new BadRequestException("Transaction price is required");
        }

        if (transaction.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transaction price must be greater than zero");
        }

        if (transaction.getDate() == null) {
            throw new BadRequestException("Transaction date is required");
        }

        if (transaction.getType() == null) {
            throw new BadRequestException("Transaction type is required");
        }
    }
}
