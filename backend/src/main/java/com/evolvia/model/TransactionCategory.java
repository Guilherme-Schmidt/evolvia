package com.evolvia.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TransactionCategory {
    SALARY,
    FREELANCE,
    INVESTMENT,
    OTHER_INCOME,
    FOOD,
    TRANSPORT,
    HOUSING,
    ENTERTAINMENT,
    HEALTH,
    EDUCATION,
    SHOPPING,
    CREDIT_CARD,
    MEAL_VOUCHER,
    UTILITIES,
    INSURANCE,
    SUBSCRIPTION,
    PERSONAL_CARE,
    GIFTS,
    TRAVEL,
    CLOTHING,
    HOME_MAINTENANCE,
    OTHER_EXPENSE;

    @JsonValue
    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    @JsonCreator
    public static TransactionCategory fromPostgresValue(String value) {
        if (value == null) {
            return null;
        }
        return TransactionCategory.valueOf(value.toUpperCase());
    }
}
