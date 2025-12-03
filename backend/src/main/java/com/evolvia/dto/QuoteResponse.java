package com.evolvia.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuoteResponse {
    private String ticker;
    private BigDecimal price;
    private BigDecimal change;
    private BigDecimal changePercent;
    private String currency;
    private Long timestamp;
}
