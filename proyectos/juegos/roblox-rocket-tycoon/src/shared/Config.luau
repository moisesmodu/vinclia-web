--!strict
-- Configuración de Rocket Hop Tycoon: parcelas, botones de compra (árbol de dependencias), extractores, mejoras,
-- cohete, asteroides y cristales, renacer, premios y los identificadores de la tienda.
-- Solo datos planos (números, textos y tablas) para que Lune pueda cargar este módulo en las pruebas.
-- Las posiciones de la parcela van en studs, en coordenadas locales: el centro de la parcela es (0, 0), el suelo
-- está en y = 0 y el frente (la avenida) es +Z. Los colores van como { r, g, b } (0-255).

export type ShopItem = {
	name: string,
	id: number, -- 0 = apagado
	icon: string,
}

-- Un botón de compra (una baldosa con precio en el suelo de la base).
-- kind: "dropper" (extractor), "upgrader" (escáner que multiplica el valor de la roca), "wall", "dome" (cúpula
-- habitable: +bonus a los ingresos), "rocket" (plataforma del cohete) o "deco".
export type ButtonDef = {
	id: string,
	kind: string,
	icon: string,
	cost: number,
	requires: { string }, -- se ve cuando todos estos están comprados
	pad: { number }, -- { x, z } de la baldosa
	at: { number }, -- { x, z } del objeto que construye
	radius: number, -- radio del objeto en el suelo (para que ninguna baldosa caiga encima)
	value: number?, -- extractor: monedas por roca
	interval: number?, -- extractor: segundos entre rocas
	multiplier: number?, -- escáner: × valor de cada roca que pasa
	bonus: number?, -- cúpula: +x a los ingresos (0.1 = +10 %)
	size: { number }?, -- muro: { ancho en x, ancho en z }
}

export type CrystalKind = {
	id: string,
	value: number, -- cristales que suma
	weight: number, -- probabilidad = peso / suma
	color: { number },
}

local Config = {}

-- IDENTIFICADORES DE LA TIENDA
-- Se crean en create.roblox.com → tu experiencia → Monetization (pases y productos de desarrollador).
-- Pega el número de cada uno en `id`. Con 0 la función queda apagada: el botón no aparece y el servidor la ignora.
Config.GamePasses = {
	{ name = "DoubleCash", id = 0, icon = "💰" }, -- Pase "2× Cash": la base gana el doble.
	{ name = "AutoCollect", id = 0, icon = "🧲" }, -- Pase "Auto-Collect": las monedas van solas al bolsillo.
	{ name = "FasterRocket", id = 0, icon = "🚀" }, -- Pase "Faster Rocket": el cohete vuela 1,5× más rápido.
} :: { ShopItem }

Config.Products = {
	{ name = "CashPack", id = 0, icon = "🪙" }, -- Producto "Cash Pack": 10 minutos de ingresos al instante.
	{ name = "InstantUpgrade", id = 0, icon = "⏩" }, -- Producto "Instant Upgrade": el siguiente botón, gratis.
	{ name = "MeteorShower", id = 0, icon = "☄️" }, -- Producto "Meteor Shower": lluvia de cristales en tu base.
} :: { ShopItem }

-- SERVIDOR: una parcela por jugador.
Config.MaxPlayers = 8 -- Debe coincidir con el tamaño de servidor puesto en el panel web.

-- PARCELAS: dos filas de 4 a los lados de la avenida (eje X). Cada parcela mide `size` × `size`.
Config.Plot = {
	size = 128,
	gap = 6, -- entre parcelas
	avenue = 52, -- ancho de la avenida central
	usable = 58, -- las baldosas y los asteroides no pasan de |x|, |z| <= usable
	spawn = { 0, 50 }, -- donde aparece el dueño
	sign = { 0, 60 }, -- cartel con la foto del dueño
	belt = { x0 = -46, x1 = 32, z = 4, width = 6, height = 1.2, speed = 8 }, -- cinta: la roca va de x0 a x1
	refinery = { x = 42, z = 4, size = 14 }, -- refinería al final de la cinta
	vault = { x = 42, z = 20, size = 8 }, -- baldosa para cobrar lo que guarda la refinería
	padSize = 6, -- lado de una baldosa de compra
	padGap = 2, -- separación mínima entre baldosas y objetos
	rocketPad = { 40, -40 }, -- centro de la plataforma del cohete
}

-- BOTONES: el orden de la lista es el orden en que se ven en la base. El primero es gratis.
-- Total ≈ 600 000 monedas; el último (Observatorio) abre el renacer.
local buttons: { ButtonDef } = {
	-- primeros pasos
	{
		id = "drill1",
		kind = "dropper",
		icon = "⛏️",
		cost = 0,
		requires = {},
		pad = { -40, -14 },
		at = { -40, -5 },
		radius = 4,
		value = 3,
		interval = 2,
	},
	{
		id = "drill2",
		kind = "dropper",
		icon = "⛏️",
		cost = 30,
		requires = { "drill1" },
		pad = { -40, 22 },
		at = { -40, 13 },
		radius = 4,
		value = 4,
		interval = 2,
	},
	{
		id = "wallBack",
		kind = "wall",
		icon = "🧱",
		cost = 80,
		requires = { "drill1" },
		pad = { -54, -54 },
		at = { 0, -63 },
		radius = 0,
		size = { 128, 2 },
	},
	{
		id = "drill3",
		kind = "dropper",
		icon = "⛏️",
		cost = 150,
		requires = { "drill2" },
		pad = { -30, -14 },
		at = { -30, -5 },
		radius = 4,
		value = 6,
		interval = 2,
	},
	{
		id = "scanner1",
		kind = "upgrader",
		icon = "✨",
		cost = 300,
		requires = { "drill2" },
		pad = { 2, -14 },
		at = { 2, 4 },
		radius = 5,
		multiplier = 1.5,
	},
	-- el gancho: el cohete llega pronto
	{
		id = "rocket",
		kind = "rocket",
		icon = "🚀",
		cost = 500,
		requires = { "scanner1" },
		pad = { 40, -22 },
		at = { 40, -40 },
		radius = 10,
	},
	{
		id = "drill4",
		kind = "dropper",
		icon = "⛏️",
		cost = 700,
		requires = { "drill3" },
		pad = { -30, 22 },
		at = { -30, 13 },
		radius = 4,
		value = 9,
		interval = 2,
	},
	{
		id = "dome1",
		kind = "dome",
		icon = "🏠",
		cost = 900,
		requires = { "drill3" },
		pad = { -40, -26 },
		at = { -40, -40 },
		radius = 9,
		bonus = 0.1,
	},
	{
		id = "flag",
		kind = "deco",
		icon = "🚩",
		cost = 250,
		requires = { "wallBack" },
		pad = { -46, 56 },
		at = { -56, 56 },
		radius = 2,
	},
	{
		id = "wallLeft",
		kind = "wall",
		icon = "🧱",
		cost = 1200,
		requires = { "wallBack" },
		pad = { -54, 0 },
		at = { -63, 0 },
		radius = 0,
		size = { 2, 128 },
	},
	-- a mitad de camino
	{
		id = "drill5",
		kind = "dropper",
		icon = "⛏️",
		cost = 2500,
		requires = { "drill4", "scanner1" },
		pad = { -20, -14 },
		at = { -20, -5 },
		radius = 4,
		value = 16,
		interval = 2,
	},
	{
		id = "scanner2",
		kind = "upgrader",
		icon = "✨",
		cost = 5000,
		requires = { "drill5" },
		pad = { 12, -14 },
		at = { 12, 4 },
		radius = 5,
		multiplier = 2,
	},
	{
		id = "dome2",
		kind = "dome",
		icon = "🏠",
		cost = 6000,
		requires = { "dome1", "drill4" },
		pad = { -18, -26 },
		at = { -18, -40 },
		radius = 9,
		bonus = 0.1,
	},
	{
		id = "lamps",
		kind = "deco",
		icon = "💡",
		cost = 4000,
		requires = { "wallLeft" },
		pad = { -14, 44 },
		at = { 0, 60 },
		radius = 0,
	},
	{
		id = "drill6",
		kind = "dropper",
		icon = "⛏️",
		cost = 10000,
		requires = { "scanner2" },
		pad = { -20, 22 },
		at = { -20, 13 },
		radius = 4,
		value = 30,
		interval = 2,
	},
	{
		id = "wallRight",
		kind = "wall",
		icon = "🧱",
		cost = 9000,
		requires = { "wallLeft" },
		pad = { 54, 34 },
		at = { 63, 0 },
		radius = 0,
		size = { 2, 128 },
	},
	{
		id = "dish",
		kind = "deco",
		icon = "📡",
		cost = 15000,
		requires = { "dome2" },
		pad = { 44, 44 },
		at = { 52, 52 },
		radius = 5,
	},
	-- el final
	{
		id = "drill7",
		kind = "dropper",
		icon = "⛏️",
		cost = 30000,
		requires = { "drill6" },
		pad = { -10, -14 },
		at = { -10, -5 },
		radius = 4,
		value = 70,
		interval = 2,
	},
	{
		id = "scanner3",
		kind = "upgrader",
		icon = "✨",
		cost = 60000,
		requires = { "drill7" },
		pad = { 22, -14 },
		at = { 22, 4 },
		radius = 5,
		multiplier = 2.5,
	},
	{
		id = "dome3",
		kind = "dome",
		icon = "🏠",
		cost = 40000,
		requires = { "dome2", "drill6" },
		pad = { 4, -26 },
		at = { 4, -40 },
		radius = 9,
		bonus = 0.1,
	},
	{
		id = "drill8",
		kind = "dropper",
		icon = "⛏️",
		cost = 120000,
		requires = { "scanner3" },
		pad = { -10, 22 },
		at = { -10, 13 },
		radius = 4,
		value = 160,
		interval = 2,
	},
	{
		id = "observatory",
		kind = "deco",
		icon = "🔭",
		cost = 300000,
		requires = { "drill8", "dome3", "dish" },
		pad = { -20, 32 },
		at = { -36, 40 },
		radius = 9,
	},
}
Config.Buttons = buttons

Config.FinalButton = "observatory" -- comprarlo abre el renacer

-- COHETE: un botón (mantener = subir). Con el joystick se mueve en horizontal; sin empuje, planea hacia abajo.
-- El combustible solo se gasta subiendo y se rellena posado (en la plataforma o en un asteroide).
Config.Rocket = {
	climbSpeed = 20, -- studs/s hacia arriba con empuje
	fallSpeed = 9, -- studs/s hacia abajo sin empuje
	horizontalSpeed = 24, -- studs/s con el joystick a tope
	fasterMultiplier = 1.5, -- pase Faster Rocket
	fuelSeconds = 4, -- segundos de empuje con el depósito lleno
	refillPerSecond = 1.5, -- segundos de empuje que se recuperan por segundo posado
	maxRange = 70, -- distancia horizontal máxima desde el centro de la plataforma
	maxAltitude = 72, -- altura máxima sobre el suelo
	reserve = 0.8, -- los asteroides se ponen a una altura que se alcanza con el 80 % del depósito
	resetDelay = 6, -- segundos que espera un cohete vacío antes de volver a su plataforma
}

-- ASTEROIDES con cristales: flotan sobre la parcela, siempre al alcance del cohete (ver Crystals.layout).
Config.Asteroids = {
	count = 10,
	minHeight = 26, -- altura del centro del asteroide
	maxHeight = 56,
	minPadDistance = 16, -- distancia horizontal mínima a la plataforma
	minSpacing = 16, -- entre asteroides
	radius = 5, -- radio de la roca (el cristal va encima)
	maxTries = 60,
	seed = 4242, -- + índice de la parcela: cada parcela tiene su cielo, siempre el mismo
}

Config.CrystalKinds = {
	{ id = "Blue", value = 1, weight = 80, color = { 92, 184, 255 } },
	{ id = "Pink", value = 3, weight = 17, color = { 255, 120, 200 } },
	{ id = "Gold", value = 10, weight = 3, color = { 255, 201, 77 } },
} :: { CrystalKind }

Config.Crystals = {
	respawnSeconds = 40,
	pickupRadius = 8, -- el cliente lo pide a esta distancia
	serverSlack = 1.5, -- el servidor acepta hasta radio · 1,5 + 2 (latencia)
	serverExtra = 2,
	minInterval = 0.15, -- segundos entre dos recogidas del mismo jugador
	speedSlack = 1.6, -- viaje entre dos recogidas: como mucho velocidad máxima · 1,6 + travelExtra
	travelExtra = 40,
	perCrystal = 0.01, -- cada cristal: +1 % de ingresos...
	maxBoost = 2, -- ...hasta +200 % (×3)
	maxBoostPerRebirth = 0.5, -- y cada renacimiento sube ese tope +50 %
}

-- PRODUCTO "Meteor Shower": cristales extra en tu parcela durante un rato, a ras de suelo en el patio delantero.
Config.MeteorShower = {
	count = 16,
	duration = 90,
	minSpacing = 7,
	height = 3,
	area = { x0 = -56, x1 = 56, z0 = 28, z1 = 56 },
	seed = 777,
}

-- INGRESOS
Config.Income = {
	doubleCashMultiplier = 2,
	tickSeconds = 1,
}

-- RENACER: hay que tener el Observatorio y las monedas. Se vuelve a empezar la base (monedas, botones y caja);
-- se quedan los cristales y el multiplicador sube para siempre.
Config.Rebirth = {
	baseCost = 500000,
	growth = 2,
	maxRebirths = 40,
	perRebirth = 0.5, -- multiplicador = 1 + renacimientos · 0,5
	startCoins = 0,
}

-- PREMIO DIARIO: racha de 1 a 7 días (al 8.º vuelve a empezar). premio = base · racha (+ bonus el día 7)
Config.Daily = {
	baseReward = 100,
	maxStreak = 7,
	weekBonus = 1000,
}

-- GANANCIAS SIN CONECTAR: la mitad de lo que ganaba la base, con tope de 4 horas.
Config.Offline = {
	rate = 0.5,
	maxSeconds = 4 * 3600,
	minSeconds = 120,
}

-- PRODUCTO "Cash Pack": 10 minutos de ingresos, nunca menos de 500.
Config.CashPack = {
	seconds = 600,
	minCoins = 500,
}

-- GUARDADO (DataStoreService)
Config.Save = {
	storeName = "RocketTycoon_v1",
	autosaveInterval = 120,
	lockExpiry = 420, -- un bloqueo de sesión más viejo que esto se considera abandonado (servidor caído)
	loadAttempts = 6,
	loadRetryDelay = 4,
	saveAttempts = 4,
	maxReceipts = 100,
}

-- PETICIONES DEL CLIENTE: cubo de fichas por jugador (los cristales tienen el suyo, más generoso).
Config.RateLimit = {
	perSecond = 5,
	burst = 10,
	crystalPerSecond = 10,
	crystalBurst = 20,
}

return Config
