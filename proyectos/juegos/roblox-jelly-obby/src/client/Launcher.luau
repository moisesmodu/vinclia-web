--!strict
-- Almohadillas y trampolines. El servidor marca esas piezas con el atributo «Launch» (velocidad vertical en
-- studs/s) y este módulo impulsa al personaje propio al tocarlas: el personaje se simula en el cliente y un impulso
-- desde el servidor llegaría tarde y a saltos. Es solo comodidad física: checkpoints, caídas y teletransportes los
-- sigue vigilando el servidor.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local Launcher = {}

local player = Players.LocalPlayer
local squashing: { [BasePart]: boolean } = {}
setmetatable(squashing, { __mode = "k" })

-- La almohadilla se aplasta un momento (solo en esta pantalla).
local function squash(pad: BasePart)
	if not squashing[pad] then
		squashing[pad] = true
		local original = pad.Size
		local tween = TweenService:Create(
			pad,
			TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, 0, true),
			{ Size = Vector3.new(original.X * 0.5, original.Y * 1.1, original.Z * 1.1) }
		)
		tween:Play()
		tween.Completed:Wait()
		pad.Size = original
		squashing[pad] = nil
	end
end

local function connect(humanoid: Humanoid, root: BasePart)
	local lastLaunch = 0
	humanoid.Touched:Connect(function(hit: BasePart)
		local launch = hit:GetAttribute("Launch")
		if type(launch) == "number" and launch > 0 and os.clock() - lastLaunch > 0.25 then
			lastLaunch = os.clock()
			local velocity = root.AssemblyLinearVelocity
			humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
			root.AssemblyLinearVelocity = Vector3.new(velocity.X, launch, velocity.Z)
			task.spawn(squash, hit)
		end
	end)
end

local function watch(character: Model)
	local humanoid = character:WaitForChild("Humanoid", 10)
	local root = character:WaitForChild("HumanoidRootPart", 10)
	if humanoid and humanoid:IsA("Humanoid") and root and root:IsA("BasePart") then
		connect(humanoid, root)
	end
end

function Launcher.start()
	player.CharacterAdded:Connect(watch)
	local character = player.Character
	if character then
		task.spawn(watch, character)
	end
end

return Launcher
