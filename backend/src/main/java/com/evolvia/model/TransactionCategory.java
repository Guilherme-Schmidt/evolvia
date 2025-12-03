package com.evolvia.model;

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

    public String toPostgresValue() {
        return this.name().toLowerCase();
    }

    public static TransactionCategory fromPostgresValue(String value) {
        return TransactionCategory.valueOf(value.toUpperCase());
    }
}
