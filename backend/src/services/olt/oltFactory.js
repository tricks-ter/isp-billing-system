// backend/src/services/olt/oltFactory.js
const MockOltDriver = require('./mockOltDriver');
const BdcomDriver = require('./bdcomDriver');
const EcomDriver = require('./ecomDriver');

class OltFactory {
  static getDriver(olt) {
    const isMock = olt.isMock || process.env.OLT_MOCK_MODE === 'true';

    if (isMock) {
      return new MockOltDriver(olt);
    }

    switch (olt.brand) {
      case 'BDCOM':
        return new BdcomDriver(olt);
      case 'ECOM':
        return new EcomDriver(olt);
      case 'VSOL':
      case 'HUAWEI':
      case 'GENERIC':
      default:
        return new BdcomDriver(olt);
    }
  }
}

module.exports = OltFactory;

