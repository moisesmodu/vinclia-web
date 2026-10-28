-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "pais" TEXT NOT NULL DEFAULT 'ES',
    "accesoHasta" TIMESTAMP(3),
    "progreso" JSONB,
    "simulacros" INTEGER NOT NULL DEFAULT 0,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "importe" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL,
    "modo" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenClave" (
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "caduca" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenClave_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Config" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_sesionId_key" ON "Pago"("sesionId");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenClave" ADD CONSTRAINT "TokenClave_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

