let peripherals;
if(process.env.NO_BLUETOOTH){
  peripherals = require('./mocks/peripherals');
} else {
  peripherals = require('./peripherals');
}

module.exports = peripherals;