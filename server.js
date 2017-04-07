'use strict';

const Amp = require('amphtml-validator');
const Hapi = require('hapi');
const Http = require('http');
const Inert = require('inert');
const Url = require('url');
const Request = require('request');

const server = new Hapi.Server();

server.connection({host: '0.0.0.0', port: process.env.PORT || 8888});
server.register(Inert, () => {});

server.register(require('vision'), (err) => {
  if (err) {
    console.log("Failed to load vision.");
  }
  server.views({
      engines: { ejs: require('ejs') },
      relativeTo: __dirname,
      path: './templates'
  });
});

server.route([{
  method: 'GET',
  path:'/healthcheck',
  handler: function (request, reply) {
    reply('OK');
  }
},{
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
},{
  method: 'GET',
  path: '/badge',
  handler: (request, reply) => {
    const badgeSucess = {
      key_color: '#555',
      key_text_anchor: 18.5,
      key_text: 'build',
      key_value_width: 54,
      key_width: 37,
      value_color: '#4c1',
      value_text_anchor: 63,
      value_text: 'success',
      value_width: 54,
      width: 91
    }

    const badgeFailed = {
      key_color: '#555',
      key_text_anchor: 18.5,
      key_text: 'build',
      key_value_width: 54,
      key_width: 37,
      value_color: '#e05d44',
      value_text_anchor: 56.5,
      value_text: 'failed',
      value_width: 54,
      width: 78
    }

    let isValid = false;

    Request(request.query.amp, function(error, response, body) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        Amp.getInstance().then((validator) => {
          let result = validator.validateString(body);
          isValid = (result.status === 'PASS');
          reply.view('badge.svg.ejs', {
              badge: isValid ? badgeSucess : badgeFailed
          }, {
            contentType: 'image/svg+xml'
          });
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
