/*
    Purpose:
      readerService mocks or activates the noble runtime

      Usage:
        - onMessage= -- sets the callback to be fired on message
        - start -- starts the service, calling the registered callback on discover
        - stop -- stops the reader
*/

let bleReader;
if(process.env.NO_BLUETOOTH){ // this allows for more rapid development of the UI tool, independent of the underlying hardware
  bleReader = require('./mocks/bleReader');
} else {
  bleReader = require('./bleReader');
}


class ReaderService {
  constructor(){
    this.messageCallback = this.messageCallback.bind(this);
    this.errorCallback = this.errorCallback.bind(this);
    this._onMessage = null;
    // bleReader.startScanning(this.messageCallback, this.errorCallback, false, true)
  }

  start(){
    bleReader.startScanning(this.messageCallback, this.errorCallback);
  }

  stop(){
    bleReader.stopScanning();
  }

  messageCallback(message) {
    return new Promise((resolve, reject) => {
      if(this._onMessage !== null){
        return resolve(this._onMessage(message));
      }
      return resolve(message);
    });
  }

  errorCallback(error) {
    return new Promise((resolve, reject) => {
      return resolve(null, error)
    });
  }

  set onMessage(callback) {
    console.log("Changing onMessage callback: " + callback);
    this._onMessage = callback;
  }
}

const readerService = new ReaderService();
module.exports = readerService;