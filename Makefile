SHELL := /usr/bin/env bash
COMPOSE := docker compose

.PHONY: up down restart wait test smoke logs ps clean nuke

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart: down up

wait:
	./test/wait.sh

test: smoke

smoke:
	./test/smoke.sh

logs:
	$(COMPOSE) logs -f --tail=200

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v

nuke: clean
	rm -rf data homer-data mysql-data postgres-data
