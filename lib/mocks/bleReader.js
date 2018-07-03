let _interval = null;
let callback = (msg) => {
  console.log("message received but no callback registered. tossing.");
};

const startScanning = (c, _errorCallback) => {
  callback = c;
  if(_interval !== null){ return; }
  _interval = setInterval(() => {
    let device = ['FF', 'FF', 'FF', 'FF', 'FF'];
    while(device.length < 6){
      device.push((('00') + Math.floor(Math.random() * 255).toString(16)).slice(-2).toUpperCase());
    }

    device = device.join(':');
    const rssi = -Math.floor((Math.random() * 50 + 30));
    const shortDid = device.split(':').map((elm, ndx) => {if(ndx > 2){ return elm; } return null}).filter((x) => {return !!x}).join('');
    callback({deviceId: device, rssi: rssi, peripheral: null, advertisement: {
        localName: "FakeDevice-" + shortDid
      }});
  }, 1000 / 125);
  // }, 1000 / 250);
};

const stopScanning = () => {
  clearInterval(_interval);
  _interval = null;
};

const removeListener = () => {
  callback = (msg) => {}
};

module.exports = {
  startScanning,
  stopScanning,
  removeListener
};

