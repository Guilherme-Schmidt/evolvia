package com.evolvia.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TransactionType {
    INCOME,
    EXPENSE;

    @JsonValue
    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    @JsonCreator
    public static TransactionType fromPostgresValue(String value) {
        return TransactionType.valueOf(value.toUpperCase());
    }
}
