package com.evolvia.model;

public enum InvestmentType {
    STOCK,
    FII,
    ETF,
    BDR,
    TREASURY,
    CRYPTO,
    FIXED_INCOME,
    OTHER;

    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    public static InvestmentType fromPostgresValue(String value) {
        return InvestmentType.valueOf(value.toUpperCase());
    }
}
