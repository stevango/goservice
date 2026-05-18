package main

import (
	"log"
	"net/http"

	"github.com/stevango/goservice/internal/config"
	"github.com/stevango/goservice/internal/server"
)

func main() {
	cfg := config.Load()
	log.Printf("goservice ouvindo em %s", cfg.Addr)
	if err := http.ListenAndServe(cfg.Addr, server.New()); err != nil {
		log.Fatal(err)
	}
}
