console.log('Notification simple test file is being executed');

import { expect } from 'chai';

describe('Notification Service Simple Test', () => {
  it('should run a simple test in the services directory', () => {
    console.log('Simple notification test is running');
    expect(true).to.be.true;
  });
});
