'use strict';

const Amp = require('amphtml-validator');
const Hapi = require('hapi');
const Http = require('http');
const Inert = require('inert');
const Url = require('url');
const Request = require('request');

const server = new Hapi.Server();

server.connection({host: 'localhost', port: 8000});
server.register(Inert, () => {});

server.route([{
  // VALID AMP
  method: 'GET',
  path:'/valid.amp',
  handler: function (request, reply) {
    reply.file('valid.amp');
  }
},{
  // INVALID AMP
  method: 'GET',
  path:'/invalid.amp',
  handler: function (request, reply) {
    reply.file('invalid.amp');
  }
},{
  // VALIDATE
  method: 'POST',
  path:'/validate',
  handler: (request, reply) => {
    if (!request.payload.amp) {
      return reply().code(400);
    }

    Request(request.payload.amp, function(error, response, body) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        Amp.getInstance().then((validator) => {
          reply(validator.validateString(body)).code(200);
        });
      }
    });
  }
}]);

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
