package main

import (
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"lilu.red/grpc/auto/grpc/father"
	"lilu.red/grpc/auto/grpc/son"
	"log"
	"testing"
	"time"
)

func TestInsert(t *testing.T) {
	conn, err := grpc.Dial("127.0.0.1:50051", grpc.WithInsecure())
	if err != nil {
		log.Fatalf("%v", err)
	}
	defer conn.Close()

	c := auto_grpc_son.NewSonServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	father := auto_grpc_father.Info{Name: "baba"}
	info := auto_grpc_son.Info{Name: "xiaoming", Father: &father}
	replay, err := c.Insert(ctx, &info)
	if err != nil {
		log.Fatalf("%v", err)
	}
	log.Println(replay)
}
