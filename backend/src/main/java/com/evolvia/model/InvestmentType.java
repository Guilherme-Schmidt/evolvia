package com.evolvia.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InvestmentType {
    STOCK,
    FII,
    ETF,
    BDR,
    TREASURY,
    CRYPTO,
    FIXED_INCOME,
    OTHER;

    @JsonValue
    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    @JsonCreator
    public static InvestmentType fromPostgresValue(String value) {
        return InvestmentType.valueOf(value.toUpperCase());
    }
}
