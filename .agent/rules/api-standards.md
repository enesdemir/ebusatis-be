# API Development Standards & Best Practices

You are a Senior Backend Engineer responsible for ensuring all API endpoints follow a strict, unified standard.

## 1. Generic Response Wrapper (Envelope Pattern)

All HTTP responses (except files/streams) MUST be wrapped in a standard generic object. 
Never return raw arrays or plain objects directly from controllers.

**Success Response Format:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... } | [ ... ],
  "meta": {
    "requestId": "123e4567-e89b-...",
    "timestamp": "2026-02-05T14:00:00Z"
  }
}
```

**Paginated Response Format:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [ ... ],
  "meta": {
    "requestId": "...",
    "timestamp": "...",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Error Response Format:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR", // System readable code
    "details": ["Email is required", "Password too short"] // Optional details
  },
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

## 2. HTTP Status Codes

| Method | Scenario | Status Code |
| :--- | :--- | :--- |
| `GET` | Resource found | `200 OK` |
| `POST` | Resource created | `201 Created` |
| `POST` | Async process started | `202 Accepted` |
| `PUT/PATCH` | Resource updated | `200 OK` |
| `DELETE` | Resource deleted | `200 OK` (Avoid 204 to return meta/success flag) |
| `ANY` | Validation Error | `400 Bad Request` |
| `ANY` | Auth Missing | `401 Unauthorized` |
| `ANY` | Permission Missing | `403 Forbidden` |
| `ANY` | Resource Not Found | `404 Not Found` |
| `ANY` | Server Error | `500 Internal Server Error` |

## 3. Query Parameters (Filtering, Sorting, Pagination)

Use a consistent structure for query params. Avoid custom logic per controller.

- **Pagination:** `?page=1&limit=20`
- **Sorting:** `?sort=createdAt:desc,name:asc` or `?sort=-createdAt`
- **Filtering:**
  - Exact match: `?filter[status]=ACTIVE`
  - Range: `?filter[price][min]=10&filter[price][max]=100`
  - Search: `?search=keyword`
- **Field Selection:** `?fields=id,name,category`

## 4. DTO Validation Standards

- All Controller inputs (`@Body`, `@Query`, `@Param`) MUST define a DTO class.
- Use `class-validator` decorators.
- Use `ApiProperty` from `@nestjs/swagger` for ALL fields to ensure documentation is auto-generated.

```typescript
// Good DTO Example
export class CreateProductDto {
  @ApiProperty({ example: 'Fabric Roll X', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;
}
```

## 5. Security Headers & Best Practices

- **Rate Limiting:** Every public endpoint must have `ThrottlerGuard`.
- **CORS:** Restrict to specific Tenant domains in production.
- **Helmet:** Enable security headers.

## 6. Implementation Checklist for Agents

When implementing a new module, YOU MUST:
1. Create `dto/create-x.dto.ts` and `dto/update-x.dto.ts`.
2. Use `ResponseInterceptor` (Global) - Do not manually wrap responses in Controllers.
3. Use `HttpExceptionFilter` (Global) - Do not manually catch errors in Controllers, throw standard NestJS exceptions.
4. Add Swagger decorators (`@ApiOperation`, `@ApiResponse`) to common Controller methods.
