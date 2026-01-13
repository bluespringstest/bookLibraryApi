# PostgreSQL Migration Fix Plan

## Issues Identified

1. **Environment Variables**: POSTGRES_* variables undefined in .test.env
2. **Backward Compatibility**: No fallback to old DB_* variables
3. **Database Script Errors**: 
   - Line 37 in create-database.js: Still references `DB_NAME` instead of `POSTGRES_DB`
   - PostgreSQL CREATE DATABASE syntax needs adjustment
4. **No Connection Validation**: No graceful handling when PostgreSQL is not available

## Solutions

### 1. Update Environment Variable Handling
- **Goal**: Support both POSTGRES_* and DB_* variables for backward compatibility
- **Implementation**: Create a configuration utility that checks for both sets of variables
- **Priority**: High

### 2. Fix Database Creation Script
- **Goal**: Fix syntax errors and improve PostgreSQL compatibility
- **Implementation**:
  - Fix line 37: Change `DB_NAME` to `POSTGRES_DB`
  - Update PostgreSQL CREATE DATABASE syntax to be more robust
  - Add better error handling
- **Priority**: High

### 3. Add Configuration Validator
- **Goal**: Validate that required environment variables are set
- **Implementation**: Create a simple validator that checks for database configuration
- **Priority**: Medium

### 4. Update Test to be More Robust
- **Goal**: Make test skip if PostgreSQL is not configured/running
- **Implementation**: Add conditional test skipping with clear messages
- **Priority**: Medium

## Detailed Implementation Plan

### Step 1: Create Configuration Utility
```javascript
// src/config/database.js
const getDatabaseConfig = () => {
  // Try POSTGRES_* first, fall back to DB_*
  const config = {
    host: process.env.POSTGRES_SERVER || process.env.DB_HOST,
    port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
    database: process.env.POSTGRES_DB || process.env.DB_NAME,
    user: process.env.POSTGRES_USER || process.env.DB_USER,
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
    ssl: (process.env.POSTGRES_SSL || 'false') === 'true'
  };
  
  // Validate required fields
  const required = ['host', 'database', 'user', 'password'];
  const missing = required.filter(field => !config[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing database configuration: ${missing.join(', ')}`);
  }
  
  return config;
};
```

### Step 2: Update All Database Files
- **db.js**: Use the configuration utility
- **create-database.js**: Fix syntax errors, use configuration utility
- **drop-database.js**: Use configuration utility
- **models/index.js**: Use configuration utility

### Step 3: Update Test
- Add conditional skipping based on database availability
- Provide clear error messages
- Test both connection and basic queries

### Step 4: Run Validation
- Run the fixed test to verify changes
- Ensure backward compatibility works

## Success Criteria
1. Test runs without environment variable errors
2. Backward compatibility maintained (DB_* variables still work)
3. Database scripts execute correctly
4. Clear error messages when configuration is missing