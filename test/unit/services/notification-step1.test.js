console.log('Step 1: Basic test file is being executed');

import { expect } from 'chai';

describe('Notification Service Step 1', () => {
  it('should run a basic test', () => {
    console.log('Step 1 test is running');
    expect(true).to.be.true;
  });
});
