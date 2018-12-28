package main

import (
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"lilu.red/grpc/auto/grpc/son"
	"log"
	"net"
)

const (
	port = ":50051"
)

type Server struct{}

func (s *Server) Insert(ctx context.Context, in *auto_grpc_son.Info) (*auto_grpc_son.Info, error) {
	info := auto_grpc_son.Info{Id: "a", Name: in.Name, Father: in.Father}

	return &info, nil
}

func main() {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	auto_grpc_son.RegisterSonServiceServer(s, &Server{})
	// Register reflection service on gRPC server.
	reflection.Register(s)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
