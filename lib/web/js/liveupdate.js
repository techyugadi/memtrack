$(document).ready(function() {

var socket = io.connect(document.location.protocol + '//' + document.location.hostname + ':' + document.location.port);

var heapStats = [];
var baseStats = [];
var leaks = [];

var plotOpts = {   
            grid : {
                hoverable: true,
            },
            tooltip: true,
            tooltipOpts: {
                content: "%y"
            },

	    xaxis: {
    		mode: "time",
    		timeformat: "%H:%M",
		tickLength: 0,
		tickSize: [15, "minute"]
	    },
            
            yaxis: {
                min:0  
            },
	    
	    legend:{position:"nw"}
};

function plotGraph() {

	var dataset = [
		    {
			label: "Heap Memory Used (MB)",
			data: heapStats,
			color: "green",
			points: { show: false },
			lines: { show: true }
		    }, {
			label: "Current Estimated Base Memory (MB)",
			data: baseStats,
			color: "red",
			points: { show: false },
			lines: {show:true}
		    }, {
			label: "Memory Growth (MB)",
			data: leaks,
			color: "orange",
			points: { symbol: "circle", fillColor: "orange", show: true },
			lines:{ show:false}
		    } 
	];  

	// Some formatting of x-axis (time) labels to prevent overlapping
	var lastTick = heapStats.length;
	var timediff = 0;
	if (lastTick > 1) {
		timediff = heapStats[lastTick - 1][0] - heapStats[0][0];
	}

	if (timediff > 48*60*60*1000) { // 3 hours
		plotOpts.xaxis.tickSize = [240, "minute"];
	} else if (timediff > 24*60*60*1000) { // 6 hours
		plotOpts.xaxis.tickSize = [180, "minute"];
	} else if (timediff > 12*60*60*1000) { // 12 hours
		plotOpts.xaxis.tickSize = [120, "minute"];
	} else if (timediff > 6*60*60*1000) { // 24 hours
		plotOpts.xaxis.tickSize = [60, "minute"];
	} else if (timediff > 3*60*60*1000) { // 48 hours
		plotOpts.xaxis.tickSize = [30, "minute"];
	}

	$.plot($("#plotdiv"), dataset, plotOpts);

}

function plotBarChart(lastHeapDiff) {

	var rawDataBytes = [];
        var dataSetBytes = [{ label: "Heap Diff (sorted by net memory allocation in KB)", data: rawDataBytes, color: "#F3F781" }];
        var ticksBytes = []; 

	var i = 0;
	for (i=0; i < lastHeapDiff.sortedOrderBytes.length; i++) {
		var kb = lastHeapDiff.sortedOrderBytes[i].kb.split(' ')[0];
		rawDataBytes.push([kb, i]);
		ticksBytes.push([i, lastHeapDiff.sortedOrderBytes[i].type]);
	}
	var netIncreaseMB = lastHeapDiff.changeBytes.split(' ')[0];
	var netIncreaseKB = netIncreaseMB * 1024;
	rawDataBytes.push([netIncreaseKB, i]);
	ticksBytes.push([i, 'Net Increase (KB)']);

        var optionsBytes = {
            series: {
                bars: {
                    show: true
                }
            },
            bars: {
                align: "center",
                barWidth: 0.2,
                horizontal: true,
                fillColor: { colors: [{ opacity: 0.75 } , { opacity: 1}] },
		
                lineWidth: 1
            },
            xaxis: {
                axisLabel: "Memory allocated (net) in KB",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 10,
                max: 5000,
		min: -5000,
		tickLength: 0,
                color: "black"
            },
            yaxis: {
                axisLabel: "Object Type",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 3,
                tickColor: "#5E5E5E",
                ticks: ticksBytes,
                color: "black"
            },
            legend: {
                noColumns: 0,
                labelBoxBorderColor: "#858585",
                position: "nw"
            },
            grid: {
                hoverable: true,
                borderWidth: 2,
                backgroundColor: { colors: ["#171717", "#4F4F4F"] }
            },
            tooltip: true,
            tooltipOpts: {
                content: "%x KB"
            }
        };
 
        $.plot($("#heapdiffbytes"), dataSetBytes, optionsBytes);


	var rawDataCount = [];
        var dataSetCount = [{ label: "Heap Diff (sorted by net object instances allocated)", data: rawDataCount, color: "#A9F5F2" }];
        var ticksCount = []; 

	i = 0;
	for (i=0; i < lastHeapDiff.sortedOrderObjects.length; i++) {
		rawDataCount.push([lastHeapDiff.sortedOrderObjects[i].count, i]);
		ticksCount.push([i, lastHeapDiff.sortedOrderObjects[i].type]);
	}
	rawDataCount.push([lastHeapDiff.changeObjects, i]);
	ticksCount.push([i, 'Net Increase (#)']);
        var optionsCount = {
            series: {
                bars: {
                    show: true
                }
            },
            bars: {
                align: "center",
                barWidth: 0.2,
                horizontal: true,
                fillColor: { colors: [{ opacity: 0.75 } , { opacity: 1}] },
		
                lineWidth: 1
            },
            xaxis: {
                axisLabel: "Number of objects allocated",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 10,
                max: 10000,
		min: -10000,
		tickLength: 0,
                color: "black"
            },
            yaxis: {
                axisLabel: "Object Type",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 3,
                tickColor: "#5E5E5E",
                ticks: ticksCount,
                color: "black"
            },
            legend: {
                noColumns: 0,
                labelBoxBorderColor: "#858585",
                position: "nw"
            },
            grid: {
                hoverable: true,
                borderWidth: 2,
                backgroundColor: { colors: ["#171717", "#4F4F4F"] }
            },
	    tooltip: true,
            tooltipOpts: {
                content: "%x"
            }
        };
 
        $.plot($("#heapdiffcount"), dataSetCount, optionsCount);

}

socket.on('connect', function() {
	heapStats.length = 0; //reset plot lines
	baseStats.length = 0; //reset plot lines
	$("p#status").text('Connected to Node.js process running on: ' + document.location.hostname);
});

socket.on('init', function (msg) {
 
	$("p#main").text('Main File : ' + msg.main);
	$("p#pid").text('pid : ' + msg.pid);

	var data = msg.data;
	var i=0;
	for (i=0; i < data.length; i++) {
		var point = data[i];
		var event = point.event;
		var xval = point.ts;
		var yval = 0;
	
		if (event === "gc") {
			var yval = point.currentBase / (1024*1024);
                	baseStats.push([xval, yval]);
		} else if (event === "memused") {
			var yval = 0;
			if (point.heapUsed) {
				yval = point.heapUsed / (1024*1024);
			}
                	heapStats.push([xval, yval]);
		} else if (event === "leak"){
			var yval = point.growth / (1024*1024);
			leaks.push([xval, yval]);
		}	
	}

	plotGraph();

	if (msg.lastHeapDiff) {
		var lastHeapDiff = msg.lastHeapDiff;

		var dateStr = new Date(lastHeapDiff.ts).toLocaleString();
		$("p#hdts").text('Heap Diff generated at : ' + dateStr);
		plotBarChart(lastHeapDiff);
	}
	 
});

socket.on('gc', function(msg) {

	// Plotting the graph over several hours - lets
	// create more room and avoid points getting cluttered
	if (heapStats.length > 100) {
			var w1 = $('#plotdiv').width();
				$('#plotdiv').css("width", w1+1);
			var w2 = $('#bound').width();
			if (w2 < 1050) {
				$('#bound').css("width", w2+1);
			}
	}

	var xval = msg.ts;
        var yval = 0;
	if (msg.currentBase) {
        	yval = msg.currentBase / (1024*1024);
	}
        baseStats.push([xval, yval]);
		
	plotGraph();

});

socket.on('leak', function(msg) {

	// Plotting the graph over several hours - lets
	// create more room and avoid points getting cluttered
	if (heapStats.length > 100) {
			var w1 = $('#plotdiv').width();
				$('#plotdiv').css("width", w1+1);
			var w2 = $('#bound').width();
			if (w2 < 1050) {
				$('#bound').css("width", w2+1);
			}
	}

	var xval = msg.ts;
        var yval = 0;
	if (msg.growth) {
		yval = msg.growth / (1024*1024);
	}
	leaks.push([xval, yval]);
	plotGraph();

});

socket.on('memused', function(msg) {

	// Plotting the graph over several hours - lets
	// create more room and avoid points getting cluttered
	if (heapStats.length > 100) {
			var w1 = $('#plotdiv').width();
				$('#plotdiv').css("width", w1+1);
			var w2 = $('#bound').width();
			if (w2 < 1050) {
				$('#bound').css("width", w2+1);
			}
	}

	var xval = msg.ts;
        var yval = 0;
	if (msg.heapUsed) {
		yval = msg.heapUsed / (1024*1024);
	}
        heapStats.push([xval, yval]);
		
	plotGraph();

});

socket.on('memalert', function(msg) {
	var percent = msg.percent;

	var dateStr = new Date(msg.ts).toLocaleString();
	if (percent > 50) {
		$("p#alert").text('Alert : received at ' + dateStr + ' : Heap Used ' +  percent + '% of RAM !'  );
	} else {
		//Dismiss alert if any
		$("p#alert").text('');
	}
});

socket.on('heapdiff', function(msg) {

	if (msg.ts === 0) {
		return; // not enough data to plot
	}
	var dateStr = new Date(msg.ts).toLocaleString();
	$("p#hdts").text('Heap Diff generated at : ' + dateStr);
	
	var lastHeapDiff = msg.lastHeapDiff;

	plotBarChart(lastHeapDiff);
            
});

socket.on('disconnect', function (msg) {  
	$("p#status").text('Error: memtrack disconnected from Node.js process. Updates not available.');
});

});

