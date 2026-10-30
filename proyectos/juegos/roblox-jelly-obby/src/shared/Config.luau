--!strict
-- Configuración de Jelly Tower Obby: física de salto, torre, zonas, obstáculos, monedas, estelas, premio diario,
-- reinicio de torre y los identificadores de la tienda.
-- Solo datos planos (números, textos y tablas) para que Lune pueda cargar este módulo en las pruebas.
-- Los colores van como { r, g, b } (0-255); el juego los convierte con Color3.fromRGB.

export type ShopItem = {
	name: string,
	id: number, -- 0 = apagado
	icon: string,
}

export type ZoneDef = {
	id: string,
	icon: string,
	color: { number }, -- plataformas
	accent: { number }, -- checkpoints, columna y detalles
	kinds: { [string]: number }, -- obstáculos posibles en la zona y su peso
}

export type TrailDef = {
	id: string,
	icon: string,
	price: number, -- monedas (0 = solo con el pase de estelas)
	premium: boolean, -- true = necesita el pase «Estelas»
	colors: { { number } }, -- 2 o 3 colores del degradado
}

local Config = {}

-- IDENTIFICADORES DE LA TIENDA
-- Se crean en create.roblox.com → tu experiencia → Monetization (pases y productos de desarrollador).
-- Pega el número de cada uno en `id`. Con 0 la función queda apagada: el botón no aparece y el servidor la ignora.
Config.GamePasses = {
	{ name = "SpeedCoil", id = 0, icon = "⚡" }, -- Pase «Bobina de velocidad»: herramienta que te hace correr más.
	{ name = "GravityCoil", id = 0, icon = "🪐" }, -- Pase «Bobina de gravedad»: herramienta que te hace saltar más.
	{ name = "TrailPack", id = 0, icon = "🌈" }, -- Pase «Estelas»: desbloquea las estelas especiales.
} :: { ShopItem }

Config.Products = {
	{ name = "SkipStage", id = 0, icon = "⏭️" }, -- Producto «Saltar fase»: te lleva al checkpoint siguiente.
} :: { ShopItem }

-- Insignia opcional al llegar a la cima (create.roblox.com → Badges). 0 = apagada.
Config.FinishBadgeId = 0

-- SERVIDOR
Config.MaxPlayers = 20

-- FÍSICA DEL PERSONAJE (valores por defecto de Roblox). Con ellos se comprueba que todas las fases tienen solución.
-- Altura de salto = JumpHeight; velocidad vertical al saltar v = √(2 · g · h).
Config.Physics = {
	gravity = 196.2, -- studs/s² (Workspace.Gravity por defecto)
	walkSpeed = 16, -- studs/s (Humanoid.WalkSpeed)
	jumpHeight = 7.2, -- studs (Humanoid.JumpHeight con UseJumpPower = false)
	safety = 0.8, -- solo se usa el 80 % del alcance teórico: margen para jugadores normales y para el móvil
}

-- TORRE: las fases suben en espiral alrededor de una columna central. Cada fase recorre un lado de un cuadrado de
-- `side` studs, de una esquina (su checkpoint) a la siguiente (el checkpoint de la fase siguiente).
Config.Tower = {
	stages = 40,
	stagesPerZone = 10,
	seed = 20261029, -- misma semilla = misma torre en todos los servidores
	side = 96, -- lado del cuadrado (studs)
	padSize = 12, -- checkpoints de 12 × 12
	baseHeight = 2, -- altura de la cara de arriba del primer checkpoint
	pieceThickness = 1.6,
	minLength = 1.5, -- ninguna plataforma más corta
	minWidth = 1.2, -- vigas estrechas: lo mínimo que se pisa
	minGap = 1, -- hueco mínimo entre plataformas (las giratorias no chocan con sus vecinas)
	minStageRise = 12, -- cada fase sube al menos esto (deja sitio encima de los trampolines)
	coreSize = 36, -- columna central (studs de lado)
	maxLateral = 6, -- zigzag: desplazamiento lateral máximo del centro de una plataforma
	maxPiecesPerStage = 24,
}

-- ZONAS de 10 fases, cada una con su color y los obstáculos nuevos que estrena (y los de antes).
Config.Zones = {
	{
		id = "Strawberry",
		icon = "🍓",
		color = { 255, 128, 176 },
		accent = { 255, 201, 77 },
		kinds = { pad = 5, beam = 2, jelly = 3, bounce = 2 },
	},
	{
		id = "Lime",
		icon = "🍏",
		color = { 132, 222, 96 },
		accent = { 79, 179, 255 },
		kinds = { pad = 3, beam = 2, jelly = 3, bounce = 2, conveyor = 3, vanish = 3, trampoline = 2 },
	},
	{
		id = "Blueberry",
		icon = "🫐",
		color = { 92, 156, 255 },
		accent = { 255, 150, 190 },
		kinds = {
			pad = 2,
			beam = 2,
			jelly = 3,
			bounce = 2,
			conveyor = 2,
			vanish = 3,
			trampoline = 2,
			moving = 3,
			goo = 3,
		},
	},
	{
		id = "Grape",
		icon = "🍇",
		color = { 172, 112, 255 },
		accent = { 255, 201, 77 },
		kinds = {
			pad = 1,
			beam = 3,
			jelly = 3,
			bounce = 2,
			conveyor = 2,
			vanish = 3,
			trampoline = 2,
			moving = 3,
			goo = 2,
			rotating = 3,
		},
	},
} :: { ZoneDef }

-- OBSTÁCULOS. Los valores «a → b» se interpolan con la dificultad de la fase (0 en la fase 1, 1 en la última).
Config.Obstacles = {
	padLength = { 11, 4 }, -- plataforma normal (largo a lo largo del camino)
	padWidth = { 10, 4 },
	beamLength = { 9, 14 },
	beamWidth = { 2.6, 1.2 },
	jellySize = { 7, 3.5 }, -- bloque de gelatina que se encoge al pisarlo
	jellyDelay = { 1.8, 0.8 }, -- segundos desde que lo pisas hasta que desaparece
	jellyRespawn = 3,
	bounceSize = 4, -- te lanza nada más tocarla: pequeña, para que el salto cuente desde su borde cercano
	bounceLaunch = 75, -- velocidad vertical que da (studs/s): sube hasta ≈ 14 studs
	trampolineSize = 5,
	trampolineLaunch = 100, -- ≈ 25 studs
	conveyorLength = { 12, 16 },
	conveyorWidth = { 6, 4 },
	conveyorSpeed = { 4, 9 }, -- studs/s, hacia delante o hacia atrás
	maxBeltFraction = 0.6, -- una cinta nunca va a más del 60 % de la velocidad al andar
	vanishSize = { 5, 3 },
	vanishDelay = { 1.2, 0.5 },
	vanishRespawn = 2.5,
	movingLength = { 7, 5 },
	movingRange = { 4, 10 }, -- studs a cada lado
	movingSpeed = { 4, 9 },
	rotatingLength = { 12, 14 },
	rotatingWidth = { 3.4, 2.6 },
	rotatingSpeed = { 0.6, 1.4 }, -- rad/s
	gooLength = { 3, 6 }, -- charco de baba que te devuelve al checkpoint (hay que saltarlo)
	gooSafe = 4.5, -- suelo seguro a cada lado del charco
	gapFactor = { 0.3, 0.85 }, -- parte del alcance que se usa en cada hueco
	riseFactor = { 0.35, 0.6 }, -- parte de la altura de salto que sube cada escalón
	launchRise = { 0.3, 0.6 }, -- parte de la altura de un trampolín o una almohadilla que sube el escalón siguiente
}

-- MONEDAS: cada checkpoint nuevo da base + perStage · (fase − 1); la cima, finishBonus. Todo por el multiplicador.
Config.Rewards = {
	stageBase = 5,
	perStage = 1,
	finishBonus = 250,
}

-- REINICIO DE TORRE: tras llegar a la cima puedes volver a la fase 1; cada reinicio suma un trofeo y +25 % de
-- monedas (máximo ×4).
Config.Restart = {
	perRestart = 0.25,
	maxMultiplier = 4,
	maxRestarts = 999,
}

-- PREMIO DIARIO: racha de 1 a 7 días (al 8.º vuelve a empezar). premio = base · racha (+ bonus el día 7)
Config.Daily = {
	baseReward = 25,
	maxStreak = 7,
	weekBonus = 200,
}

-- BOBINAS (pases): mientras la tienes en la mano.
Config.Coils = {
	speedWalkSpeed = 26,
	gravityJumpHeight = 13,
}

-- ESTELAS: con monedas o, las especiales, con el pase «Estelas».
Config.Trails = {
	{ id = "Mint", icon = "🍃", price = 150, premium = false, colors = { { 150, 255, 190 }, { 88, 194, 106 } } },
	{
		id = "Bubblegum",
		icon = "🍬",
		price = 400,
		premium = false,
		colors = { { 255, 190, 220 }, { 255, 120, 180 } },
	},
	{ id = "Ocean", icon = "🌊", price = 900, premium = false, colors = { { 160, 230, 255 }, { 40, 120, 255 } } },
	{
		id = "Sunset",
		icon = "🌅",
		price = 2000,
		premium = false,
		colors = { { 255, 220, 90 }, { 255, 120, 80 }, { 190, 80, 200 } },
	},
	{
		id = "Rainbow",
		icon = "🌈",
		price = 0,
		premium = true,
		colors = { { 255, 90, 90 }, { 255, 220, 80 }, { 80, 200, 255 } },
	},
	{ id = "Galaxy", icon = "🌌", price = 0, premium = true, colors = { { 60, 40, 140 }, { 200, 120, 255 } } },
	{ id = "Gold", icon = "⭐", price = 0, premium = true, colors = { { 255, 240, 160 }, { 255, 190, 40 } } },
} :: { TrailDef }

-- SALTAR FASE: si ya no se puede saltar (estás en la última fase o en la cima), se devuelven estas monedas.
Config.Skip = {
	refundCoins = 150,
}

-- CONTROLES DEL SERVIDOR CONTRA TRAMPAS
Config.AntiCheat = {
	maxHorizontalSpeed = 100, -- studs/s entre dos muestras (andar, cintas, bobina y empujones caben de sobra)
	minTeleportDistance = 40, -- por debajo de esto nunca se considera teletransporte
	sampleInterval = 0.5,
	fallLimit = 40, -- caer más de esto por debajo de tu checkpoint te devuelve a él
	minTimeSlack = 0.5, -- tiempo mínimo por fase = recorrido / velocidad máxima · slack
	maxPlausibleSpeed = 38, -- bobina de velocidad + cinta a favor
	touchDistance = 14, -- el checkpoint solo cuenta si tu personaje está de verdad encima
}

-- GUARDADO (DataStoreService)
Config.Save = {
	storeName = "JellyTowerObby_v1",
	autosaveInterval = 60, -- los checkpoints no guardan al momento (límite de escrituras por clave); la cima, sí
	lockExpiry = 420, -- un bloqueo de sesión más viejo que esto se considera abandonado (servidor caído)
	loadAttempts = 6,
	loadRetryDelay = 4,
	saveAttempts = 4,
	maxReceipts = 100,
}

-- PETICIONES DEL CLIENTE: cubo de fichas por jugador.
Config.RateLimit = {
	perSecond = 4,
	burst = 8,
}

return Config
