package com.evolvia.converter;

import com.evolvia.model.InvestmentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InvestmentTypeConverter implements AttributeConverter<InvestmentType, String> {

    @Override
    public String convertToDatabaseColumn(InvestmentType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.toPostgresValue();
    }

    @Override
    public InvestmentType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        return InvestmentType.fromPostgresValue(dbData);
    }
}
