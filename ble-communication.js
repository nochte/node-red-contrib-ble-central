const PeripheralService = require('./lib/peripheralService');

module.exports = function (RED) {
  function BLECommunication(config) {
    RED.nodes.createNode(this, config);
    let node = this;

    let operations = [];
    let currentOperation = null;
    let workInterval = setInterval(() => {
      if (currentOperation) { return; } // busy
      currentOperation = operations.shift();
      handleMessage(currentOperation);
    }, 1000);

    function done() {
      node.status({ fill: 'green', shape: 'dot', text: 'Ready' });
      if (currentOperation && operations.length === 0) {
        node.send([null, { payload: true }]);
      }
      currentOperation = null;
    }
    done();

    function working(peripheral) {
      node.status({ fill: 'yellow', shape: 'dot', text: `Working ${peripheral.address}` });
    }

    function status(peripheral, status) {
      node.status({ fill: 'yellow', shape: 'dot', text: `${peripheral.address}: ${status}` });
    }

    function perform(peripheral, { operation, service, characteristic, value, meta }) {
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
            break;
        }
      });
    }

    function handleError(error) {
      console.log('error', JSON.stringify(error));
      return
    }

    function handleMessage(msg) {
      if (!msg) { return; } // no-op
      const { peripheral, operations } = msg;
      working(peripheral);
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
          node.send(msg);
          return PeripheralService.disconnect(p).then(done);
        }).catch((er) => {
          msg.er = er;
          msg.results = null;
          node.send(msg);
          return PeripheralService.disconnect(peripheral).then(done);
        });
      });
    }

    node.on('close', () => {
      clearInterval(workInterval);
    });

    node.on('input', (msg) => {
      if (msg.peripheral && msg.operations && msg.operations.length > 0) {
        operations.push(msg);
      }
    });
  }

  RED.nodes.registerType('ble-communication', BLECommunication);
};