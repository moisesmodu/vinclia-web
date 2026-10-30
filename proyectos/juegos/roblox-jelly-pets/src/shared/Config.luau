--!strict
-- Configuración de Jelly Pets: rarezas, especies, precios, candado, recompensas y los identificadores de la tienda.
-- Solo datos planos (números, textos y tablas) para que Lune pueda cargar este módulo en las pruebas.
-- Los colores van como { r, g, b } (0-255); el juego los convierte con Color3.fromRGB.

export type RarityDef = {
	id: string,
	icon: string,
	weight: number, -- peso en la cinta (probabilidad = peso / suma de pesos)
	price: number, -- monedas para comprarla en la cinta
	income: number, -- monedas por segundo en un pedestal
	color: { number },
}

export type SpeciesDef = {
	id: string,
	icon: string,
}

export type ShopItem = {
	name: string,
	id: number, -- 0 = apagado
	icon: string,
}

local Config = {}

-- IDENTIFICADORES DE LA TIENDA
-- Se crean en create.roblox.com → tu experiencia → Monetization (pases y productos de desarrollador).
-- Pega el número de cada uno en `id`. Con 0 la función queda apagada: el botón no aparece y el servidor la ignora.
Config.GamePasses = {
	{ name = "DoubleCoins", id = 0, icon = "💰" }, -- Pase "2× monedas": duplica lo que generan tus gelatinas.
	{ name = "ExtraPads", id = 0, icon = "➕" }, -- Pase "Más pedestales": 4 pedestales más en tu base.
	{ name = "FasterLock", id = 0, icon = "⚡" }, -- Pase "Candado rápido": el candado dura más y recarga antes.
} :: { ShopItem }

Config.Products = {
	{ name = "LuckyRoll", id = 0, icon = "🎲" }, -- Producto "Tirada de suerte": una gelatina Épica o mejor.
	{ name = "CoinPack", id = 0, icon = "🪙" }, -- Producto "Bolsa de monedas": monedas al instante.
} :: { ShopItem }

-- SERVIDOR
Config.MaxPlayers = 8 -- Debe coincidir con el tamaño de servidor puesto en el panel web (hay 8 bases).

-- RAREZAS, de la más común a la más rara. Fusionar 3 iguales da 1 de la siguiente.
-- Cada fusión sube algo los ingresos (3 · 1 = 3 → 4) y libera dos pedestales.
Config.Rarities = {
	{ id = "Common", icon = "⚪", weight = 600, price = 25, income = 1, color = { 120, 224, 160 } },
	{ id = "Uncommon", icon = "🟢", weight = 250, price = 120, income = 4, color = { 92, 184, 255 } },
	{ id = "Rare", icon = "🔵", weight = 100, price = 600, income = 15, color = { 168, 120, 255 } },
	{ id = "Epic", icon = "🟣", weight = 38, price = 3000, income = 60, color = { 255, 112, 196 } },
	{ id = "Legendary", icon = "🟡", weight = 10, price = 15000, income = 250, color = { 255, 201, 77 } },
	{ id = "Mythic", icon = "🌈", weight = 2, price = 75000, income = 1000, color = { 255, 120, 96 } },
} :: { RarityDef }

-- ESPECIES: solo cambian la forma (orejas, pinchos, patitas...). La rareza decide color e ingresos.
Config.Species = {
	{ id = "Blob", icon = "🫧" },
	{ id = "Bunny", icon = "🐰" },
	{ id = "Kitty", icon = "🐱" },
	{ id = "Dino", icon = "🦖" },
	{ id = "Octo", icon = "🐙" },
	{ id = "Sprout", icon = "🌱" },
} :: { SpeciesDef }

-- CINTA: las gelatinas salen de la nube de un extremo y cruzan el mapa por el centro.
Config.Conveyor = {
	length = 220, -- studs, centrada en x = 0
	width = 9,
	speed = 7, -- studs por segundo
	spawnInterval = 2.2, -- segundos entre gelatina y gelatina
	maxItems = 16,
}

-- PEDESTALES Y GELATINAS
Config.Pads = {
	base = 8, -- pedestales de cada base
	extraPadsBonus = 4, -- con el pase "Más pedestales"
	max = 12, -- pedestales construidos en cada base (base + bonus)
}

Config.Pets = {
	startCoins = 60, -- monedas de un jugador nuevo (y tras renacer): dos gelatinas comunes
	maxOwned = 40, -- gelatinas guardadas como máximo (en pedestal o en reserva)
	sellFraction = 0.5, -- vender devuelve la mitad del precio
	walkSpeed = 18, -- studs/s de una gelatina que va andando a su base
}

-- INGRESOS: monedas/s = Σ ingresos de las gelatinas en pedestal · (1 + renacimientos · perRebirth) · (2 con el pase)
Config.Income = {
	doubleCoinsMultiplier = 2,
	perRebirth = 0.5,
}

-- CANDADO DE LA BASE: nadie puede llevarse tus gelatinas mientras dura. Después, una recarga.
-- duración = (baseDuration + nivel · perLevel) · (fasterLockMultiplier con el pase)
Config.Lock = {
	baseDuration = 30,
	perLevel = 5,
	maxLevel = 10,
	cooldown = 25,
	fasterLockMultiplier = 1.5,
	fasterLockCooldown = 15,
	upgradeBaseCost = 400,
	upgradeGrowth = 1.9,
}

-- LLEVARSE GELATINAS (sin daño): mantienes pulsado, la llevas encima de la cabeza hasta tu base.
-- El dueño puede tocarte para que la suelte (vuelve sola a su pedestal).
Config.Steal = {
	holdDuration = 1.2,
	carryWalkSpeed = 11, -- quien lleva una gelatina va más lento que el dueño (16)
	carryTimeout = 45, -- si no llega a su base en este tiempo, la gelatina vuelve a casa
	tagDistance = 12,
	promptDistance = 9,
}

-- GANANCIAS SIN CONECTAR: una parte de lo que generabas, con tope.
Config.Offline = {
	rate = 0.5,
	maxSeconds = 4 * 3600,
	minSeconds = 60,
}

-- PREMIO DIARIO: racha de 1 a 7 días (al 8.º vuelve a empezar). premio = base · racha (+ bonus el día 7)
Config.Daily = {
	baseReward = 100,
	maxStreak = 7,
	weekBonus = 1000,
}

-- RENACER: vuelves a empezar (monedas y gelatinas) con un multiplicador permanente.
Config.Rebirth = {
	baseCost = 50000,
	growth = 3,
	maxRebirths = 50,
}

-- PRODUCTOS
Config.LuckyRoll = {
	minRarity = 4, -- Épica o mejor
}

Config.CoinPack = {
	minCoins = 1000,
	incomeSeconds = 900, -- o 15 minutos de tus ingresos, lo que sea mayor
}

-- GUARDADO (DataStoreService)
Config.Save = {
	storeName = "JellyPets_v1",
	autosaveInterval = 120,
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
