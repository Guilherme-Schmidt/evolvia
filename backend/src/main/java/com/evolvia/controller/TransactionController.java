package com.evolvia.controller;

import com.evolvia.dto.ApiResponse;
import com.evolvia.model.Transaction;
import com.evolvia.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Transaction management endpoints")
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    @Operation(summary = "Get all transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getAllTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String type
    ) {
        List<Transaction> transactions = transactionService.getAllTransactions(
                userDetails.getUsername(), startDate, endDate, type);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @PostMapping
    @Operation(summary = "Create new transaction(s)")
    public ResponseEntity<ApiResponse<List<Transaction>>> createTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Object transactionData
    ) {
        List<Transaction> created = transactionService.createTransactions(
                userDetails.getUsername(), transactionData);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<ApiResponse<String>> deleteTransaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id
    ) {
        transactionService.deleteTransaction(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Transaction deleted successfully"));
    }
}
