--!strict
-- Guardado con DataStoreService (adaptado de Jelly Pets / Egg Truck Tycoon).
-- * Bloqueo de sesión dentro del propio registro (UpdateAsync): un jugador que salta de servidor no puede tener
--   dos copias vivas de sus datos (ni duplicar monedas o fases). Un bloqueo más viejo que Config.Save.lockExpiry se
--   considera abandonado.
-- * Reintentos con espera creciente y respeto del presupuesto de peticiones.
-- * Guardado automático, al salir y al cerrar el servidor (BindToClose desde Main).
-- * commitPurchase: registra el PurchaseId en el DataStore en la misma escritura que concede la compra.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Checkpoint = require(ReplicatedStorage.Shared.Checkpoint)
local Config = require(ReplicatedStorage.Shared.Config)

export type PlayerData = {
	stage: number, -- checkpoint actual: 1..N (fase) o N + 1 (en la cima)
	best: number, -- checkpoint más alto alcanzado nunca
	completions: number, -- veces que ha llegado a la cima
	restarts: number, -- reinicios de torre (trofeos; dan el multiplicador de monedas)
	coins: number,
	trails: { string }, -- estelas compradas con monedas
	trail: string, -- estela puesta ("" = ninguna)
	dailyDay: number, -- último día (UTC) en que se reclamó el premio diario
	dailyStreak: number,
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
	bestValue: IntValue,
	completionsValue: IntValue,
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

local STAGES = Config.Tower.stages

local trailIds: { [string]: boolean } = {}
local buyableTrails: { [string]: boolean } = {}
for _, def in Config.Trails do
	trailIds[def.id] = true
	if not def.premium then
		buyableTrails[def.id] = true
	end
end

local function defaultData(): PlayerData
	return {
		stage = 1,
		best = 1,
		completions = 0,
		restarts = 0,
		coins = 0,
		trails = {},
		trail = "",
		dailyDay = 0,
		dailyStreak = 0,
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

-- Estelas leídas del DataStore: solo ids conocidos que se compran con monedas, sin repetir.
local function reconcileTrails(raw: any, data: PlayerData)
	if type(raw) ~= "table" then
		return
	end
	local seen: { [string]: boolean } = {}
	for _, id in raw do
		if type(id) == "string" and buyableTrails[id] and not seen[id] then
			seen[id] = true
			table.insert(data.trails, id)
		end
	end
end

-- Acepta cualquier cosa leída del DataStore y devuelve datos válidos (campos nuevos con su valor por defecto).
local function reconcile(raw: any): PlayerData
	local data = defaultData()
	if type(raw) ~= "table" then
		return data
	end
	data.stage = Checkpoint.sanitize(toNumber(raw.stage, 1), STAGES)
	data.best = math.max(data.stage, Checkpoint.sanitize(toNumber(raw.best, 1), STAGES))
	data.completions = math.max(0, math.floor(toNumber(raw.completions, 0)))
	data.restarts = toInt(raw.restarts, 0, 0, Config.Restart.maxRestarts)
	data.coins = math.max(0, math.floor(toNumber(raw.coins, 0)))
	reconcileTrails(raw.trails, data)
	data.trail = if type(raw.trail) == "string" and trailIds[raw.trail] then raw.trail else ""
	data.dailyDay = math.max(0, math.floor(toNumber(raw.dailyDay, 0)))
	data.dailyStreak = toInt(raw.dailyStreak, 0, 0, Config.Daily.maxStreak)
	data.lastOnline = math.max(0, toNumber(raw.lastOnline, 0))
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
	return {
		stage = data.stage,
		best = data.best,
		completions = data.completions,
		restarts = data.restarts,
		coins = data.coins,
		trails = table.clone(data.trails),
		trail = data.trail,
		dailyDay = data.dailyDay,
		dailyStreak = data.dailyStreak,
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
	session.bestValue.Value = data.best
	session.completionsValue.Value = data.completions
	local player = session.player
	player:SetAttribute("Stage", data.stage)
	player:SetAttribute("Best", data.best)
	player:SetAttribute("Completions", data.completions)
	player:SetAttribute("Restarts", data.restarts)
	player:SetAttribute("Coins", math.floor(data.coins))
	player:SetAttribute("Trail", data.trail)
	player:SetAttribute("OwnedTrails", table.concat(data.trails, ","))
	player:SetAttribute("DailyStreak", data.dailyStreak)
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
	-- nombres con emoji: la lista de jugadores tampoco lleva texto. Checkpoint más alto y veces en la cima.
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local bestValue = Instance.new("IntValue")
	bestValue.Name = "🏔️"
	bestValue.Parent = leaderstats
	local completionsValue = Instance.new("IntValue")
	completionsValue.Name = "🏆"
	completionsValue.Parent = leaderstats
	leaderstats.Parent = player

	local session: Session = {
		player = player,
		key = "u_" .. player.UserId,
		data = data,
		canSave = canSave,
		busy = false,
		released = false,
		bestValue = bestValue,
		completionsValue = completionsValue,
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

-- Vuelve a publicar fase, monedas, trofeos y estelas en los atributos (tras cambiar session.data a mano).
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
