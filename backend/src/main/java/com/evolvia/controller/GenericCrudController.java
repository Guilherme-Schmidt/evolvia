package com.evolvia.controller;

import com.evolvia.dto.ApiResponse;
import com.evolvia.service.GenericCrudService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Generic CRUD", description = "Generic CRUD operations for various entities")
public class GenericCrudController {

    private final GenericCrudService genericCrudService;

    @GetMapping("/{table}")
    @Operation(summary = "Get all records from a table")
    public ResponseEntity<ApiResponse<List<?>>> getAll(
            @PathVariable String table,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<?> records = genericCrudService.findAll(table, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    @GetMapping("/{table}/{id}")
    @Operation(summary = "Get a record by ID")
    public ResponseEntity<?> getById(
            @PathVariable String table,
            @PathVariable UUID id
    ) {
        Object record = genericCrudService.findById(table, id);
        return ResponseEntity.ok(record);
    }

    @PostMapping("/{table}")
    @Operation(summary = "Create a new record")
    public ResponseEntity<?> create(
            @PathVariable String table,
            @RequestBody Object entity
    ) {
        Object created = genericCrudService.create(table, entity);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{table}/{id}")
    @Operation(summary = "Update a record")
    public ResponseEntity<?> update(
            @PathVariable String table,
            @PathVariable UUID id,
            @RequestBody Object entity
    ) {
        Object updated = genericCrudService.update(table, id, entity);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{table}/{id}")
    @Operation(summary = "Delete a record")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable String table,
            @PathVariable UUID id
    ) {
        genericCrudService.delete(table, id);
        return ResponseEntity.ok(ApiResponse.success("Record deleted successfully"));
    }
}
