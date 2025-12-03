package com.evolvia.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private T data;
    private String error;
    private Integer count;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, null, null);
    }

    public static <T> ApiResponse<T> error(String error) {
        return new ApiResponse<>(null, error, null);
    }
}
