# memtrack

memtrack is a node module for plotting memory usage over time for a Node.js program. It also highlights memory leaks and indicates the 
type of objects that are contributing to memory growth.

This module uses memwatch module and process.memoryUsage() function to pull out useful stats.

THE MODULE IS EXPERIMENTAL, AND WILL GO THROUGH MORE TESTING AND NECESSARY ENHANCEMENTS.

# Installation

	npm install memtrack

# Usage

The following call should be placed before any other require statement in your application, e.g. at the first line of your main module

```js
require('memtrack')();
```

memtrack will be started as a web server on port `7575`, you can access it by pointing your browser to: `http://[yourhost]:7575`. 

You will see a log message on the console like : memtrack started on 0.0.0.0:7575

You will find a graph plotting the heap memory usage over time and a bar chart showing objects contributing to memory growth.

To obtain additional debug messages at runtime, run your node js program as follows : DEBUG=*; node mynodeprogram

# Options

  - `port` Listening port, defaulting to `7575`
  - `host` Listening host, defaulting to `0.0.0.0`
  - `memInterval` Time interval in milliseconds for invoking process.memoryUsage() defaulting to `2*60*1000`, that is 2 minutes. Actually,
    if you set memInterval below 2 minutes, it is reset to 2 minutes (in order to limit the frequency of calling process.memUsage() ).

```js
require('memtrack')({port:7373, memInterval:180000});
```

# Additional Features

You will receive an alert on the memtrack webpage, if the heap memory used exceeds 50% of your RAM.

At least three hours of memory stats are saved in memory while your Node program is running. So, if you start your Node.js program and then connect to memtrack from a browser much later, you still get graphical view of the most recent memory usage stats.

# Testing

An example program has been taken from the memwatch source. The relevant file is tests/leaky.js . To see how memtrack works, run the command : node tests/leaky.js , and point your browser to http://localhost:7575 (Allow for a delay of about 5 minutes for any useful data to show up.)
