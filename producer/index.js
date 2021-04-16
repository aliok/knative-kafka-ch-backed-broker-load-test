const axios = require("axios").default;
const {HTTP, CloudEvent} = require("cloudevents");


registerGracefulExit();

const brokerUrl = process.env['BROKER_URL'];
if (!brokerUrl) {
	console.log("BROKER_URL env var is not defined");
	process.exit();
}

const podName = process.env['POD_NAME'];
if (!podName) {
	console.log("POD_NAME env var is not defined");
	process.exit();
}

const messageCount = process.env['MESSAGE_COUNT'];
if (!messageCount) {
	console.log("MESSAGE_COUNT env var is not defined");
	process.exit();
}

let messageWait = 0;
let messageFrequency = process.env['MESSAGE_FREQUENCY'];
if (!messageFrequency) {
	console.log("MESSAGE_FREQUENCY env var is not defined or it is 0, going to send all messages at once");
	messageWait = 0;
} else {
	try {
		let messageFrequencyNr = parseFloat(messageFrequency);
		messageWait = 1000 / messageFrequencyNr;
	} catch (err) {
		console.log("MESSAGE_FREQUENCY env var is not a proper number, going to send all messages at once");
		messageWait = 0;
	}
}

let tried = 0;
let success = 0;
let error = 0;

startSendingMessages();

function startSendingMessages() {
	console.log("Gonna send " + messageCount + " messages with an interval of " + messageWait + " ms")

	let i = 0;
	let interval = setInterval(function () {
		sendMessage(++i);
		if (i >= messageCount) {
			finish(interval);
		}
	}, messageWait);
}

function finish(interval) {
	clearInterval(interval);
	let sleep = 5;
	console.log("Sleeping " + sleep + " seconds to let the HTTP requests complete")
	setTimeout(function () {
		console.log("Finished producing");
		console.log("Tried to send " + tried + " events");
		console.log(success + " were successfully sent");
		console.log(error + " had errors");
	}, 5 * 1000);
}

function sendMessage(i) {
	console.log("Sending message " + i + "/" + messageCount);

	const ce = new CloudEvent({
		type: "org.apache.aliok.foo",
		source: "urn:event:from:bar/" + podName,
		data: JSON.stringify({
			pod: podName,
			eventNumber: i,
			time: new Date().getTime()
		})
	});
	const message = HTTP.binary(ce); // Or HTTP.structured(ce)

	axios({
		method: "post",
		url: brokerUrl,
		data: message.body,
		headers: message.headers,
	}).then(function (response) {
		success++;
	}).catch(function (err) {
		console.log("Unable to post event " + i + ". Error is:" + err)
		error++;
	});

	tried++;
}

function registerGracefulExit() {
	process.on('uncaughtException', function (err) {
		console.log(err);
	});

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
