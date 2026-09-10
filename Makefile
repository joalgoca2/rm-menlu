# --- CONFIGURACIÓN GLOBAL ---
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

NETWORK_NAME = $(DOCKER_NETWORK_NAME)
PROJECT_NAME ?= $(or $(COMPOSE_PROJECT_NAME),rm-menlu)

# Comandos base con prefijo de proyecto para evitar colisiones en el VPS
DOCKER_COMPOSE_BASE = docker compose -p $(PROJECT_NAME)
DOCKER_COMPOSE_DEV  = $(DOCKER_COMPOSE_BASE) -f docker-compose.yml -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD = $(DOCKER_COMPOSE_BASE) -f docker-compose.yml -f docker-compose.prod.yml

# Selección dinámica de comando según el entorno
ifeq ($(NODE_ENV), production)
    CMD_ACTIVE = $(DOCKER_COMPOSE_PROD)
else
    CMD_ACTIVE = $(DOCKER_COMPOSE_DEV)
endif

.PHONY: help dev-up dev-down dev-up-d dev-up-build prod-build prod-save prod-scp prod-deploy prod-up prod-down db-setup-prod db-setup logs shell-app shell-db db-migrate db-seed db-studio clean fix-permissions check lint-fix

# --- AYUDA ---
help: ## Muestra este menú de ayuda
	@echo "\033[1mRM-Framework 2026 - CLI Management\033[0m"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# --- ENTORNOS DE EJECUCIÓN ---

dev-up: ## Inicia desarrollo con hot-reload (primer plano)
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || docker network create $(NETWORK_NAME)
	$(DOCKER_COMPOSE_DEV) up

dev-up-d: ## Inicia desarrollo en segundo plano (detached)
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || docker network create $(NETWORK_NAME)
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "🚀 App (DEV) en http://localhost:3000"

dev-up-build: ## Fuerza reconstrucción e inicia desarrollo
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || docker network create $(NETWORK_NAME)
	$(DOCKER_COMPOSE_DEV) up -d --build
	@echo "🚀 App (DEV) reconstruida en http://localhost:3000"

dev-down: ## Detiene el entorno de desarrollo
	$(DOCKER_COMPOSE_DEV) down

# --- PRODUCCIÓN (BUILD LOCAL + SCP) ---

# Variables de imagen (personalizar según sea necesario)
DOCKER_USER ?= root
PROD_IMAGE_TAG ?= ${PROD_DEPLOY_TAG}
PROD_IMAGE_NAME = $(PROJECT_NAME)
PROD_IMAGE_FULL = $(PROD_IMAGE_NAME):$(PROD_IMAGE_TAG)

# Configuración del Servidor Remoto
REMOTE_USER ?= root
REMOTE_HOST ?= 5.161.111.221
REMOTE_PORT ?= 22
REMOTE_APP_DIR ?= /srv/rm-menlu
IMAGE_TAR_FILE = $(PROJECT_NAME)-$(PROD_IMAGE_TAG).tar.gz
PROD_ENV_DIR = .prod_environment

# Llave SSH y Opciones de Conexión (con KeepAlive y Timeout extendido)
SSH_OPTS = -o ConnectTimeout=120 -o ServerAliveInterval=30 -o ServerAliveCountMax=5 -o IPQoS=throughput
SSH_CMD = ssh $(SSH_OPTS) -p $(REMOTE_PORT) $(if $(SSH_KEY_PATH),-i "$(SSH_KEY_PATH)")
SCP_CMD = scp $(SSH_OPTS) -P $(REMOTE_PORT) $(if $(SSH_KEY_PATH),-i "$(SSH_KEY_PATH)")
RSYNC_CMD = rsync -avzP -e "ssh -p $(REMOTE_PORT) $(if $(SSH_KEY_PATH),-i '$(SSH_KEY_PATH)') $(SSH_OPTS)"

prod-validate: ## [LOCAL] Valida tipos y linter dentro del contenedor antes del build
	@echo "🔍 Validando tipos y linter dentro del contenedor..."
	$(DOCKER_COMPOSE_DEV) run --rm app sh -c "npx tsc --noEmit && npm run lint"

prod-build: prod-validate ## [LOCAL] Construye la imagen de producción
	@echo "📦 Construyendo imagen de producción $(PROD_IMAGE_FULL)..."
	docker build --network=host -f services/app/Dockerfile \
		--build-arg NEXT_PUBLIC_APP_VERSION=$(PROD_DEPLOY_TAG) \
		-t $(PROD_IMAGE_FULL) \
		-t $(PROD_IMAGE_NAME):latest \
		--target runner \
		services/app

prod-save: prod-build ## [LOCAL] Guarda la imagen comprimida en un archivo .tar.gz
	@echo "💾 Guardando y comprimiendo imagen en $(PROD_ENV_DIR)/.image/$(IMAGE_TAR_FILE)..."
	@mkdir -p $(PROD_ENV_DIR)/.image
	docker save $(PROD_IMAGE_FULL) | gzip > $(PROD_ENV_DIR)/.image/$(IMAGE_TAR_FILE)

prod-scp: ## [LOCAL] Transfiere archivos al servidor (Optimizado con RSYNC resistente a cortes)
	@echo "⬆️ Preparando servidor $(REMOTE_HOST)..."
	@$(SSH_CMD) $(REMOTE_USER)@$(REMOTE_HOST) "mkdir -p $(REMOTE_APP_DIR)/.image"
	
	@echo "⬆️ Transfiriendo archivos de configuración (En un solo viaje)..."
	@$(SCP_CMD) $(PROD_ENV_DIR)/README.md \
	           $(PROD_ENV_DIR)/Makefile \
	           $(PROD_ENV_DIR)/docker-compose.prod.yml \
	           $(PROD_ENV_DIR)/.env.production \
	           $(REMOTE_USER)@$(REMOTE_HOST):$(REMOTE_APP_DIR)/

	@echo "⬆️ Transfiriendo imagen comprimida con RSYNC (Resistente a cortes)..."
	@$(RSYNC_CMD) $(PROD_ENV_DIR)/.image/$(IMAGE_TAR_FILE) $(REMOTE_USER)@$(REMOTE_HOST):$(REMOTE_APP_DIR)/.image/
	
	@echo "✅ Transferencia exitosa. Configurando .env en servidor..."
	@$(SSH_CMD) $(REMOTE_USER)@$(REMOTE_HOST) "cd $(REMOTE_APP_DIR) && mv -f .env.production .env && chmod 600 .env"

prod-deploy: ## [LOCAL -> REMOTE] Flujo completo: Build -> Save -> SCP -> Remote Deploy
	$(MAKE) prod-save
	$(MAKE) prod-scp
	@echo "💻 Conectando al servidor para activar la nueva versión..."
	$(SSH_CMD) $(REMOTE_USER)@$(REMOTE_HOST) "cd $(REMOTE_APP_DIR) && make deploy"
	@echo "✨ Despliegue de producción completado."

prod-up: ## Levanta infraestructura en el VPS (usando archivos locales si están montados)
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || docker network create $(NETWORK_NAME)
	$(DOCKER_COMPOSE_PROD) up -d --build --remove-orphans
	@echo "🚀 Contenedores de producción activos."

prod-down: ## Detiene la aplicación en producción en el VPS (vía Makefile remoto)
	$(SSH_CMD) $(REMOTE_USER)@$(REMOTE_HOST) "cd $(REMOTE_APP_DIR) && make down"

# --- GESTIÓN DE BASE DE DATOS (PRISMA) ---

db-generate: ## Genera los tipos de Prisma Client dentro del contenedor
	$(CMD_ACTIVE) exec app npx prisma generate

db-setup: ## Inicialización completa para DESARROLLO
	$(DOCKER_COMPOSE_DEV) exec app npx prisma generate
	$(DOCKER_COMPOSE_DEV) exec app npx prisma migrate dev
	$(DOCKER_COMPOSE_DEV) exec app npx tsx prisma/seed.ts

db-setup-prod: ## Ejecución estándar de Prisma 6
	@echo "📦 Sincronizando Base de Datos en Producción..."
	# Ahora 'npx prisma' funcionará a la primera porque nada ha sido borrado
	$(DOCKER_COMPOSE_PROD) exec -u nextjs app npx prisma migrate deploy
	$(DOCKER_COMPOSE_PROD) exec -u nextjs app npx tsx prisma/seed.ts

db-migrate: ## Ejecuta migraciones de desarrollo
	$(DOCKER_COMPOSE_DEV) exec app npx prisma migrate dev

db-seed: ## Ejecuta el sembrado de datos en desarrollo
	$(DOCKER_COMPOSE_DEV) exec app npx tsx prisma/seed.ts

db-studio: ## Abre Prisma Studio
	$(DOCKER_COMPOSE_DEV) exec app npx prisma studio

# --- UTILIDADES Y DEBUG ---

logs: ## Muestra logs del entorno activo (DEV por defecto)
	$(CMD_ACTIVE) logs -f

shell-app: ## Terminal dentro del contenedor de la App
	$(CMD_ACTIVE) exec app sh

shell-db: ## Terminal dentro del contenedor de la DB (Solo si existe en el compose)
	$(CMD_ACTIVE) exec db bash

check: ## Validación proactiva: TypeScript y Linter
	@echo "🔍 Validando tipos y linter dentro del contenedor..."
	$(CMD_ACTIVE) exec app sh -c "npx tsc --noEmit && npm run lint"

lint-fix: ## Corrige automáticamente errores de formateo y linter dentro del contenedor
	@echo "🛠 Corrigiendo errores de linter dentro del contenedor..."
	$(CMD_ACTIVE) exec app npm run lint:fix

fix-permissions: ## Corrige permisos de archivos generados por Docker
	sudo chown -R $(shell id -u):$(shell id -g) .

clean: ## Limpieza profunda: Contenedores, volúmenes y caché de Next.js
	$(DOCKER_COMPOSE_DEV) down -v
	$(DOCKER_COMPOSE_PROD) down -v
	rm -rf services/app/.next
	@echo "🗑 Sistema purgado."