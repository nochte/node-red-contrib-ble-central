const noble = require('noble');
const OPERATION_TIMEOUT = 5000;

const withTimeout = (promise) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      return reject({ msg: 'Operation timed out' });
    }, OPERATION_TIMEOUT);
    promise.then((res) => {
      clearTimeout(timeout);
      return resolve(res);
    }).catch((er) => {
      clearTimeout(timeout);
      return reject(er);
    });
  });
};

const connect = (p) => {
  return withTimeout(new Promise((resolve, reject) => {
    const peripheral = noble._peripherals[p.uuid];
    if (peripheral.state === 'connected') {
      return resolve(peripheral);
    }
    peripheral.connect((er) => {
      if (er) { return reject(er); }
      return resolve(peripheral);
    });
  }));
};

const discoverAllServicesAndCharacteristics = (peripheral) => {
  return withTimeout(new Promise((resolve, reject) => {
    noble._peripherals[peripheral.uuid].discoverAllServicesAndCharacteristics((er, services, characteristics) => {
      if (er) { return reject(er); }
      return resolve({ services, characteristics });
    });
  }));
};

const forceDisconnect = (peripheral) => {
  return withTimeout(new Promise((resolve, reject) => {
    noble._peripherals[peripheral.uuid].disconnect((er) => {
      if (er) {
        console.log('Rejection on disconnect for', peripheral);
      }
    });
    return resolve(peripheral);
  }));
};

const disconnect = (peripheral) => {
  return withTimeout(new Promise((resolve, reject) => {
    noble._peripherals[peripheral.uuid].disconnect((er) => {
      if (er) { return reject(er); }
    });
    return resolve(peripheral.uuid);
  }));
};

const fetchServices = (peripheral, serviceUUIDs = null) => {
  return withTimeout(new Promise((resolve, reject) => {
    peripheral.discoverServices(serviceUUIDs, (er, services) => {
      if (er) { return reject(er); }
      return resolve(services);
    });
  }));
};

const fetchCharacteristics = (service, characteristicUUIDs = null) => {
  return withTimeout(new Promise((resolve, reject) => {
    service.discoverCharacteristics(characteristicUUIDs, (er, characteristics) => {
      if (er) { return reject(er); }
      return resolve(characteristics);
    });
  }));
};

const readCharacteristic = (characteristic) => {
  return withTimeout(new Promise((resolve, reject) => {
    characteristic.read((er, data) => {
      if (er) { return reject(er); }
      return resolve(data);
    });
  }));
};


const writeCharacteristic = (characteristic, value) => {
  return withTimeout(new Promise((resolve, reject) => {
    console.log(' > ', characteristic, value); // this is 100% required, because
                                               // characteristic and value are not fully hydrated until something hits them.
                                               // Heisenberg's fields
    characteristic.write(value, true, (er) => {
      if (er) { return reject(er); }
      return resolve();
    });
  }));
};

module.exports = {
  connect,
  forceDisconnect,
  disconnect,
  discoverAllServicesAndCharacteristics,
  fetchServices,
  fetchCharacteristics,
  readCharacteristic,
  writeCharacteristic
};