const noble = require('noble');

let callback = (message) => {
  return Promise.resolve(message);
};
let errorCallback = (error) => {
  return Promise.resolve(error);
};

let _initialized = false;


const socketErrorHandler = (error) => {
  ////// WAT ? when a device attempts to reconnect, this is what is thrown
  //Got a warning with noble unknown peripheral f5271fa980e9 connected!
  // f527... is the peripheral id
  if(_initialized){ noble.startScanning([], true); } // fixes when a device comes back online after going to sleep
  console.log("Got a warning with noble", error);
};

const init = () => {
  _initialized = true;

  const messageReceived = (message) => {
    callback(message).catch(errorCallback);
  };
  let latestMessageCallback = (peripheral) => {
    // peripheral should be parsed out to deviceId, rssi, advertisement, and peripheral
    return messageReceived({
      rssi: peripheral.rssi,
      deviceId: peripheral.address.toUpperCase(),
      advertisement: peripheral.advertisement,
      peripheral: peripheral
    });
  };

  noble.addListener('discover', latestMessageCallback);
  noble.addListener('warning', socketErrorHandler);
};

const startScanning = (c, ec) => {
  if(!_initialized){ init(); } // ensures that only one set of callbacks is registered with noble
  callback = c;
  errorCallback = ec;

  if(noble.state !== 'poweredOn'){
    noble.on('stateChange', (state) => {
      if(state === 'poweredOn'){
        noble.startScanning([], true);
      }
    })
  } else {
    noble.startScanning([], true);
  }
};

const stopScanning = () => {
  noble.stopScanning();
};

module.exports = {
  startScanning,
  stopScanning
};