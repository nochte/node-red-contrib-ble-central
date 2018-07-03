const PeripheralService = require('./lib/peripheralService');
const { withTiming } = require('./utils/timing');
/*
    flow:
      - look at timeout libraries
      - store point-in-time state
      - if connected, use connection
      - else, no-op
      - discover
      - cleanup
 */

const OPERATION_TIMEOUT = 10000; // disconnect and resume after 10 seconds, no matter what
const STATES = {
  messageReceived: 'Message Received',
  connecting: 'Connecting',
  connected: 'Connected',
  discoveringServices: 'Discovering Services',
  discoveringCharacteristics: 'Discovering Characteristics',
  disconnecting: 'Disconnecting',
  disconnected: 'Disconnected',
  timeout: 'Timed Out',
  error: 'Error'
};

module.exports = function(RED) {
  function BLEDiscoverServices(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    // withTiming(node);

    function state(st, did = ''){
      node.status({shape: 'ring', text: did + ': ' + st, fill: 'yellow'});
      node.send([null, {payload: {state: st, device: did}}, null]);
    }

    node.on('input', (msg) => {
      if(msg.peripheral){
        // node.messageReceived();
        const address = msg.peripheral.address;
        state(STATES.messageReceived, msg.peripheral.address);

        return PeripheralService.connect(msg.peripheral).then((peripheral) => {
          state(STATES.connected, address);

          return PeripheralService.discoverAllServicesAndCharacteristics(peripheral).then(({services, characteristics}) => {
            state(STATES.discoveringServices, address);
            node.send([{services, characteristics, deviceId: address.toUpperCase()}, null, null]);
            // node.messageSent();
            return PeripheralService.forceDisconnect(peripheral).then(() => {
              state(STATES.disconnected, address);
              node.send([null, null, {payload: true}]); // restart it
            });
          }).catch((er) => {
            node.send([null, {payload: {exception: er, device: address}}, {payload: true}]);
          })
        });
      }
    });
  }

  RED.nodes.registerType('ble-discover-services', BLEDiscoverServices);
};
