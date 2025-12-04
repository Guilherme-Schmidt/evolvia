package com.evolvia.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InvestmentTransactionType {
    BUY,
    SELL;

    @JsonValue
    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    @JsonCreator
    public static InvestmentTransactionType fromPostgresValue(String value) {
        return InvestmentTransactionType.valueOf(value.toUpperCase());
    }
}
