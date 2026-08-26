// backend/src/services/olt/oltDriverBase.js

/**
 * Abstract Base Driver for OLT Hardware Communication (BDCOM, ECOM, Generic, Mock)
 */
class OltDriverBase {
  constructor(olt) {
    this.olt = olt;
  }

  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  async getDeviceInfo() {
    throw new Error('getDeviceInfo() must be implemented by subclass');
  }

  async getPonPorts() {
    throw new Error('getPonPorts() must be implemented by subclass');
  }

  async getRegisteredOnus(portNumber = null) {
    throw new Error('getRegisteredOnus() must be implemented by subclass');
  }

  async getUnregisteredOnus() {
    throw new Error('getUnregisteredOnus() must be implemented by subclass');
  }

  async getOnuOpticalDiagnostics(portNumber, onuId) {
    throw new Error('getOnuOpticalDiagnostics() must be implemented by subclass');
  }

  async authorizeOnu(data) {
    throw new Error('authorizeOnu() must be implemented by subclass');
  }

  async unauthorizeOnu(portNumber, onuId, macOrSn = null) {
    throw new Error('unauthorizeOnu() must be implemented by subclass');
  }

  async rebootOnu(portNumber, onuId) {
    throw new Error('rebootOnu() must be implemented by subclass');
  }

  async toggleOnuPort(portNumber, onuId, disable = false) {
    throw new Error('toggleOnuPort() must be implemented by subclass');
  }

  async executeRawCli(command) {
    throw new Error('executeRawCli() must be implemented by subclass');
  }
}

module.exports = OltDriverBase;

