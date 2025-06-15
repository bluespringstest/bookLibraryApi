// Test user fixtures
export const userOne = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'user',
  isEmailVerified: true,
  active: true,
};

// Setup database for tests
export const setupDatabase = async () => {
  // Clear all test data
  await Promise.all([
    // Add any model cleanup needed here
  ]);

  // Create test users
  // Note: In a real test environment, you would use your models to create these
  // For example: await User.create(userOne);
};

// Teardown database after tests
export const teardownDatabase = async () => {
  // Clean up any test data
};
