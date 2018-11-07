package main

import (
	"log"
	"strings"
	"syscall/js"
)

//定义js方法(预期参数为文本和函数, 此方法执行完毕后会调用函数返回问候语)
func hi(vars []js.Value) {
	log.Println(vars)
	txt := strings.Join([]string{"你好", vars[0].String(), "我是go"}, ",")
	log.Println(txt)

	//调用作为参数传递进来的函数, 将问候语发送回去.
	vars[1].Invoke(txt)
}

//将js方法暴露(页面中可以直接调用)
func setCallbacks() {
	js.Global().Set("GOhi", js.NewCallback(hi))
	js.Global().Set("GOnihao", js.NewCallback(hi)) //别名
}

func main() {
	//暂时不清楚什么意思
	c := make(chan struct{}, 0)

	//注册方法
	setCallbacks()
	
	log.Println("GO初始化完毕")

	//阻塞进程(理解是否准确?)
	<-c
}
