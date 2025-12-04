package com.evolvia.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false, columnDefinition = "investment_type")
    private InvestmentType type;

    @Column(nullable = false, precision = 18, scale = 8)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "average_price", nullable = false, precision = 18, scale = 8)
    private BigDecimal averagePrice = BigDecimal.ZERO;

    @Column(name = "target_quantity", nullable = false, precision = 18, scale = 8)
    private BigDecimal targetQuantity = BigDecimal.ZERO;

    @Column(name = "total_value", precision = 18, scale = 2)
    private BigDecimal totalValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_account_id")
    private BrokerAccount brokerAccount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
