--!strict
-- Lo que se mueve o reacciona en la torre (en el servidor, igual para todos):
-- * Gelatinas: al pisarlas tiemblan, se encogen y desaparecen; vuelven al rato.
-- * Baldosas: parpadean y desaparecen poco después de pisarlas; vuelven al rato.
-- * Plataformas móviles: van y vienen de lado (AlignPosition hacia un extremo y luego hacia el otro).
-- * Baba: tocarla te devuelve a tu checkpoint (sin daño).
-- Las giratorias ya giran solas (motor de la bisagra) y las cintas llevan su velocidad desde que se construyen.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local TowerBuilder = require(script.Parent.TowerBuilder)

local ObstacleService = {}

local function playerFrom(hit: BasePart): Player?
	local model = hit:FindFirstAncestorOfClass("Model")
	if model and model:FindFirstChildOfClass("Humanoid") then
		return Players:GetPlayerFromCharacter(model)
	end
	return nil
end

local function restore(item: TowerBuilder.Timed)
	item.part.Size = item.size
	item.part.Color = item.color
	item.part.Transparency = item.transparency
	item.part.CanCollide = true
end

-- Gelatina: tiembla (crece y encoge rápido) durante `delay`, luego se encoge del todo y desaparece.
local function wobble(item: TowerBuilder.Timed)
	local part = item.part
	local squash = Vector3.new(item.size.X * 1.12, item.size.Y * 0.8, item.size.Z * 1.12)
	local shake = TweenService:Create(
		part,
		TweenInfo.new(0.12, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
		{ Size = squash }
	)
	shake:Play()
	task.wait(item.delay)
	shake:Cancel()
	local shrink = TweenService:Create(
		part,
		TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In),
		{ Size = Vector3.new(0.2, item.size.Y * 0.5, 0.2), Transparency = 1 }
	)
	shrink:Play()
	shrink.Completed:Wait()
	part.CanCollide = false
	task.wait(item.respawn)
	restore(item)
end

-- Baldosa: se aclara y desaparece tras `delay`.
local function fade(item: TowerBuilder.Timed)
	local part = item.part
	part.Color = item.color:Lerp(TowerBuilder.Colors.cloud, 0.6)
	task.wait(item.delay)
	part.Transparency = 0.85
	part.CanCollide = false
	task.wait(item.respawn)
	restore(item)
end

local function watchTimed(list: { TowerBuilder.Timed }, run: (TowerBuilder.Timed) -> ())
	for _, item in list do
		local busy = false
		item.part.Touched:Connect(function(hit: BasePart)
			if not busy and playerFrom(hit) ~= nil then
				busy = true
				task.spawn(function()
					run(item)
					busy = false
				end)
			end
		end)
	end
end

local function runMover(mover: TowerBuilder.Mover)
	local travel = (mover.b - mover.a).Magnitude / math.max(mover.speed, 0.1)
	local toB = true
	-- cada plataforma empieza en un momento distinto para que no vayan todas a la vez
	task.wait((mover.a.X + mover.a.Z) % 2)
	while true do
		mover.align.Position = if toB then mover.b else mover.a
		task.wait(travel + 0.6)
		toB = not toB
	end
end

function ObstacleService.start(built: TowerBuilder.Built, onGoo: (Player) -> ())
	watchTimed(built.jelly, wobble)
	watchTimed(built.vanish, fade)
	for _, mover in built.movers do
		task.spawn(runMover, mover)
	end
	for _, goo in built.goo do
		goo.Touched:Connect(function(hit: BasePart)
			local player = playerFrom(hit)
			if player then
				onGoo(player)
			end
		end)
	end
end

return ObstacleService
