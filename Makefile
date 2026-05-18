.PHONY: build run test tidy

build:
	go build -o bin/goservice ./cmd/goservice

run:
	go run ./cmd/goservice

test:
	go test ./...

tidy:
	go mod tidy
