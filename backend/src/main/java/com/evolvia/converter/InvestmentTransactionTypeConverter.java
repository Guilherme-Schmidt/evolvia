package com.evolvia.converter;

import com.evolvia.model.InvestmentTransactionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InvestmentTransactionTypeConverter implements AttributeConverter<InvestmentTransactionType, String> {

    @Override
    public String convertToDatabaseColumn(InvestmentTransactionType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.toPostgresValue();
    }

    @Override
    public InvestmentTransactionType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        return InvestmentTransactionType.fromPostgresValue(dbData);
    }
}
