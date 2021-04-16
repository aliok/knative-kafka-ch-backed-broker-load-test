const express = require('express');
const {CloudEvent, HTTP} = require("cloudevents");

let latency = process.env['LATENCY'];
if (!latency) {
	console.log("LATENCY env var is not defined or it is 0, going to response the requests immediately");
	latency = 0;
}

const app = express();

app.use((req, res, next) => {
	let data = "";

	req.setEncoding("utf8");
	req.on("data", function (chunk) {
		data += chunk;
	});

	req.on("end", function () {
		req.body = data;
		next();
	});
});

let received = 0;
let error = 0;

app.post("/", (req, res) => {
	received++;

	if (received % 100 === 0) {
		console.log("Received message count: " + received);
		console.log("Error count: " + error);
	}

	try {
		const event = HTTP.toEvent({headers: req.headers, body: req.body});
		const data = event.data;
		const timeDiff = new Date().getTime() - data['time'];
		console.log("Received total: " + received + ", errors: " + error + ", lag in ms:" + timeDiff);

		setTimeout(function () {
			res.status(202).send('');
		}, latency);
	} catch (err) {
		error++;
		console.error(err);
		res.status(415).header("Content-Type", "application/json").send(JSON.stringify(err));
	}
});

app.listen(8080, () => {
	console.log('App listening on :8080');
});


registerGracefulExit();

function registerGracefulExit() {
	let logExit = function () {
		console.log("Exiting");
		process.exit();
	};

	// handle graceful exit
	//do something when app is closing
	process.on('exit', logExit);
	//catches ctrl+c event
	process.on('SIGINT', logExit);
	process.on('SIGTERM', logExit);
	// catches "kill pid" (for example: nodemon restart)
	process.on('SIGUSR1', logExit);
	process.on('SIGUSR2', logExit);
}
