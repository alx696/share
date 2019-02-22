// Code generated by protoc-gen-go. DO NOT EDIT.
// source: son.proto

package auto_grpc_son

import (
	"fmt"
	"github.com/golang/protobuf/proto"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"lilu.red/grpc/auto/grpc/father"
	"math"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion2 // please upgrade the proto package

type Info struct {
	Id                   string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Name                 string                 `protobuf:"bytes,2,opt,name=name,proto3" json:"name,omitempty"`
	Father               *auto_grpc_father.Info `protobuf:"bytes,3,opt,name=father,proto3" json:"father,omitempty"`
	XXX_NoUnkeyedLiteral struct{}               `json:"-"`
	XXX_unrecognized     []byte                 `json:"-"`
	XXX_sizecache        int32                  `json:"-"`
}

func (m *Info) Reset()         { *m = Info{} }
func (m *Info) String() string { return proto.CompactTextString(m) }
func (*Info) ProtoMessage()    {}
func (*Info) Descriptor() ([]byte, []int) {
	return fileDescriptor_c3baf4c9aab30da6, []int{0}
}

func (m *Info) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_Info.Unmarshal(m, b)
}
func (m *Info) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_Info.Marshal(b, m, deterministic)
}
func (m *Info) XXX_Merge(src proto.Message) {
	xxx_messageInfo_Info.Merge(m, src)
}
func (m *Info) XXX_Size() int {
	return xxx_messageInfo_Info.Size(m)
}
func (m *Info) XXX_DiscardUnknown() {
	xxx_messageInfo_Info.DiscardUnknown(m)
}

var xxx_messageInfo_Info proto.InternalMessageInfo

func (m *Info) GetId() string {
	if m != nil {
		return m.Id
	}
	return ""
}

func (m *Info) GetName() string {
	if m != nil {
		return m.Name
	}
	return ""
}

func (m *Info) GetFather() *auto_grpc_father.Info {
	if m != nil {
		return m.Father
	}
	return nil
}

func init() {
	proto.RegisterType((*Info)(nil), "auto.grpc.son.Info")
}

func init() { proto.RegisterFile("son.proto", fileDescriptor_c3baf4c9aab30da6) }

var fileDescriptor_c3baf4c9aab30da6 = []byte{
	// 164 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0xe2, 0x2c, 0xce, 0xcf, 0xd3,
	0x2b, 0x28, 0xca, 0x2f, 0xc9, 0x17, 0xe2, 0x4d, 0x2c, 0x2d, 0xc9, 0xd7, 0x4b, 0x2f, 0x2a, 0x48,
	0xd6, 0x2b, 0xce, 0xcf, 0x93, 0xe2, 0x49, 0x4b, 0x2c, 0xc9, 0x48, 0x2d, 0x82, 0x48, 0x2a, 0x45,
	0x71, 0xb1, 0x78, 0xe6, 0xa5, 0xe5, 0x0b, 0xf1, 0x71, 0x31, 0x65, 0xa6, 0x48, 0x30, 0x2a, 0x30,
	0x6a, 0x70, 0x06, 0x31, 0x65, 0xa6, 0x08, 0x09, 0x71, 0xb1, 0xe4, 0x25, 0xe6, 0xa6, 0x4a, 0x30,
	0x81, 0x45, 0xc0, 0x6c, 0x21, 0x3d, 0x2e, 0x36, 0x88, 0x5e, 0x09, 0x66, 0x05, 0x46, 0x0d, 0x6e,
	0x23, 0x31, 0x3d, 0x84, 0xc9, 0x50, 0x43, 0x41, 0x66, 0x05, 0x41, 0x55, 0x19, 0x39, 0x71, 0x71,
	0x05, 0xe7, 0xe7, 0x05, 0xa7, 0x16, 0x95, 0x65, 0x26, 0xa7, 0x0a, 0x99, 0x70, 0xb1, 0x79, 0xe6,
	0x15, 0xa7, 0x16, 0x95, 0x08, 0x09, 0xeb, 0xa1, 0xb8, 0x08, 0xac, 0x49, 0x0a, 0x9b, 0xa0, 0x12,
	0x43, 0x12, 0x1b, 0xd8, 0x99, 0xc6, 0x80, 0x00, 0x00, 0x00, 0xff, 0xff, 0xda, 0x5a, 0x72, 0x88,
	0xd0, 0x00, 0x00, 0x00,
}

// Reference imports to suppress errors if they are not otherwise used.
var _ context.Context
var _ grpc.ClientConn

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion4

// SonServiceClient is the client API for SonService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
type SonServiceClient interface {
	Insert(ctx context.Context, in *Info, opts ...grpc.CallOption) (*Info, error)
}

type sonServiceClient struct {
	cc *grpc.ClientConn
}

func NewSonServiceClient(cc *grpc.ClientConn) SonServiceClient {
	return &sonServiceClient{cc}
}

func (c *sonServiceClient) Insert(ctx context.Context, in *Info, opts ...grpc.CallOption) (*Info, error) {
	out := new(Info)
	err := c.cc.Invoke(ctx, "/auto.grpc.son.SonService/Insert", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// SonServiceServer is the server API for SonService service.
type SonServiceServer interface {
	Insert(context.Context, *Info) (*Info, error)
}

func RegisterSonServiceServer(s *grpc.Server, srv SonServiceServer) {
	s.RegisterService(&_SonService_serviceDesc, srv)
}

func _SonService_Insert_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(Info)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SonServiceServer).Insert(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/auto.grpc.son.SonService/Insert",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SonServiceServer).Insert(ctx, req.(*Info))
	}
	return interceptor(ctx, in, info, handler)
}

var _SonService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "auto.grpc.son.SonService",
	HandlerType: (*SonServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "Insert",
			Handler:    _SonService_Insert_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "son.proto",
}