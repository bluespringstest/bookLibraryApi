console.log('Minimal test file is being executed');

describe('Minimal Test Suite', () => {
  it('should pass a simple test', () => {
    console.log('Running minimal test');
    if (1 === 1) {
      console.log('Test passed');
    } else {
      throw new Error('Test failed');
    }
  });
});
