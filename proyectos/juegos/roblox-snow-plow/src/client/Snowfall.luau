--!strict
-- Nevada suave alrededor de la cámara (solo en este cliente). Durante una Tormenta nieva mucho más.

local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Snowfall = {}

local CALM_RATE = 60
local STORM_RATE = 260

function Snowfall.start()
	local cloud = Instance.new("Part")
	cloud.Name = "SnowCloud"
	cloud.Anchored = true
	cloud.CanCollide = false
	cloud.CanQuery = false
	cloud.CanTouch = false
	cloud.Transparency = 1
	cloud.Size = Vector3.new(120, 1, 120)

	local flakes = Instance.new("ParticleEmitter")
	flakes.Rate = CALM_RATE
	flakes.Lifetime = NumberRange.new(7, 9)
	flakes.Speed = NumberRange.new(5, 8)
	flakes.SpreadAngle = Vector2.new(12, 12)
	flakes.EmissionDirection = Enum.NormalId.Bottom
	flakes.Size = NumberSequence.new(0.35)
	flakes.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255))
	flakes.LightEmission = 0.4
	flakes.Rotation = NumberRange.new(0, 360)
	flakes.RotSpeed = NumberRange.new(-40, 40)
	flakes.Acceleration = Vector3.new(1.5, 0, 0.8)
	flakes.Parent = cloud
	cloud.Parent = Workspace

	RunService.RenderStepped:Connect(function()
		local camera = Workspace.CurrentCamera
		if camera then
			local p = camera.CFrame.Position
			cloud.CFrame = CFrame.new(p.X, p.Y + 40, p.Z)
		end
		local stormUntil = Workspace:GetAttribute("StormUntil")
		local storm = type(stormUntil) == "number" and Workspace:GetServerTimeNow() < stormUntil
		flakes.Rate = if storm then STORM_RATE else CALM_RATE
	end)
end

return Snowfall
