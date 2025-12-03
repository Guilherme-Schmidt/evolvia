package com.evolvia.model;

public enum TransactionType {
    INCOME,
    EXPENSE;

    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    public static TransactionType fromPostgresValue(String value) {
        return TransactionType.valueOf(value.toUpperCase());
    }
}
