package main

import (
	"log"
	"net/http"
)

func main() {
	http.Handle("/", http.FileServer(http.Dir("web")))
	log.Println("请访问 127.0.0.1:9000")
	http.ListenAndServe(":9000", nil)
}
