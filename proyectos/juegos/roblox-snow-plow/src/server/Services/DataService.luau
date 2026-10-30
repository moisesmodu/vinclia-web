--!strict
-- Guardado con DataStoreService (adaptado de Jelly Pets).
-- * Bloqueo de sesión dentro del propio registro (UpdateAsync): un jugador que salta de servidor no puede tener
--   dos copias vivas de sus datos (ni duplicar monedas o compañeros). Un bloqueo más viejo que
--   Config.Save.lockExpiry se considera abandonado.
-- * Reintentos con espera creciente y respeto del presupuesto de peticiones.
-- * Guardado automático, al salir y al cerrar el servidor (BindToClose desde Main).
-- * commitPurchase: registra el PurchaseId en el DataStore en la misma escritura que concede la compra.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Buddies = require(ReplicatedStorage.Shared.Buddies)
local Config = require(ReplicatedStorage.Shared.Config)

export type PlayerData = {
	coins: number,
	rebirths: number,
	upgrades: { [string]: number }, -- id de la mejora → nivel
	zones: number, -- zonas abiertas (de la 1 a esta)
	buddies: { Buddies.SavedBuddy },
	equipped: { string }, -- ids de los compañeros equipados
	nextId: number,
	dailyDay: number, -- último día (UTC) en que se reclamó el premio diario
	dailyStreak: number,
	adventYear: number, -- año del calendario de Adviento guardado
	adventClaimed: { number }, -- casillas abiertas ese año
	snow: number, -- unidades de nieve en la mochila
	snowValue: number, -- lo que valen (en monedas, antes del multiplicador de renacer)
	totalSnow: number, -- nieve quitada en total (marcador)
	lastOnline: number, -- os.time() del último guardado
	receipts: { [string]: number }, -- PurchaseId → os.time() de la concesión
}

export type Session = {
	player: Player,
	key: string,
	data: PlayerData,
	canSave: boolean,
	busy: boolean,
	released: boolean,
	coinsValue: IntValue,
	snowStat: IntValue,
}

export type CommitResult = "granted" | "already" | "failed"

local RECORD_VERSION = 1

local DataService = {}

local store: DataStore? = nil
local storeOk, storeErr = pcall(function()
	store = DataStoreService:GetDataStore(Config.Save.storeName)
end)
if not storeOk then
	warn("[DataService] DataStore no disponible:", storeErr)
end

local sessions: { [Player]: Session } = {}

local speciesIds: { [string]: boolean } = {}
for _, def in Config.BuddySpecies do
	speciesIds[def.id] = true
end

local function defaultUpgrades(): { [string]: number }
	local upgrades: { [string]: number } = {}
	for _, def in Config.Upgrades do
		upgrades[def.id] = 0
	end
	return upgrades
end

function DataService.defaultUpgrades(): { [string]: number }
	return defaultUpgrades()
end

local function defaultData(): PlayerData
	return {
		coins = Config.Rebirth.startCoins,
		rebirths = 0,
		upgrades = defaultUpgrades(),
		zones = 1,
		buddies = {},
		equipped = {},
		nextId = 1,
		dailyDay = 0,
		dailyStreak = 0,
		adventYear = 0,
		adventClaimed = {},
		snow = 0,
		snowValue = 0,
		totalSnow = 0,
		lastOnline = 0,
		receipts = {},
	}
end

local function toNumber(value: any, fallback: number): number
	local n = tonumber(value)
	if n ~= nil and n == n and n ~= math.huge and n ~= -math.huge then
		return n
	end
	return fallback
end

local function toInt(value: any, fallback: number, low: number, high: number): number
	return math.clamp(math.floor(toNumber(value, fallback)), low, high)
end

-- Compañeros leídos del DataStore: especie y rareza válidas, ids únicos, como mucho maxOwned.
local function reconcileBuddies(raw: any, data: PlayerData)
	if type(raw) ~= "table" then
		return
	end
	local usedIds: { [string]: boolean } = {}
	for _, item in raw do
		if #data.buddies >= Config.Buddies.maxOwned then
			break
		end
		if type(item) == "table" and type(item.s) == "string" and speciesIds[item.s] then
			local rarity = toInt(item.r, 1, 1, #Config.BuddyRarities)
			local id = if type(item.id) == "string" and #item.id <= 16 then item.id else ""
			if id == "" or usedIds[id] then
				id = "b" .. data.nextId
				data.nextId += 1
			end
			usedIds[id] = true
			table.insert(data.buddies, { id = id, s = item.s, r = rarity })
		end
	end
end

local function reconcileUpgrades(raw: any, data: PlayerData)
	if type(raw) == "table" then
		for _, def in Config.Upgrades do
			data.upgrades[def.id] = toInt(raw[def.id], 0, 0, def.maxLevel)
		end
	end
end

local function reconcileEquipped(raw: any, data: PlayerData)
	local ids: { string } = {}
	if type(raw) == "table" then
		for _, id in raw do
			if type(id) == "string" then
				table.insert(ids, id)
			end
		end
	end
	data.equipped = Buddies.sanitize(data.buddies, ids, Config.Buddies.maxEquipped)
end

local function reconcileAdvent(raw: any, data: PlayerData)
	if type(raw) == "table" then
		for _, day in raw do
			local d = tonumber(day)
			if d and d == math.floor(d) and d >= 1 and d <= 31 and table.find(data.adventClaimed, d) == nil then
				table.insert(data.adventClaimed, d)
			end
		end
	end
end

-- Acepta cualquier cosa leída del DataStore y devuelve datos válidos (campos nuevos con su valor por defecto).
local function reconcile(raw: any): PlayerData
	local data = defaultData()
	if type(raw) ~= "table" then
		return data
	end
	data.coins = math.max(0, math.floor(toNumber(raw.coins, data.coins)))
	data.rebirths = toInt(raw.rebirths, 0, 0, Config.Rebirth.maxRebirths)
	data.zones = toInt(raw.zones, 1, 1, #Config.Zones)
	data.nextId = math.max(1, math.floor(toNumber(raw.nextId, 1)))
	data.dailyDay = math.max(0, math.floor(toNumber(raw.dailyDay, 0)))
	data.dailyStreak = toInt(raw.dailyStreak, 0, 0, Config.Daily.maxStreak)
	data.adventYear = toInt(raw.adventYear, 0, 0, 9999)
	data.snow = math.max(0, math.floor(toNumber(raw.snow, 0)))
	data.snowValue = math.max(0, toNumber(raw.snowValue, 0))
	data.totalSnow = math.max(0, math.floor(toNumber(raw.totalSnow, 0)))
	data.lastOnline = math.max(0, toNumber(raw.lastOnline, 0))
	reconcileUpgrades(raw.upgrades, data)
	reconcileBuddies(raw.buddies, data)
	reconcileEquipped(raw.equipped, data)
	reconcileAdvent(raw.adventClaimed, data)
	if type(raw.receipts) == "table" then
		for purchaseId, at in raw.receipts do
			if type(purchaseId) == "string" then
				data.receipts[purchaseId] = toNumber(at, 0)
			end
		end
	end
	return data
end

local function copyData(data: PlayerData): PlayerData
	local buddies: { Buddies.SavedBuddy } = {}
	for _, buddy in data.buddies do
		table.insert(buddies, { id = buddy.id, s = buddy.s, r = buddy.r })
	end
	return {
		coins = data.coins,
		rebirths = data.rebirths,
		upgrades = table.clone(data.upgrades),
		zones = data.zones,
		buddies = buddies,
		equipped = table.clone(data.equipped),
		nextId = data.nextId,
		dailyDay = data.dailyDay,
		dailyStreak = data.dailyStreak,
		adventYear = data.adventYear,
		adventClaimed = table.clone(data.adventClaimed),
		snow = data.snow,
		snowValue = data.snowValue,
		totalSnow = data.totalSnow,
		lastOnline = data.lastOnline,
		receipts = table.clone(data.receipts),
	}
end

local function pruneReceipts(data: PlayerData)
	local list: { { id: string, at: number } } = {}
	for id, at in data.receipts do
		table.insert(list, { id = id, at = at })
	end
	if #list <= Config.Save.maxReceipts then
		return
	end
	table.sort(list, function(a, b)
		return a.at > b.at
	end)
	for i = Config.Save.maxReceipts + 1, #list do
		data.receipts[list[i].id] = nil
	end
end

local function waitForBudget()
	local waited = 0
	while DataStoreService:GetRequestBudgetForRequestType(Enum.DataStoreRequestType.UpdateAsync) < 1 and waited < 30 do
		task.wait(1)
		waited += 1
	end
end

local function isLockedByOther(record: any, now: number): boolean
	if type(record) ~= "table" or type(record.lock) ~= "table" then
		return false
	end
	if record.lock.jobId == game.JobId then
		return false
	end
	return now - toNumber(record.lock.time, 0) < Config.Save.lockExpiry
end

local function acquire(session: Session)
	while session.busy do
		task.wait(0.05)
	end
	session.busy = true
end

local function refresh(session: Session)
	local data = session.data
	session.coinsValue.Value = math.floor(data.coins)
	session.snowStat.Value = math.floor(data.totalSnow)
	local player = session.player
	player:SetAttribute("Coins", math.floor(data.coins))
	player:SetAttribute("Rebirths", data.rebirths)
	player:SetAttribute("Zones", data.zones)
	player:SetAttribute("Snow", math.floor(data.snow))
	player:SetAttribute("SnowValue", math.floor(data.snowValue))
	player:SetAttribute("DailyStreak", data.dailyStreak)
	for id, level in data.upgrades do
		player:SetAttribute("Lvl_" .. id, level)
	end
end

-- Escribe los datos de la sesión en `activeStore`, con reintentos. Debe llamarse con session.busy tomado.
local function writeTo(activeStore: DataStore, session: Session, release: boolean): boolean
	session.data.lastOnline = os.time()
	local snapshot = copyData(session.data)
	for attempt = 1, Config.Save.saveAttempts do
		waitForBudget()
		local stolen = false
		local ok, err = pcall(function()
			activeStore:UpdateAsync(session.key, function(old: any)
				stolen = false
				if type(old) == "table" and type(old.lock) == "table" and old.lock.jobId ~= game.JobId then
					stolen = true
					return nil -- otro servidor tiene la sesión: no pisar sus datos
				end
				local record: { [string]: any } = { v = RECORD_VERSION, data = snapshot }
				if not release then
					record.lock = { jobId = game.JobId, time = os.time() }
				end
				return record
			end)
		end)
		if ok and not stolen then
			return true
		elseif ok and stolen then
			warn("[DataService] la sesión de", session.player.UserId, "la tiene otro servidor; no se guarda")
			session.canSave = false
			return false
		end
		warn("[DataService] fallo al guardar (intento " .. attempt .. "):", err)
		task.wait(2 ^ (attempt - 1))
	end
	return false
end

-- Escribe los datos de la sesión si se puede guardar. Debe llamarse con session.busy tomado.
local function writeLocked(session: Session, release: boolean): boolean
	local activeStore = store
	if session.canSave and activeStore ~= nil then
		return writeTo(activeStore, session, release)
	end
	return false
end

local function createSession(player: Player, data: PlayerData, canSave: boolean): Session
	-- nombres con emoji: la lista de jugadores tampoco lleva texto
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local coinsValue = Instance.new("IntValue")
	coinsValue.Name = "🪙"
	coinsValue.Parent = leaderstats
	local snowStat = Instance.new("IntValue")
	snowStat.Name = "❄️"
	snowStat.Parent = leaderstats
	leaderstats.Parent = player

	local session: Session = {
		player = player,
		key = "u_" .. player.UserId,
		data = data,
		canSave = canSave,
		busy = false,
		released = false,
		coinsValue = coinsValue,
		snowStat = snowStat,
	}
	sessions[player] = session
	refresh(session)
	return session
end

-- Carga (y bloquea) los datos del jugador. Puede tardar varios segundos. nil si el jugador se fue o fue expulsado.
function DataService.load(player: Player): Session?
	local activeStore = store
	local key = "u_" .. player.UserId
	local lockedByOther = false

	if activeStore ~= nil then
		for attempt = 1, Config.Save.loadAttempts do
			waitForBudget()
			local loaded: PlayerData? = nil
			local ok, err = pcall(function()
				activeStore:UpdateAsync(key, function(old: any)
					loaded = nil
					lockedByOther = false
					local now = os.time()
					if isLockedByOther(old, now) then
						lockedByOther = true
						return nil
					end
					local data = reconcile(if type(old) == "table" then old.data else nil)
					loaded = data
					return { v = RECORD_VERSION, data = copyData(data), lock = { jobId = game.JobId, time = now } }
				end)
			end)
			if player.Parent ~= Players then
				-- se fue mientras cargaba: si llegamos a bloquear, se libera
				if ok and loaded then
					createSession(player, loaded, true)
					DataService.release(player)
				end
				return nil
			end
			if ok and loaded then
				return createSession(player, loaded, true)
			end
			if not ok then
				warn("[DataService] fallo al cargar (intento " .. attempt .. "):", err)
			end
			task.wait(Config.Save.loadRetryDelay)
		end
	end

	if lockedByOther then
		player:Kick("Your save is still open on another server. Please rejoin in a minute.")
		return nil
	end
	-- DataStore caído: se juega, pero nada se guarda (y las compras esperan: ProcessReceipt devuelve NotProcessedYet)
	warn("[DataService] jugando sin guardado para", player.UserId)
	player:SetAttribute("SaveWarning", true)
	return createSession(player, defaultData(), false)
end

function DataService.get(player: Player): Session?
	local session = sessions[player]
	if session and not session.released then
		return session
	end
	return nil
end

function DataService.waitFor(player: Player, timeout: number): Session?
	local started = os.clock()
	while os.clock() - started < timeout do
		local session = DataService.get(player)
		if session then
			return session
		end
		if player.Parent ~= Players then
			return nil
		end
		task.wait(0.25)
	end
	return DataService.get(player)
end

-- Vuelve a publicar monedas, nieve, zonas y niveles en los atributos (tras cambiar session.data a mano).
function DataService.touch(player: Player)
	local session = DataService.get(player)
	if session then
		refresh(session)
	end
end

function DataService.addCoins(player: Player, amount: number)
	local session = DataService.get(player)
	if session and amount ~= 0 then
		session.data.coins = math.max(0, math.floor(session.data.coins + amount))
		refresh(session)
	end
end

function DataService.trySpend(player: Player, amount: number): boolean
	local session = DataService.get(player)
	if session and not (amount < 0 or session.data.coins < amount) then
		session.data.coins -= amount
		refresh(session)
		return true
	end
	return false
end

function DataService.save(player: Player): boolean
	local session = DataService.get(player)
	if session then
		acquire(session)
		local ok = writeLocked(session, false)
		session.busy = false
		return ok
	end
	return false
end

local function commitLocked(
	session: Session,
	purchaseId: string,
	mutate: (PlayerData) -> (),
	revert: (PlayerData) -> ()
): CommitResult
	acquire(session)
	if session.released then
		session.busy = false
		return "failed"
	end
	if session.data.receipts[purchaseId] ~= nil then
		session.busy = false
		return "already"
	end
	mutate(session.data)
	session.data.receipts[purchaseId] = os.time()
	pruneReceipts(session.data)
	local ok = writeLocked(session, false)
	if not ok then
		revert(session.data)
		session.data.receipts[purchaseId] = nil
	end
	session.busy = false
	refresh(session)
	return if ok then "granted" else "failed"
end

-- Concede una compra de forma idempotente: si el PurchaseId ya está, no hace nada; si no, aplica `mutate`,
-- guarda el PurchaseId y los datos en una sola escritura y, si la escritura falla, deshace con `revert`.
function DataService.commitPurchase(
	player: Player,
	purchaseId: string,
	mutate: (PlayerData) -> (),
	revert: (PlayerData) -> ()
): CommitResult
	local session = DataService.get(player)
	if session and session.canSave then
		return commitLocked(session, purchaseId, mutate, revert)
	end
	return "failed"
end

-- Guarda y suelta el bloqueo. Se llama al salir el jugador y al cerrar el servidor (dos veces no pasa nada).
function DataService.release(player: Player)
	local session = sessions[player]
	if session and not session.released then
		acquire(session)
		session.released = true
		writeLocked(session, true)
		session.busy = false
		sessions[player] = nil
	end
end

function DataService.releaseAll()
	local pending = 0
	for player in sessions do
		pending += 1
		task.spawn(function()
			DataService.release(player)
			pending -= 1
		end)
	end
	local started = os.clock()
	while pending > 0 and os.clock() - started < 25 do
		task.wait(0.1)
	end
end

function DataService.startAutosave()
	task.spawn(function()
		while true do
			task.wait(Config.Save.autosaveInterval)
			for player in sessions do
				task.spawn(DataService.save, player)
			end
		end
	end)
end

return DataService
