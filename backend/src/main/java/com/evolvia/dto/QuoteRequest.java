package com.evolvia.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuoteRequest {
    @NotBlank(message = "Ticker is required")
    private String ticker;
}
