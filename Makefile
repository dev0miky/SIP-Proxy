SHELL := /usr/bin/env bash
COMPOSE := docker compose

.PHONY: up down restart wait test smoke logs ps clean nuke panel-setup panel panel-down panel-logs

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

panel-setup:
	./scripts/panel-setup.sh

panel:
	$(COMPOSE) up -d panel-api panel-web

panel-down:
	$(COMPOSE) stop panel-api panel-web

panel-logs:
	$(COMPOSE) logs -f panel-api panel-web
