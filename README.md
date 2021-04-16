## Outcome

Configuration:
- 3 receiver pods with a processing time of 0 ms (respond 202 immediately)
- 3 producers, each sending 50 messages/sec --> targeted total messages sent 150 messages/sec
- Total messages sent: 200*3 = 600

Outcome:
- Message sending took 8 sec --> 600/8=75 messages/sec (measured manually)
- (3x) Received total: 200, errors: 0, lag in ms:12


## Prepare

Install Knative, Strimzi; create a Kafka cluster:

```bash
./hack/01-kn-serving.sh && ./hack/02-kn-eventing.sh && ./hack/03-strimzi.sh && ./hack/04-kn-kafka.sh
```

Build `producer` and `receiver` images:

```bash
## TODO DOCKER_HUB_USERNAME=<your username here>
DOCKER_HUB_USERNAME=aliok

docker build receiver -t docker.io/${DOCKER_HUB_USERNAME}/knative-kafka-ch-backed-broker-load-test-receiver
docker push docker.io/${DOCKER_HUB_USERNAME}/knative-kafka-ch-backed-broker-load-test-receiver

docker build producer -t docker.io/${DOCKER_HUB_USERNAME}/knative-kafka-ch-backed-broker-load-test-producer
docker push docker.io/${DOCKER_HUB_USERNAME}/knative-kafka-ch-backed-broker-load-test-producer
```

Start everything but the producer:

```
kubectl apply -f config/01-namespace.yaml
kubectl apply -f config/02-receiver.yaml
kubectl apply -f config/03-default-ch-webhook.yaml
kubectl apply -f config/04-config-br-default-channel.yaml
kubectl apply -f config/05-broker.yaml
kubectl apply -f config/06-trigger.yaml
```

Start watching Kafka channel - in another terminal:

```
kubectl -n kafka exec -it my-cluster-kafka-0 -- bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --from-beginning --topic knative-messaging-kafka.my-namespace.default-kne-trigger
```

Start watching receiver - in another terminal:

```
stern -n my-namespace receiver
```

## Run

Start producing:

```
kubectl apply -f config/07-producer.yaml
```

## Configuration

Configuration options:
- 02-receiver.yaml - `LATENCY`: Wait N ms before responding 202
- 07-producer.yaml - `parallelism` and `completions`: How many pods should start
- 07-producer.yaml - `MESSAGE_COUNT`: How many messages to send per pod
- 07-producer.yaml - `MESSAGE_FREQUENCY`: Messages to send per second


## Clean up

```
kubectl delete -f config/07-producer.yaml
kubectl delete -f config/06-trigger.yaml
kubectl delete -f config/05-broker.yaml
kubectl delete -f config/04-config-br-default-channel.yaml
kubectl delete -f config/03-default-ch-webhook.yaml
kubectl delete -f config/02-receiver.yaml
kubectl delete -f config/01-namespace.yaml
```
