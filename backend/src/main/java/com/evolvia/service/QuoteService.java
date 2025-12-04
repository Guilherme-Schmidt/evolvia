package com.evolvia.service;

import com.evolvia.dto.QuoteResponse;
import com.evolvia.exception.BadRequestException;
import com.evolvia.exception.ServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final RestTemplate restTemplate;
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long RETRY_DELAY_MS = 1000;

    public QuoteService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    public QuoteResponse getQuote(String ticker) {
        if (ticker == null || ticker.trim().isEmpty()) {
            throw new BadRequestException("Ticker cannot be empty");
        }

        // Adiciona .SA para tickers brasileiros se não estiver presente
        String formattedTicker = ticker.trim();
        if (!formattedTicker.contains(".") && !formattedTicker.startsWith("^")) {
            formattedTicker = formattedTicker + ".SA";
        }

        String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + formattedTicker;

        // Retry logic
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                return fetchQuoteFromYahoo(url, ticker);
            } catch (ResourceAccessException e) {
                // Network/timeout errors - retry
                lastException = e;
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new ServiceException("Quote fetch interrupted", ie);
                    }
                }
            } catch (HttpClientErrorException.NotFound e) {
                // 404 - ticker not found, don't retry
                throw new BadRequestException("Ticker not found: " + ticker);
            } catch (HttpClientErrorException e) {
                // Other 4xx errors - don't retry
                throw new BadRequestException("Invalid request for ticker " + ticker + ": " + e.getMessage());
            } catch (Exception e) {
                // Other errors - don't retry
                throw new ServiceException("Failed to fetch quote for ticker: " + ticker + ". " + e.getMessage(), e);
            }
        }

        throw new ServiceException("Failed to fetch quote after " + MAX_RETRY_ATTEMPTS + " attempts for ticker: " + ticker, lastException);
    }

    private QuoteResponse fetchQuoteFromYahoo(String url, String ticker) {
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);

        if (response == null || !response.containsKey("chart")) {
            throw new ServiceException("Invalid response from Yahoo Finance");
        }

        Map<String, Object> chart = (Map<String, Object>) response.get("chart");
        java.util.List<Map<String, Object>> result = (java.util.List<Map<String, Object>>) chart.get("result");

        if (result == null || result.isEmpty()) {
            throw new BadRequestException("No data found for ticker: " + ticker);
        }

        Map<String, Object> data = result.get(0);
        Map<String, Object> meta = (Map<String, Object>) data.get("meta");

        if (meta == null) {
            throw new ServiceException("Invalid data structure from Yahoo Finance");
        }

        Number regularMarketPrice = (Number) meta.get("regularMarketPrice");
        Number previousClose = (Number) meta.get("previousClose");
        String currency = (String) meta.get("currency");

        if (regularMarketPrice == null || previousClose == null) {
            throw new ServiceException("Missing price data for ticker: " + ticker);
        }

        BigDecimal price = BigDecimal.valueOf(regularMarketPrice.doubleValue());
        BigDecimal prevClose = BigDecimal.valueOf(previousClose.doubleValue());
        BigDecimal change = price.subtract(prevClose);
        BigDecimal changePercent = change.divide(prevClose, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        QuoteResponse quoteResponse = new QuoteResponse();
        quoteResponse.setTicker(ticker);
        quoteResponse.setPrice(price);
        quoteResponse.setChange(change);
        quoteResponse.setChangePercent(changePercent);
        quoteResponse.setCurrency(currency);
        quoteResponse.setTimestamp(System.currentTimeMillis());

        return quoteResponse;
    }
}
