var debug = require('debug')('memtrack:tracker');

var Tracker = function () {
	this.sockets = {};
	this.data = [];
	this.lastHeapDiff = {
		ts : 0,
		changeBytes : 0,
		changeObjects : 0,
		sortedOrderBytes : [],
		sortedOrderObjects : []
	}; 

	this.mainscript = process.argv[1];
	this.pid = process.pid;
};

Tracker.prototype.processHeapDiff = function(heapdiff) {

	this.lastHeapDiff.changeBytes = heapdiff.change.size;
	this.lastHeapDiff.changeObjects = heapdiff.after.nodes - heapdiff.before.nodes;

	this.lastHeapDiff.sortedOrderBytes = [];
	this.lastHeapDiff.sortedOrderObjects = [];

	var i = 0;
	for (i = 0; i < heapdiff.change.details.length; i++) {
		var type = heapdiff.change.details[i].what;
		var kb = heapdiff.change.details[i].size;
		var objects = heapdiff.change.details[i]["+"] - heapdiff.change.details[i]["-"];

		this.lastHeapDiff.sortedOrderBytes.push({type:type, kb: kb});
		this.lastHeapDiff.sortedOrderObjects.push({type:type, count: objects});

		this.lastHeapDiff.sortedOrderBytes.sort(function(a,b) {
			var val2 = b.kb.split(' ')[0];
			var val1 = a.kb.split(' ')[0];
    			return val1 - val2;
		});

		this.lastHeapDiff.sortedOrderObjects.sort(function(a,b) {
    			return a.count - b.count;
		});

	}

}

Tracker.prototype.addSocket = function(socket) {
	var that = this;
	this.sockets[socket.id] = socket;

	this.processHeapDiff(tmpheap);
	
	socket.emit('init', {main: this.mainscript, pid: this.pid, data: this.data, lastHeapDiff: this.lastHeapDiff}); 

	socket.on('disconnect', function () {
		debug('memtrack client from IP address disconnected : ' + socket.handshake.address.address);
		socket.removeAllListeners('disconnect');
		socket.removeAllListeners('message');
		delete(that.sockets[socket.id]);
	});
};

Tracker.prototype.update = function(msg) {

	var event = msg.event;

	if (event !== 'memalert' && event !== 'heapdiff') {
		this.data.push(msg);
	}

	if (this.data.length > 100) {
		this.data.shift();
	}

	if (event === 'heapdiff') {
		this.processHeapDiff(msg.lastHeapDiff);
		this.lastHeapDiff.ts = msg.ts;

		for (var id in this.sockets) {
			this.sockets[id].emit('heapdiff', {ts: msg.ts, lastHeapDiff: this.lastHeapDiff});
		}
	}

	for (var id in this.sockets) {
		this.sockets[id].emit(event, msg);
	}
};

module.exports = Tracker;
