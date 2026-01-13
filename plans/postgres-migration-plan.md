# PostgreSQL Migration Plan

## Objective
Change the database configuration from MySQL to PostgreSQL while maintaining all existing functionality.

## Current Analysis
- **Current DB**: MySQL (mysql2 package)
- **Sequelize Dialect**: 'mysql'
- **Database Port**: 3306 (MySQL default)
- **Files requiring updates**: 6 files identified

## Required Changes

### 1. Package Dependencies
**Current**: `mysql2` in dependencies
**New**: Replace with `pg` (PostgreSQL client)
**Optional**: Add `pg-hstore` for Sequelize if needed

### 2. File Updates

#### a) `src/services/db.js`
- Replace `mysql` import with `pg`/`pg-promise`
- Update connection configuration syntax

#### b) `scripts/create-database.js`
- Replace `mysql` import with `pg`
- Update database creation syntax (PostgreSQL uses `CREATE DATABASE` with different options)
- Update connection configuration

#### c) `scripts/drop-database.js`
- Replace `mysql` import with `pg`
- Update database drop syntax

#### d) `src/models/index.js`
- Change dialect from 'mysql' to 'postgres'
- Verify Sequelize configuration compatibility

#### e) Environment Configuration
- Update default port from 3306 to 5432 (PostgreSQL default)
- Consider any PostgreSQL-specific connection options

### 3. Testing Strategy
- Create PostgreSQL connection test
- Run existing test suite to verify compatibility
- Ensure database creation/drop scripts work correctly

## PostgreSQL Specific Considerations
1. **Database Creation**: PostgreSQL requires different privileges
2. **Connection Syntax**: `pg` uses different connection object structure
3. **Port**: Default PostgreSQL port is 5432
4. **Sequelize**: May need `pg-hstore` for JSON handling

## Implementation Order
1. Update package.json dependencies
2. Update database connection files
3. Update database management scripts
4. Update Sequelize configuration
5. Update environment defaults
6. Create verification test
7. Run test suite

## Risk Mitigation
- Backup current configuration
- Test in isolated environment first
- Verify all existing tests pass
- Ensure database migration scripts handle data if present

## Success Criteria
- All existing tests pass with PostgreSQL
- Database creation/drop scripts work correctly
- Application connects to PostgreSQL successfully
- No breaking changes to API functionality