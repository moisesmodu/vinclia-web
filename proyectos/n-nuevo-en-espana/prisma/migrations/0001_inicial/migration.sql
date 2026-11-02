-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "pais" TEXT NOT NULL DEFAULT 'es',
    "plan" TEXT,
    "accesoHasta" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recordatorio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "guia" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'es',
    "fechaClave" TIMESTAMP(3) NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recordatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL,
    "recordatorioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "texto" TEXT NOT NULL,
    "enviado" TIMESTAMP(3),

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoStripe" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoStripe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_stripeCustomerId_key" ON "Usuario"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_stripeSubscriptionId_key" ON "Usuario"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Recordatorio_usuarioId_idx" ON "Recordatorio"("usuarioId");

-- CreateIndex
CREATE INDEX "Aviso_fecha_enviado_idx" ON "Aviso"("fecha", "enviado");

-- AddForeignKey
ALTER TABLE "Recordatorio" ADD CONSTRAINT "Recordatorio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_recordatorioId_fkey" FOREIGN KEY ("recordatorioId") REFERENCES "Recordatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

