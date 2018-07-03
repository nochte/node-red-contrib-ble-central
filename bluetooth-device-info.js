const execSync = require('child_process').execSync;

module.exports = function(RED) {
  function BluetoothDeviceInfo(config) {
    RED.nodes.createNode(this,config);
    let node = this;

    const getConfig = () => {
      let gatewayId;
      if(process.env.NO_BLUETOOTH){
        gatewayId = process.env.GATEWAY_ID;
      } else {
        gatewayId = execSync('hcitool dev').toString().split('\n')[1].trim().split('\t')[1];
      }
      node.send({
        gatewayId: gatewayId
      });
    };

    node.on('input', getConfig);
  }
  RED.nodes.registerType("bluetooth-device-info",BluetoothDeviceInfo);
};