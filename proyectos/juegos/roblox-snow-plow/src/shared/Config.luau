--!strict
-- Configuración de Snow Plow Simulator: zonas, nieve, mejoras, compañeros de nieve, premios, calendario de
-- Adviento y los identificadores de la tienda.
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
	cost: number, -- monedas para abrir la zona (la primera es gratis)
	minRebirths: number, -- renacimientos necesarios para abrirla
	value: number, -- monedas que vale cada unidad de nieve de esta zona
	piles: number, -- montones de nieve
	seed: number, -- semilla del reparto de montones (siempre el mismo pueblo)
	ground: { number },
}

export type UpgradeDef = {
	id: string,
	icon: string,
	baseCost: number,
	growth: number,
	maxLevel: number,
}

export type RarityDef = {
	id: string,
	icon: string,
	boost: number, -- +x al valor de la nieve (0.25 = +25 %)
	recycle: number, -- monedas al soltarlo
	color: { number },
}

export type SpeciesDef = {
	id: string,
	icon: string,
}

export type EggDef = {
	id: string,
	icon: string,
	zone: number, -- se abre con esta zona
	cost: number,
	weights: { number }, -- peso de cada rareza (probabilidad = peso / suma)
}

local Config = {}

-- IDENTIFICADORES DE LA TIENDA
-- Se crean en create.roblox.com → tu experiencia → Monetization (pases y productos de desarrollador).
-- Pega el número de cada uno en `id`. Con 0 la función queda apagada: el botón no aparece y el servidor la ignora.
Config.GamePasses = {
	{ name = "DoubleSnow", id = 0, icon = "❄️" }, -- Pase "2× nieve": la nieve vale el doble.
	{ name = "BigBackpack", id = 0, icon = "🎒" }, -- Pase "Mochila grande": el doble de capacidad.
	{ name = "AutoCollect", id = 0, icon = "🧲" }, -- Pase "Imán": recoge los montones de alrededor sin la pala.
} :: { ShopItem }

Config.Products = {
	{ name = "SnowStorm", id = 0, icon = "🌨️" }, -- Producto "Tormenta": la nieve de tu servidor sale 3× más rápido.
	{ name = "CoinPack", id = 0, icon = "🪙" }, -- Producto "Bolsa de monedas": monedas al instante.
	{ name = "LuckyEgg", id = 0, icon = "🍀" }, -- Producto "Huevo de la suerte": un compañero Raro o mejor.
} :: { ShopItem }

-- SERVIDOR
Config.MaxPlayers = 12 -- Debe coincidir con el tamaño de servidor puesto en el panel web.

-- MUNDO: las zonas van una detrás de otra por el eje Z, cada una de `zoneLength` studs, con una puerta de hielo
-- entre ellas. Todas miden lo mismo de ancho (x de -zoneWidth/2 a +zoneWidth/2).
Config.World = {
	zoneWidth = 160,
	zoneLength = 200,
	margin = 8, -- los montones no salen a menos de esto de los bordes
	depotRadius = 14, -- radio del depósito: dentro, se descarga la nieve
	depotInsetX = 22, -- distancia del depósito al borde izquierdo de la zona
	depotInsetZ = 26, -- distancia del depósito a la entrada de la zona
	centerRadius = 14, -- hueco en el centro de cada zona para su adorno (árbol, estanque...)
	spawnZ = 12,
}

-- ZONAS, de la primera a la última. La nieve de cada zona vale más.
Config.Zones = {
	{
		id = "Town",
		icon = "🏘️",
		cost = 0,
		minRebirths = 0,
		value = 1,
		piles = 70,
		seed = 1201,
		ground = { 236, 244, 252 },
	},
	{
		id = "Park",
		icon = "🌲",
		cost = 2500,
		minRebirths = 0,
		value = 4,
		piles = 70,
		seed = 1202,
		ground = { 226, 240, 246 },
	},
	{
		id = "SkiVillage",
		icon = "⛷️",
		cost = 60000,
		minRebirths = 0,
		value = 15,
		piles = 70,
		seed = 1203,
		ground = { 240, 244, 255 },
	},
	{
		id = "NorthPole",
		icon = "🎅",
		cost = 900000,
		minRebirths = 1,
		value = 60,
		piles = 70,
		seed = 1225,
		ground = { 250, 246, 252 },
	},
} :: { ZoneDef }

-- NIEVE
Config.Snow = {
	minSize = 1, -- tamaño de un montón = unidades de nieve que da
	maxSize = 4,
	minSpacing = 9, -- separación mínima entre montones (studs)
	maxTries = 30, -- intentos por montón para encontrar un hueco
	respawnSeconds = 18, -- lo que tarda un montón en volver a salir
	tickSeconds = 0.1, -- cada cuánto mira el servidor la pala de cada jugador
}

-- QUITANIEVES: la pala va delante del jugador. Valores base y cuánto suma cada nivel de mejora.
Config.Plow = {
	baseBlade = 4, -- ancho de la pala (studs)
	bladePerLevel = 1,
	bladeDepth = 2.5, -- fondo de la zona que barre la pala
	bladeForward = 3.6, -- distancia de la pala por delante del jugador
	baseCapacity = 20, -- unidades de nieve
	capacityGrowth = 1.5, -- ×1,5 por nivel
	bigBackpackMultiplier = 2,
	baseSpeed = 16,
	speedPerLevel = 1.5,
	autoUnloadBase = 0.5, -- descarga automática al llenarse: 50 % del valor en el nivel 1...
	autoUnloadPerLevel = 0.1, -- ...+10 % por nivel
	doubleSnowMultiplier = 2,
	magnetRadius = 10, -- pase Imán: recoge montones a esta distancia, en cualquier dirección
}

-- MEJORAS: precio del nivel n (de 0 a max-1) = baseCost · growth^n
Config.Upgrades = {
	{ id = "Blade", icon = "📏", baseCost = 40, growth = 1.8, maxLevel = 10 },
	{ id = "Capacity", icon = "🎒", baseCost = 30, growth = 1.7, maxLevel = 12 },
	{ id = "Speed", icon = "👟", baseCost = 60, growth = 1.9, maxLevel = 8 },
	{ id = "AutoUnload", icon = "🚚", baseCost = 1500, growth = 3, maxLevel = 5 },
} :: { UpgradeDef }

-- COMPAÑEROS DE NIEVE: salen de huevos (con monedas) y suben el valor de la nieve. Se llevan hasta 3.
Config.BuddyRarities = {
	{ id = "Common", icon = "⚪", boost = 0.1, recycle = 20, color = { 236, 244, 252 } },
	{ id = "Uncommon", icon = "🟢", boost = 0.25, recycle = 150, color = { 120, 224, 160 } },
	{ id = "Rare", icon = "🔵", boost = 0.5, recycle = 1500, color = { 92, 184, 255 } },
	{ id = "Epic", icon = "🟣", boost = 1, recycle = 15000, color = { 196, 140, 255 } },
	{ id = "Legendary", icon = "🟡", boost = 2.5, recycle = 150000, color = { 255, 201, 77 } },
} :: { RarityDef }

Config.BuddySpecies = {
	{ id = "Snowman", icon = "⛄" },
	{ id = "Penguin", icon = "🐧" },
	{ id = "Owl", icon = "🦉" },
	{ id = "Fox", icon = "🦊" },
	{ id = "Reindeer", icon = "🦌" },
	{ id = "Bear", icon = "🐻" },
} :: { SpeciesDef }

Config.Eggs = {
	{ id = "TownEgg", icon = "🥚", zone = 1, cost = 300, weights = { 700, 240, 55, 5, 0 } },
	{ id = "ParkEgg", icon = "🥚", zone = 2, cost = 5000, weights = { 500, 330, 140, 28, 2 } },
	{ id = "SkiEgg", icon = "🥚", zone = 3, cost = 90000, weights = { 300, 380, 240, 70, 10 } },
	{ id = "PoleEgg", icon = "🥚", zone = 4, cost = 1500000, weights = { 120, 330, 350, 160, 40 } },
} :: { EggDef }

Config.Buddies = {
	maxEquipped = 3,
	maxOwned = 60,
	maxBoost = 6, -- tope de la suma de los equipados: como mucho +600 %
}

-- PREMIO DIARIO: racha de 1 a 7 días (al 8.º vuelve a empezar). premio = base · racha (+ bonus el día 7)
Config.Daily = {
	baseReward = 150,
	maxStreak = 7,
	weekBonus = 1500,
}

-- CALENDARIO DE ADVIENTO: del 1 al 25 de diciembre (UTC), un regalo al día; solo el regalo de hoy.
-- Monedas = baseCoins · día · multiplicador de renacer; algunos días, un compañero de la rareza indicada.
Config.Advent = {
	month = 12,
	lastDay = 25,
	baseCoins = 250,
	buddyDays = { [6] = 3, [12] = 3, [18] = 4, [24] = 4, [25] = 5 } :: { [number]: number },
	christmasSpecies = "Snowman", -- el regalo del día 25
}

-- RENACER: vuelves a empezar (monedas, mejoras y zonas) con un multiplicador permanente; los compañeros se quedan.
Config.Rebirth = {
	baseCost = 250000,
	growth = 3,
	maxRebirths = 50,
	perRebirth = 0.5, -- multiplicador = 1 + renacimientos · 0,5
	startCoins = 0,
}

-- PRODUCTOS
Config.SnowStorm = {
	duration = 600, -- segundos
	respawnFactor = 3, -- la nieve vuelve a salir 3× más rápido
}

Config.CoinPack = {
	baseCoins = 2000,
	zoneScale = 12, -- ×12 por cada zona abierta después de la primera
}

Config.LuckyEgg = {
	minRarity = 3, -- Raro o mejor
}

-- GUARDADO (DataStoreService)
Config.Save = {
	storeName = "SnowPlow_v1",
	autosaveInterval = 120,
	lockExpiry = 420, -- un bloqueo de sesión más viejo que esto se considera abandonado (servidor caído)
	loadAttempts = 6,
	loadRetryDelay = 4,
	saveAttempts = 4,
	maxReceipts = 100,
}

-- PETICIONES DEL CLIENTE: cubo de fichas por jugador.
Config.RateLimit = {
	perSecond = 5,
	burst = 10,
}

-- ANTITRAMPAS: si el jugador se mueve más de lo posible entre dos vistazos, ese vistazo no recoge nada.
Config.AntiCheat = {
	speedSlack = 1.6,
	extraStuds = 4,
}

return Config
