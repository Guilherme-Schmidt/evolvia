package com.evolvia.converter;

import com.evolvia.model.TransactionCategory;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TransactionCategoryConverter implements AttributeConverter<TransactionCategory, String> {

    @Override
    public String convertToDatabaseColumn(TransactionCategory attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.toPostgresValue();
    }

    @Override
    public TransactionCategory convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        return TransactionCategory.fromPostgresValue(dbData);
    }
}
