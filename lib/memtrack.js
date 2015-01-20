var memwatch = require("memwatch");
var os = require('os');
var debug = require('debug')('memtrack');

module.exports = function(options) {

	var memInterval = options && options.memInterval || 2*60*1000; // 2 minutes in milliseconds
	// Let 2 minutes be the minimum interval
	if (memInterval < 2*60*1000)
		memInterval = 2*60*1000;

	var host = options && options.host || '0.0.0.0';
	var port = options && options.port || 7575;

	var tracker = require("./webui")(host, port);

	// Take first snapshot
	var hd = new memwatch.HeapDiff();

	var memalert = false;

	memwatch.on('stats', function(stats) {
		debug("memwatch gc : " + JSON.stringify(stats));
		var ts = new Date().getTime(); 
		tracker.update({event: "gc", ts: ts, currentBase : stats.current_base});
		// Take the second snapshot and compute the diff
		var lastHeapDiff = hd.end();
		tracker.update({event: "heapdiff", ts: ts, lastHeapDiff : lastHeapDiff});

		// Re-initialize hd . Take another snapshot and wait for the next 'stats' event to take heap-diff again
		hd = new memwatch.HeapDiff();
	});

	memwatch.on('leak', function(leak) {
		debug('leak event emitted ...');
		var ts = new Date().getTime(); 
		tracker.update({event: "leak", ts: ts, currentBase : stats.current_base});
	});

	setInterval(function() {
		var heapUsed = process.memoryUsage().heapUsed;
		var ts = new Date().getTime();
		tracker.update({event: "memused", ts: ts, heapUsed: heapUsed});

		var percent = (heapUsed / os.totalmem) * 100;
		if (percent > 50) {
			memalert = true;
			tracker.update({event: "memalert", ts: ts, percent: percent});
		} else if (memalert) {
			memalert = false;
			tracker.update({event: "memalert", ts: ts, percent: percent});
		}
	}, memInterval);
}
