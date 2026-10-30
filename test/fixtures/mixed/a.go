package main

type store struct{}

func (s *store) save() error { return nil }

func run() {
	s := &store{}
	s.save()
	helper := func() { load() }
	helper()
}

func load() {}
