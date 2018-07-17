const _ = require('lodash');
const CommunicationService = require('./lib/communicationService');

module.exports = function (RED) {
  function BLECommunication(config) {
    RED.nodes.createNode(this, config);
    let node = this;


    function done() {
      node.status({ fill: 'green', shape: 'dot', text: 'Ready' });
    }
    CommunicationService.onAllWorkComplete(done);
    CommunicationService.onStatus((peripheral, txt) => {
      node.status({fill: 'yellow', shape: 'dot', text: `${peripheral.address}: ${txt}`});
    });
    done();
    CommunicationService.start();

    node.on('close', () => {
      CommunicationService.stop();
    });

    node.on('input', (msg) => {
      if (msg.peripheral && msg.operations && msg.operations.length > 0) {
        CommunicationService.push(_.merge(msg, {
          callback: (er, ret) => {
            if(er){
              console.log('Error', er, 'Context', msg);
            }
            node.send(ret);
          }
        }));
        // operations.push(msg);
      }
    });
  }

  RED.nodes.registerType('ble-communication', BLECommunication);
};