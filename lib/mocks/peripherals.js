const connect = (p) => {
  return Promise.resolve(p);
};

const discoverAllServicesAndCharacteristics = (peripheral) => {
  return Promise.resolve({services: [], characteristics: []});
};

const forceDisconnect = (peripheral) => {
  return Promise.resolve(peripheral);
};

const disconnect = (peripheral) => {
  return resolve(peripheral.uuid);
};

module.exports = {
  connect,
  forceDisconnect,
  disconnect,
  discoverAllServicesAndCharacteristics
};