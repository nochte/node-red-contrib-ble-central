const PeripheralService = require('./peripheralService');

let operations = [];
let currentOperation = null;
let workInterval;
const start = () => {
  workInterval = setInterval(() => {
    if(currentOperation) {
      status(null, 'Busy');
      return;
    } // busy
    currentOperation = operations.shift();
    handleMessage(currentOperation);
  }, 1000);
};

const handleMessage = (msg) => {
  if(!msg) {
    status(null, 'NO MESSAGE');
    return;
  } //no-op
  const { peripheral, operations, callback } = msg;
  status(peripheral, 'connecting');
  PeripheralService.connect(peripheral).then((p) => {
    status(p, 'connected');
    let toReturn = [];
    let promise = Promise.resolve();
    // even though operations are promises, the strategy
    // operations.map...Promise.all(...) will result in timeouts.
    // this is because operations cannot happen in parallel --
    // noble will get confused
    operations.forEach((operation) => {
      promise = promise.then(() => {
        return perform(p, operation).then((result) => {
          toReturn.push(result);
        });
      });
    });

    promise.then(() => {
      msg.results = toReturn;
      callback(null, toReturn);
      // node.send(msg);
      return PeripheralService.disconnect(p).then(done);
    }).catch((er) => {
      callback(er, null);
      // msg.er = er;
      // msg.results = null;
      // node.send(msg);
      return PeripheralService.disconnect(peripheral).then(done);
    });

  }).catch((er) => {
    callback(er, null);
    PeripheralService.forceDisconnect(peripheral);
    done();
  });
};

const perform = (peripheral, { operation, service, characteristic, value, meta }) => {
  return new Promise((resolve, reject) => {
    switch (operation) {
      case 'READ':
        status(peripheral, 'Fetching Services');
        return PeripheralService.fetchServices(peripheral, [service]).then(([s]) => {
          status(peripheral, 'Fetching Characteristics on ' + service);
          return PeripheralService.fetchCharacteristics(s, [characteristic]).then(([c]) => {
            status(peripheral, 'Reading Characteristic: ' + characteristic);
            return PeripheralService.readCharacteristic(c);
          });
        }).then((valueBuffer) => {
          return resolve({ operation, service, characteristic, value: valueBuffer, meta });
          // return resolve({ peripheral, operation, service, characteristic, value: valueBuffer });
        }).catch((err) => {
          return resolve({ operation, service, characteristic, value: null, error: err, meta });
          // return resolve({ peripheral, operation, service, characteristic, value: null, error: err });
        });
        break;
      case 'WRITE':
        status(peripheral, 'Fetching Services');
        return PeripheralService.fetchServices(peripheral, [service]).then(([s]) => {
          status(peripheral, 'Fetching characteristics on ' + service);
          return PeripheralService.fetchCharacteristics(s, [characteristic]).then(([c]) => {
            status(peripheral, 'Setting characteristic: ' + characteristic);
            return PeripheralService.writeCharacteristic(c, value);
          });
        }).then((valueBuffer) => {
          return resolve({ operation, service, characteristic, value: valueBuffer, meta });
        }).catch((err) => {
          return resolve({ operation, service, characteristic, value: null, error: err, meta });
        });
        break;
    }
  });
};


var _statusCallback = null;
const status = (peripheral, txt) => {
  if(_statusCallback){
    _statusCallback(peripheral, txt);
  }
};

const onStatus = (callback) => {
  _statusCallback = callback;
};

const push = (operation) => {
  operations.push(operation);
};

const stop = () => {
  clearInterval(workInterval);
};

var _workCompleteCallback;
const onAllWorkComplete = (callback) => {
  _workCompleteCallback = callback;
};

const done = () => {
  currentOperation = null;
  if(_workCompleteCallback && operations.length === 0){
    _workCompleteCallback();
  }
};

module.exports = {
  currentOperation,
  onStatus,
  onAllWorkComplete,
  push,
  stop,
  start
};