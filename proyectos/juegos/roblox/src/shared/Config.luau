--!strict
-- Configuración de Egg Truck Tycoon: precios, curvas, física y los identificadores de la tienda.
-- Solo datos planos (números y textos) para que Lune pueda cargar este módulo en las pruebas.

export type UpgradeId = "FarmSpeed" | "Suspension" | "BedWalls" | "Capacity" | "Luck"

export type UpgradeDef = {
	id: UpgradeId,
	icon: string,
	baseCost: number,
	growth: number,
	maxLevel: number,
}

-- Huevo raro: `chance` es la probabilidad base de cada huevo que pone un gallinero; `value` multiplica lo que paga.
-- `rgb` y `material` le dan su aspecto en la caja ("Foil" metálico, "Neon" brillante); `sparkle` añade destellos.
export type RarityDef = {
	id: string,
	icon: string,
	chance: number,
	value: number,
	rgb: { number },
	material: "Plastic" | "Foil" | "Neon",
	sparkle: boolean,
}

export type PaintMaterial = "Plastic" | "Metal" | "Neon"

-- Pintura del camión: se compra con monedas (`cost`) o, si `event` es verdadero, solo se gana en el evento.
export type PaintDef = {
	id: string,
	icon: string,
	rgb: { number },
	material: PaintMaterial,
	cost: number,
	event: boolean,
}

local Config = {}

-- IDENTIFICADORES DE LA TIENDA
-- Se crean en create.roblox.com → tu experiencia → Monetización (pases y productos de desarrollador).
-- Pega aquí el número de cada uno. Con 0 la función queda apagada: el botón no aparece y el servidor la ignora.
Config.GamePasses = {
	DoubleCash = 0, -- Pase "2× dinero": duplica lo que paga cada entrega.
	BigTruck = 0, -- Pase "Camión grande": caja más larga y más huevos por viaje.
	SecondFarm = 0, -- Pase "Segunda granja": tres gallineros más en tu parcela.
}

Config.Products = {
	GoldenEgg = 0, -- Producto "Huevo de oro": monedas al instante (ver Config.GoldenEgg).
	InstantRepair = 0, -- Producto "Reparación instantánea": endereza el camión y repone los huevos rotos del viaje.
}

Config.PassIcons = {
	DoubleCash = "💰",
	BigTruck = "🚛",
	SecondFarm = "🐔",
}

Config.ProductIcons = {
	GoldenEgg = "🌟",
	InstantRepair = "🔧",
}

-- SERVIDOR Y PARCELAS
Config.MaxPlayers = 12 -- Debe coincidir con el tamaño de servidor puesto en el panel web.

-- MEJORAS: coste(nivel) = baseCost · growth^nivel (redondeado). 10 niveles por mejora.
Config.UpgradeOrder = { "FarmSpeed", "Suspension", "BedWalls", "Capacity", "Luck" } :: { UpgradeId }

Config.Upgrades = {
	FarmSpeed = { id = "FarmSpeed", icon = "🐔", baseCost = 30, growth = 1.6, maxLevel = 10 } :: UpgradeDef,
	Suspension = { id = "Suspension", icon = "🛞", baseCost = 50, growth = 1.7, maxLevel = 10 } :: UpgradeDef,
	BedWalls = { id = "BedWalls", icon = "🧱", baseCost = 40, growth = 1.65, maxLevel = 10 } :: UpgradeDef,
	Capacity = { id = "Capacity", icon = "📦", baseCost = 60, growth = 1.75, maxLevel = 10 } :: UpgradeDef,
	Luck = { id = "Luck", icon = "🍀", baseCost = 80, growth = 1.7, maxLevel = 10 } :: UpgradeDef,
}

-- HUEVOS RAROS: al poner un huevo, el servidor tira el dado una vez por huevo (Economy.rollRarity).
-- Probabilidad final de cada rareza = chance · multiplicador, con
-- multiplicador = (1 + luckPerLevel · nivel de 🍀) · passMultiplier (pase 2×) · boostMultiplier (🌟 activo)
--                 · eventMultiplier (fin de semana), sin pasar de maxMultiplier. La suma de todas las rarezas nunca
-- pasa de maxRareShare (se reparten en proporción).
Config.RarityTiers = {
	{
		id = "Silver",
		icon = "🥈",
		chance = 0.06,
		value = 3,
		rgb = { 205, 214, 224 },
		material = "Foil",
		sparkle = false,
	},
	{
		id = "Golden",
		icon = "🥇",
		chance = 0.015,
		value = 8,
		rgb = { 255, 196, 41 },
		material = "Foil",
		sparkle = true,
	},
	{
		id = "Rainbow",
		icon = "🌈",
		chance = 0.003,
		value = 25,
		rgb = { 255, 92, 205 },
		material = "Neon",
		sparkle = true,
	},
} :: { RarityDef }

Config.Rarity = {
	luckPerLevel = 0.12, -- nivel 10 de 🍀 = ×2,2
	passMultiplier = 1.25, -- con el pase 2× dinero
	boostMultiplier = 2, -- durante el impulso del producto Huevo de oro (Config.GoldenEgg.luckSeconds)
	eventMultiplier = 1.5, -- durante el evento de fin de semana
	maxMultiplier = 6,
	maxRareShare = 0.5,
}

-- GRANJA: cada gallinero pone un huevo cada `interval` segundos; interval = max(min, base · factor^nivel).
Config.Farm = {
	baseInterval = 8,
	intervalFactor = 0.85,
	minInterval = 1.5,
	collectorsBase = 3,
	collectorsSecondFarm = 3,
	storagePerCollector = 6,
}

-- CAMIÓN
Config.Truck = {
	baseCapacity = 6,
	capacityPerLevel = 2,
	bigTruckBonus = 6,
	baseWallHeight = 0.8, -- studs
	wallPerLevel = 0.35,
	baseDampingRatio = 0.35, -- amortiguación relativa de la suspensión (0..1)
	dampingPerLevel = 0.055,
	maxDampingRatio = 0.9,
	baseTravel = 1.0, -- recorrido de la suspensión (studs)
	travelPerLevel = 0.08,
	wheelRadius = 1.5,
	maxWheelSpeed = 30, -- rad/s ≈ 45 studs/s con radio 1,5
	motorTorque = 20000,
	motorAcceleration = 25, -- rad/s²: arranques suaves, que la carga es frágil
	coastTorque = 1500, -- par cuando no aceleras: rueda libre, el camión no frena en seco
	steerAngle = 26, -- grados
	-- Signos del motor y la dirección. Si al publicar el camión va hacia atrás o gira al revés, cambia el signo.
	driveSign = -1,
	steerSign = -1,
}

-- HUEVOS: se rompen si chocan a más de `breakSpeed` studs/s o si tocan el suelo o la pista.
Config.Egg = {
	baseBreakSpeed = 16,
	breakSpeedPerSuspension = 1.2,
	spawnGrace = 1.0, -- segundos en los que un huevo recién cargado no se rompe
	density = 0.4,
	sizeX = 0.9,
	sizeY = 1.2,
	sizeZ = 0.9,
}

-- PAGO: huevos · perEgg · (1 + distancia/100 · distanceBonusPer100) · (1 + fullLoadBonus si va lleno) · multiplicador
Config.Payout = {
	perEgg = 6,
	distanceBonusPer100 = 0.05,
	fullLoadBonus = 0.25,
	doubleCashMultiplier = 2,
	minTripFactor = 0.6, -- un viaje más rápido que esto · (longitud / velocidad máxima) no cobra (anti-trampas)
}

Config.GoldenEgg = {
	minCoins = 500,
	bestMultiplier = 3, -- o 3 veces tu mejor entrega, lo que sea mayor
	luckSeconds = 600, -- y además 10 minutos de huevos raros más probables (Config.Rarity.boostMultiplier)
}

-- RECOMPENSA DIARIA: al entrar, si cambió el día UTC desde la última. Racha de días seguidos (1..#rewards, luego se
-- queda en el máximo); saltarse un día la devuelve a 1.
-- Monedas = max(rewards[racha], mejor entrega · bestFactor · racha).
Config.Daily = {
	rewards = { 50, 80, 120, 170, 230, 300, 400 },
	bestFactor = 0.25,
}

-- EVENTO DE FIN DE SEMANA (viernes 00:00 a lunes 00:00 UTC, Economy.isEventActive): entregar `eggsGoal` huevos
-- durante el evento da la pintura limitada `paint` para siempre. El progreso vuelve a 0 cada fin de semana.
-- Además, huevos raros ×Config.Rarity.eventMultiplier.
Config.Event = {
	eggsGoal = 150,
	paint = "Festive",
}

-- PINTURAS DEL CAMIÓN (capó, cabina y caja). La primera es la de serie y siempre es tuya.
Config.DefaultPaint = "Red"
Config.PaintOrder = { "Red", "Sky", "Grass", "Ink", "Gold", "Festive" } :: { string }

Config.Paints = {
	Red = { id = "Red", icon = "🟥", rgb = { 229, 75, 75 }, material = "Plastic", cost = 0, event = false },
	Sky = { id = "Sky", icon = "🟦", rgb = { 79, 179, 255 }, material = "Plastic", cost = 600, event = false },
	Grass = { id = "Grass", icon = "🟩", rgb = { 88, 194, 106 }, material = "Plastic", cost = 600, event = false },
	Ink = { id = "Ink", icon = "⬛", rgb = { 30, 42, 58 }, material = "Metal", cost = 2500, event = false },
	Gold = { id = "Gold", icon = "🟨", rgb = { 255, 201, 77 }, material = "Metal", cost = 12000, event = false },
	Festive = { id = "Festive", icon = "🎉", rgb = { 186, 85, 255 }, material = "Neon", cost = 0, event = true },
} :: { [string]: PaintDef }

-- PISTA (studs). Mismas reglas de tramos que egg-truck/src/terrain.ts: llano, colina, baches y rampa.
Config.Track = {
	length = 900,
	step = 6,
	minHeight = 0,
	maxHeight = 34,
	startFlat = 50,
	endFlat = 36,
	laneWidth = 22,
	railHeight = 3,
	thickness = 2,
	marketLength = 40,
}

-- CARRERA DE HUEVOS: cada `interval` segundos, durante `duration`, gana quien más huevos entrega.
Config.Race = {
	interval = 600,
	duration = 180,
	bonusBase = 250,
	bonusPerEgg = 10,
}

-- GUARDADO (DataStoreService)
Config.Save = {
	storeName = "EggTruckTycoon_v1",
	autosaveInterval = 120,
	lockExpiry = 420, -- un bloqueo de sesión más viejo que esto se considera abandonado (servidor caído)
	loadAttempts = 6,
	loadRetryDelay = 4,
	saveAttempts = 4,
	maxReceipts = 100,
}

-- PETICIONES DEL CLIENTE: cubo de fichas por jugador y tipo de petición.
Config.RateLimit = {
	perSecond = 3,
	burst = 6,
}

return Config
