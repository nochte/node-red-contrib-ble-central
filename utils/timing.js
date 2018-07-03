const _ = require('lodash');
const withTiming = (node) => {
  node._messages = [];
  node._sent = [];
  node.messageReceived = () => {
    node._messages.push(new Date());
  };
  node.messageSent = () => {
    node._sent.push(new Date());
  };

  node.on('close', () => {
    clearInterval(node.__interval);
  });

  node.__interval = setInterval(() => {
    node._messages = _.filter(node._messages, (timestamp) => {
      return timestamp >= new Date() - 15000; // last 15 seconds only;
    });
    node._sent = _.filter(node._sent, (timestamp) => {
      return timestamp >= new Date() - 15000; // last 15 seconds only;
    });
    node.status({fill: 'grey', shape: 'ring', text: `${node._messages.length * 4} / ${node._sent.length * 4} rec/sent - per min`});
  }, 5000);
};

module.exports = {
  withTiming
};