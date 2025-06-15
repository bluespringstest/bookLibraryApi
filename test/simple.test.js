import { expect } from 'chai';

describe('Simple Test', () => {
  it('should pass a simple test', () => {
    expect(true).to.be.true;
  });

  it('should fail a simple test', () => {
    expect(false).to.be.true;
  });
});
