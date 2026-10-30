--!strict
-- Guardado con DataStoreService.
-- * Bloqueo de sesión dentro del propio registro (UpdateAsync): un jugador que salta de servidor no puede tener
--   dos copias vivas de sus datos. Un bloqueo más viejo que Config.Save.lockExpiry se considera abandonado.
-- * Reintentos con espera creciente y respeto del presupuesto de peticiones.
-- * Guardado automático, al salir y al cerrar el servidor (BindToClose desde Main).
-- * commitPurchase: registra el PurchaseId en el DataStore en la misma escritura que concede la compra.
-- * Versión 2 del registro: recompensa diaria (día y racha), pinturas (compradas y puesta), progreso del evento de
--   fin de semana e impulso de huevos raros. reconcile() rellena con valores por defecto lo que falte en registros
--   de la versión 1, así los perfiles existentes se migran solos al cargarlos.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)

export type PlayerData = {
	coins: number,
	best: number,
	delivered: number,
	upgrades: { [string]: number },
	receipts: { [string]: number }, -- PurchaseId → os.time() de la concesión
	dailyDay: number, -- día UTC (Economy.utcDay) del último cobro de la recompensa diaria; 0 = nunca
	streak: number, -- días seguidos cobrando (1..#Config.Daily.rewards)
	paints: { [string]: boolean }, -- pinturas del camión que son tuyas
	paint: string, -- pintura puesta
	eventWeek: number, -- semana (Economy.eventWeek) del progreso del evento
	eventEggs: number, -- huevos entregados durante el evento de esa semana
	luckUntil: number, -- os.time() hasta el que dura el impulso de huevos raros del Huevo de oro
}

export type Session = {
	player: Player,
	key: string,
	data: PlayerData,
	canSave: boolean,
	busy: boolean,
	released: boolean,
	coinsValue: IntValue,
	bestValue: IntValue,
}

export type CommitResult = "granted" | "already" | "failed"

local RECORD_VERSION = 2

local DataService = {}

local store: DataStore? = nil
local storeOk, storeErr = pcall(function()
	store = DataStoreService:GetDataStore(Config.Save.storeName)
end)
if not storeOk then
	warn("[DataService] DataStore no disponible:", storeErr)
end

local sessions: { [Player]: Session } = {}

local function defaultData(): PlayerData
	local upgrades: { [string]: number } = {}
	for _, id in Config.UpgradeOrder do
		upgrades[id] = 0
	end
	return {
		coins = 0,
		best = 0,
		delivered = 0,
		upgrades = upgrades,
		receipts = {},
		dailyDay = 0,
		streak = 0,
		paints = { [Config.DefaultPaint] = true },
		paint = Config.DefaultPaint,
		eventWeek = 0,
		eventEggs = 0,
		luckUntil = 0,
	}
end

local function toNumber(value: any, fallback: number): number
	local n = tonumber(value)
	if n ~= nil and n == n and n ~= math.huge and n ~= -math.huge then
		return n
	end
	return fallback
end

-- Acepta cualquier cosa leída del DataStore y devuelve datos válidos (campos nuevos con su valor por defecto).
local function reconcile(raw: any): PlayerData
	local data = defaultData()
	if type(raw) ~= "table" then
		return data
	end
	data.coins = math.max(0, math.floor(toNumber(raw.coins, 0)))
	data.best = math.max(0, math.floor(toNumber(raw.best, 0)))
	data.delivered = math.max(0, math.floor(toNumber(raw.delivered, 0)))
	if type(raw.upgrades) == "table" then
		for _, id in Config.UpgradeOrder do
			local def = Config.Upgrades[id]
			data.upgrades[id] = math.clamp(math.floor(toNumber(raw.upgrades[id], 0)), 0, def.maxLevel)
		end
	end
	if type(raw.receipts) == "table" then
		for purchaseId, at in raw.receipts do
			if type(purchaseId) == "string" then
				data.receipts[purchaseId] = toNumber(at, 0)
			end
		end
	end
	-- versión 2 (los registros de la versión 1 no traen estos campos y se quedan con el valor por defecto)
	data.dailyDay = math.max(0, math.floor(toNumber(raw.dailyDay, 0)))
	data.streak = math.clamp(math.floor(toNumber(raw.streak, 0)), 0, #Config.Daily.rewards)
	if type(raw.paints) == "table" then
		for _, id in Config.PaintOrder do
			if raw.paints[id] == true then
				data.paints[id] = true
			end
		end
	end
	if type(raw.paint) == "string" and data.paints[raw.paint] == true then
		data.paint = raw.paint
	end
	data.eventWeek = math.max(0, math.floor(toNumber(raw.eventWeek, 0)))
	data.eventEggs = math.max(0, math.floor(toNumber(raw.eventEggs, 0)))
	data.luckUntil = math.max(0, toNumber(raw.luckUntil, 0))
	return data
end

local function copyData(data: PlayerData): PlayerData
	return {
		coins = data.coins,
		best = data.best,
		delivered = data.delivered,
		upgrades = table.clone(data.upgrades),
		receipts = table.clone(data.receipts),
		dailyDay = data.dailyDay,
		streak = data.streak,
		paints = table.clone(data.paints),
		paint = data.paint,
		eventWeek = data.eventWeek,
		eventEggs = data.eventEggs,
		luckUntil = data.luckUntil,
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
	session.bestValue.Value = math.floor(data.best)
	local player = session.player
	player:SetAttribute("Coins", math.floor(data.coins))
	player:SetAttribute("Best", math.floor(data.best))
	for _, id in Config.UpgradeOrder do
		player:SetAttribute("Lvl_" .. id, data.upgrades[id] or 0)
	end
	for _, id in Config.PaintOrder do
		player:SetAttribute("Paint_" .. id, data.paints[id] == true)
	end
	player:SetAttribute("PaintEquipped", data.paint)
	player:SetAttribute("Streak", data.streak)
	player:SetAttribute("LuckUntil", data.luckUntil)
	player:SetAttribute("EventWeek", data.eventWeek)
	player:SetAttribute("EventEggs", data.eventEggs)
end

-- Escribe los datos de la sesión en `activeStore`, con reintentos. Debe llamarse con session.busy tomado.
local function writeTo(activeStore: DataStore, session: Session, release: boolean): boolean
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
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local coinsValue = Instance.new("IntValue")
	coinsValue.Name = "Coins"
	coinsValue.Parent = leaderstats
	local bestValue = Instance.new("IntValue")
	bestValue.Name = "Best"
	bestValue.Parent = leaderstats
	leaderstats.Parent = player

	local session: Session = {
		player = player,
		key = "u_" .. player.UserId,
		data = data,
		canSave = canSave,
		busy = false,
		released = false,
		coinsValue = coinsValue,
		bestValue = bestValue,
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
					return { v = RECORD_VERSION, data = data, lock = { jobId = game.JobId, time = now } }
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

function DataService.recordDelivery(player: Player, eggs: number, coins: number)
	local session = DataService.get(player)
	if session then
		session.data.delivered += eggs
		if coins > session.data.best then
			session.data.best = coins
		end
		refresh(session)
	end
end

function DataService.getLevel(player: Player, id: string): number
	local session = DataService.get(player)
	if session then
		return session.data.upgrades[id] or 0
	end
	return 0
end

function DataService.setLevel(player: Player, id: string, level: number)
	local session = DataService.get(player)
	if session then
		session.data.upgrades[id] = level
		refresh(session)
	end
end

-- PINTURAS

function DataService.getPaint(player: Player): string
	local session = DataService.get(player)
	if session then
		return session.data.paint
	end
	return Config.DefaultPaint
end

function DataService.ownsPaint(player: Player, id: string): boolean
	local session = DataService.get(player)
	return session ~= nil and session.data.paints[id] == true
end

-- Da la pintura `id` (ya validada) al jugador. Devuelve si es nueva.
function DataService.grantPaint(player: Player, id: string): boolean
	local session = DataService.get(player)
	if session and session.data.paints[id] ~= true then
		session.data.paints[id] = true
		refresh(session)
		return true
	end
	return false
end

-- Se pone la pintura `id` si es suya.
function DataService.setPaint(player: Player, id: string): boolean
	local session = DataService.get(player)
	if session and session.data.paints[id] == true then
		session.data.paint = id
		refresh(session)
		return true
	end
	return false
end

-- EVENTO E IMPULSO DE HUEVOS RAROS

-- Suma `eggs` al progreso del evento de la semana `week`. Devuelve (huevos de esta semana, ¿meta alcanzada ahora?).
function DataService.addEventEggs(player: Player, week: number, eggs: number, goal: number): (number, boolean)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local total, reached = Economy.eventProgress(data.eventWeek, data.eventEggs, week, eggs, goal)
		data.eventWeek = week
		data.eventEggs = total
		refresh(session)
		return total, reached
	end
	return 0, false
end

function DataService.getLuckUntil(player: Player): number
	local session = DataService.get(player)
	if session then
		return session.data.luckUntil
	end
	return 0
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

-- Recompensa diaria: si cambió el día UTC desde el último cobro, suma las monedas de la racha y guarda enseguida.
-- Devuelve (monedas, racha); 0 monedas si hoy ya se cobró o si no se puede guardar (DataStore caído: no se regala
-- nada que luego no quede guardado).
function DataService.claimDaily(player: Player, now: number): (number, number)
	local session = DataService.get(player)
	if session and session.canSave then
		local data = session.data
		local today = Economy.utcDay(now)
		local canClaim, streak = Economy.dailyStreak(data.dailyDay, data.streak, today, #Config.Daily.rewards)
		if canClaim then
			local coins = Economy.dailyCoins(streak, data.best, Config.Daily)
			data.dailyDay = today
			data.streak = streak
			data.coins += coins
			refresh(session)
			task.spawn(DataService.save, player)
			return coins, streak
		end
		return 0, data.streak
	end
	return 0, 0
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
	if not session or session.released then
		return
	end
	acquire(session)
	session.released = true
	writeLocked(session, true)
	session.busy = false
	sessions[player] = nil
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
