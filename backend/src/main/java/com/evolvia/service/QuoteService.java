package com.evolvia.service;

import com.evolvia.dto.QuoteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final RestTemplate restTemplate = new RestTemplate();

    public QuoteResponse getQuote(String ticker) {
        try {
            // Adiciona .SA para tickers brasileiros se não estiver presente
            String formattedTicker = ticker;
            if (!ticker.contains(".") && !ticker.startsWith("^")) {
                formattedTicker = ticker + ".SA";
            }

            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + formattedTicker;

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || !response.containsKey("chart")) {
                throw new RuntimeException("Invalid response from Yahoo Finance");
            }

            Map<String, Object> chart = (Map<String, Object>) response.get("chart");
            java.util.List<Map<String, Object>> result = (java.util.List<Map<String, Object>>) chart.get("result");

            if (result == null || result.isEmpty()) {
                throw new RuntimeException("No data found for ticker: " + ticker);
            }

            Map<String, Object> data = result.get(0);
            Map<String, Object> meta = (Map<String, Object>) data.get("meta");

            Number regularMarketPrice = (Number) meta.get("regularMarketPrice");
            Number previousClose = (Number) meta.get("previousClose");
            String currency = (String) meta.get("currency");

            BigDecimal price = BigDecimal.valueOf(regularMarketPrice.doubleValue());
            BigDecimal prevClose = BigDecimal.valueOf(previousClose.doubleValue());
            BigDecimal change = price.subtract(prevClose);
            BigDecimal changePercent = change.divide(prevClose, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            QuoteResponse quoteResponse = new QuoteResponse();
            quoteResponse.setTicker(ticker);
            quoteResponse.setPrice(price);
            quoteResponse.setChange(change);
            quoteResponse.setChangePercent(changePercent);
            quoteResponse.setCurrency(currency);
            quoteResponse.setTimestamp(System.currentTimeMillis());

            return quoteResponse;

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch quote for ticker: " + ticker + ". " + e.getMessage());
        }
    }
}
