Knative Kafka-backed Broker load tests

## scenario1:

https://github.com/aliok/knative-kafka-ch-backed-broker-load-test/tree/scenario1

Configuration:

- Single receiver with a processing time of 10 ms (responds 202 after 10 ms)
- 6 producers, each sending 100 messages/sec --> targeted total messages sent 600 messages/sec
- Total messages sent: 1000*6 = 6000

Outcome:
- Message sending took 20 sec --> 6000/20=300 messages/sec (measured manually)
- Received total: 6000, errors: 0, lag in latest message ms:71963

Summary:
- Processing on the receiver takes too long and it lags behind.
- Even with 300 messages/sec, Knative Service doesn't scale up with default
autoscaling configuration

## scenario2:

https://github.com/aliok/knative-kafka-ch-backed-broker-load-test/tree/scenario2

Configuration:

- Single receiver with a processing time of 0 ms (responds 202 immediately)
- 6 producers, each sending 100 messages/sec --> targeted total messages sent 600 messages/sec
- Total messages sent: 1000*6 = 6000

Outcome:

- Message sending took 20 sec --> 6000/20=300 messages/sec (measured manually)
- Received total: 6000, errors: 0, lag in ms:5259

Summary:
- Receiver responds immediately, but the network latency and other overhead
  makes the receiver still lag behind.
- Even with 300 messages/sec, Knative Service doesn't scale up with default
  autoscaling configuration


## scenario3 - not very healthy:

https://github.com/aliok/knative-kafka-ch-backed-broker-load-test/tree/scenario3

Configuration:
- 10 receiver pods with a processing time of 0 ms (respond 202 immediately)
- 6 producers, each sending 100 messages/sec --> targeted total messages sent 600 messages/sec
- Total messages sent: 1000*6 = 6000

Outcome:
- Message sending took 20 sec --> 6000/20=300 messages/sec (measured manually)
- (10x) Received total: 600, errors: 0, lag in ms:5632

Summary:
- This test is not very healthy since it creates 16 pods (plus Kafka pods, etc) and the machine
  I ran it has 8 CPU cores
- Even if the number of receiver pods is higher than the producer pods, event processing still
  lags behind. ... I think because of unideal CPU numbers

## scenario4 - ignore

https://github.com/aliok/knative-kafka-ch-backed-broker-load-test/tree/scenario4

Tried 50 receiver pods on a 8 CPU machine.

## scenario5 - reduced message frequency:

https://github.com/aliok/knative-kafka-ch-backed-broker-load-test/tree/scenario5

Configuration:
- 3 receiver pods with a processing time of 0 ms (respond 202 immediately)
- 3 producers, each sending 50 messages/sec --> targeted total messages sent 150 messages/sec
-  Total messages sent: 200*3 = 600

Outcome:
- Message sending took 8 sec --> 600/8=75 messages/sec (measured manually)
- (3x) Received total: 200, errors: 0, lag in ms:12

Summary:
- Reduced the message frequency
- Tried with reasonable pod count (3 receiver + 3 producer)
- Event processing keeps up

## scenario6 - added latency to scenario 6:

https://github.com/aliok/knative-kafka-ch-backed-broker-load-test/tree/scenario6

Configuration:
- 3 receiver pods with a processing time of 10 ms
- 3 producers, each sending 50 messages/sec --> targeted total messages sent 150 messages/sec
-  Total messages sent: 2000*3 = 6000

Outcome:
- Message sending took 45 sec --> 6000/45=133 messages/sec (measured manually)
- (3x) Received total: 2000, errors: 0, lag in ms:14

Summary:
- Even with some processing latency added to scenario5, event processing can
  keep up
- 133 messages/sec event sending means, a new message is posted every 7.5 ms
- Since there are 3 receiver pods which in combined can handle a message
  every 10/3 = 3.33 ms, event processing keeps up
