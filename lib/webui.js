var debug = require('debug')('memtrack:webui');

module.exports = function(host, port) {
	var connect = require('connect');
	var connectRoute = require('connect-route');
	var http = require('http');

	var app = connect();
	var server = http.createServer(app);
	var io = require('socket.io').listen(server, { log: false });

	app.use(connect.static(__dirname + '/web'));

	server.listen(port, host, function() {
		console.log('memtrack started on ' + host + ':' + port);
	});

	var tracker = new (require('./tracker'));

	io.sockets.on('connection', function (socket) {
		debug('memtrack client connected from IP address : ' + socket.handshake.address.address);
		tracker.addSocket(socket);
	});

	return tracker;
}
