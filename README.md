## Outcome

Configuration:
- 50 receiver pods with a processing time of 0 ms (respond 202 immediately)
- 6 producers, each sending 100 messages/sec --> targeted total messages sent 600 messages/sec
- Total messages sent: 1000*6 = 6000

Outcome:
- (50x) Received total: 120, errors: 0, lag in ms:6489


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
