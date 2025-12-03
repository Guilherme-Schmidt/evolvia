package com.evolvia.model;

public enum InvestmentTransactionType {
    BUY,
    SELL;

    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    public static InvestmentTransactionType fromPostgresValue(String value) {
        return InvestmentTransactionType.valueOf(value.toUpperCase());
    }
}
