/* TODO: verify that when this is turned off and back on, that it still only has and uses exactly one callback */

const ReaderService = require('./lib/readerService');
const _ = require('lodash');
const { withTiming } = require('./utils/timing');

module.exports = function(RED) {
  function BLECentralNode(config) {
    RED.nodes.createNode(this,config);
    let node = this;
    withTiming(node);

    this.status({fill:"red",shape:"ring",text:"Not Initialized"});
    this.deviceIdFilter = config.deviceIdFilter;

    node.on('input', function(msg) {
      if(msg.payload === true){
        // turn on the readerService
        node.status({fill:"green",shape:"dot",text:"Running"});
        console.log("Device ID Filter of node", node.deviceIdFilter);

        ReaderService.onMessage = (message) => {
          node.messageReceived();
          if(node.deviceIdFilter === null || node.deviceIdFilter === '' || node.deviceIdFilter === message.deviceId){
            node.messageSent();
            node.send(message);
          }
        };
        ReaderService.start();
      } else {
        // turn off the readerService
        node.status({fill:"yellow",shape:"dot",text:"Not Running"});
        ReaderService.stop();
      }
    });
  }
  RED.nodes.registerType("ble-central",BLECentralNode);
};