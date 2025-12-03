package com.evolvia.controller;

import com.evolvia.dto.QuoteRequest;
import com.evolvia.dto.QuoteResponse;
import com.evolvia.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/functions")
@RequiredArgsConstructor
@Tag(name = "Functions", description = "External API functions")
public class FunctionController {

    private final QuoteService quoteService;

    @PostMapping("/get-quote")
    @Operation(summary = "Get stock quote from Yahoo Finance")
    public ResponseEntity<QuoteResponse> getQuote(@Valid @RequestBody QuoteRequest request) {
        QuoteResponse response = quoteService.getQuote(request.getTicker());
        return ResponseEntity.ok(response);
    }
}
