package com.evolvia.controller;

import com.evolvia.dto.ApiResponse;
import com.evolvia.model.Investment;
import com.evolvia.model.InvestmentTransaction;
import com.evolvia.service.InvestmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
@Tag(name = "Investments", description = "Investment management endpoints")
public class InvestmentController {

    private final InvestmentService investmentService;

    @GetMapping
    @Operation(summary = "Get all investments")
    public ResponseEntity<ApiResponse<List<Investment>>> getAllInvestments(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<Investment> investments = investmentService.getAllInvestments(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(investments));
    }

    @PostMapping
    @Operation(summary = "Create a new investment")
    public ResponseEntity<Investment> createInvestment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Investment investment
    ) {
        Investment created = investmentService.createInvestment(userDetails.getUsername(), investment);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an investment")
    public ResponseEntity<Investment> updateInvestment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Investment investment
    ) {
        Investment updated = investmentService.updateInvestment(userDetails.getUsername(), id, investment);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/ticker/{ticker}")
    @Operation(summary = "Update investment by ticker")
    public ResponseEntity<Investment> updateInvestmentByTicker(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String ticker,
            @RequestBody Investment investment
    ) {
        Investment updated = investmentService.updateInvestmentByTicker(userDetails.getUsername(), ticker, investment);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an investment")
    public ResponseEntity<ApiResponse<String>> deleteInvestment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        investmentService.deleteInvestment(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Investment deleted successfully"));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get all investment transactions")
    public ResponseEntity<ApiResponse<List<InvestmentTransaction>>> getAllInvestmentTransactions(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<InvestmentTransaction> transactions = investmentService.getAllInvestmentTransactions(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @PostMapping("/transactions")
    @Operation(summary = "Create a new investment transaction")
    public ResponseEntity<InvestmentTransaction> createInvestmentTransaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody InvestmentTransaction transaction
    ) {
        InvestmentTransaction created = investmentService.createInvestmentTransaction(userDetails.getUsername(), transaction);
        return ResponseEntity.ok(created);
    }
}
