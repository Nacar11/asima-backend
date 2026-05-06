# Cost Centers HTTP API Examples

This directory contains HTTP YAC (Yet Another Client) examples for the Cost Centers module, organized by HTTP method.

## 📁 File Structure

```
src/cost-centers/http/
├── README.md                    # This file
├── get-cost-centers.http        # GET endpoints (Read operations)
├── post-cost-centers.http       # POST endpoints (Create operations)
├── patch-cost-centers.http      # PATCH endpoints (Update operations)
└── delete-cost-centers.http     # DELETE endpoints (Soft delete operations)
```

## 🔐 Authentication

All endpoints require JWT authentication. Each file includes:

```http
### Get Auth Token
# @name login
POST {{BACKEND_DOMAIN}}/api/v1/auth/email/login
Content-Type: application/json

{
  "email": "{{TEST_EMAIL}}",
  "password": "{{TEST_PASSWORD}}"
}

### Set token variable from login response
@token = {{login.token}}
```

## 📋 Available Endpoints

### GET Endpoints (`get-cost-centers.http`)
- **DevExtreme Pagination**: Primary pagination with filters, search, and sorting
- **V2 Pagination**: Alternative pagination with search and status filters
- **Simple List**: Get all cost centers without pagination
- **Lookup**: For dropdown/selection purposes
- **Get by ID**: Retrieve specific cost center with complete related data
- **Advanced Queries**: Complex filtering, sorting, and search combinations

### POST Endpoints (`post-cost-centers.http`)
- **Minimal Creation**: Division only
- **Hierarchical Creation**: With department, section, sub-section
- **Status Variations**: Active, Hold, Cancelled
- **Real-world Examples**: Backend, Frontend, DevOps, QA, Marketing, Sales, HR, Finance, Operations, Customer Support, R&D, Legal teams

### PATCH Endpoints (`patch-cost-centers.http`)
- **Partial Updates**: Update specific fields only
- **Status Changes**: Change between Active, Hold, Cancelled
- **Hierarchy Updates**: Update organizational structure
- **Combined Updates**: Update multiple fields at once
- **Real-world Scenarios**: Team transfers, status changes, reactivation

### DELETE Endpoints (`delete-cost-centers.http`)
- **Soft Delete**: Mark cost centers as deleted (not permanently removed)
- **Multiple Examples**: Various ID examples for testing

## 🚀 Usage

1. **Set Environment Variables**:
   - `{{BACKEND_DOMAIN}}`: Your backend API domain (e.g., `http://localhost:8000`)
   - `{{TEST_EMAIL}}`: Test user email
   - `{{TEST_PASSWORD}}`: Test user password

2. **Run Authentication**: Execute the login request in any file to get the JWT token

3. **Test Endpoints**: Use the organized files to test specific operations

## 📊 Cost Center Structure

Cost centers follow a hierarchical organizational structure:

```
Division (00-99)
└── Department (00-99)
    └── Section (00-99)
        └── Sub-Section (00-99)
```

**Generated Cost Center Code**: `{division}{department}{section}{sub_section}`

**Example**: Division=01, Department=01, Section=01, Sub-Section=01 → Code: `01010101`

## 🏷️ Status Values

- **Active**: Currently in use
- **Hold**: Temporarily suspended
- **Cancelled**: Permanently discontinued

## 🔍 Advanced Features

### Filtering
- By status (Active, Hold, Cancelled)
- By organizational hierarchy (division, department, section, sub-section)
- By date ranges
- Complex multi-condition filters

### Searching
- By cost center code
- By division, department, section, sub-section
- By remarks/description

### Sorting
- By cost center code (ASC/DESC)
- By creation date (ASC/DESC)
- By organizational hierarchy
- Multiple sort criteria

### Pagination
- DevExtreme pagination (primary)
- V2 pagination (alternative)
- Configurable page size and limits

## 📝 Notes

- All DELETE operations are **soft deletes** (records are marked as deleted, not permanently removed)
- Cost center codes are **automatically generated** based on organizational hierarchy
- All endpoints require **JWT authentication**
- Related entities (division, department, section, sub-section, user audit info) are included in responses
- The API supports both simple and complex query operations

## 🛠️ Development

These HTTP examples are designed for:
- **API Testing**: Comprehensive testing of all endpoints
- **Documentation**: Clear examples for developers
- **Integration**: Easy integration with HTTP clients
- **Debugging**: Troubleshooting API issues

---

**Author**: Cody Inc Development Team  
**Version**: 1.0.0  
**Last Updated**: 2025
