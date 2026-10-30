--!strict
-- Las rocas lunares que caen de los extractores y viajan por la cinta hasta la refinería. Solo decoración: las
-- dibuja cada cliente (sin física ni red) y las cuentas de verdad las hace el servidor (TycoonService).
-- Cada extractor suelta una roca cada `interval` segundos; al pasar bajo un escáner comprado, la roca brilla más.
-- Solo se dibujan las parcelas cercanas a la cámara y hay un tope de rocas a la vez.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

local OreView = {}

local MAX_ORES = 160
local VIEW_DISTANCE = 260
local GLOW = {
	Color3.fromRGB(150, 150, 165),
	Color3.fromRGB(120, 200, 255),
	Color3.fromRGB(190, 130, 255),
	Color3.fromRGB(255, 210, 90),
}

local defs: { [string]: Config.ButtonDef } = {}
for _, def in Config.Buttons do
	defs[def.id] = def
end

local function originOf(plot: Instance): CFrame?
	local origin = plot:GetAttribute("Origin")
	if typeof(origin) == "CFrame" then
		return origin
	end
	return nil
end

local function scannersOf(items: Instance): { number }
	local xs: { number } = {}
	for _, item in items:GetChildren() do
		local id = item:GetAttribute("Button")
		local def = if type(id) == "string" then defs[id] else nil
		if def and def.kind == "upgrader" then
			table.insert(xs, def.at[1])
		end
	end
	table.sort(xs)
	return xs
end

local function spawnOre(folder: Folder, origin: CFrame, def: Config.ButtonDef, scanners: { number }): Part
	local belt = Config.Plot.belt
	local x, z = def.at[1], def.at[2]
	local dir = if z < belt.z then 1 else -1
	local y = belt.height + 0.6
	local ore = Instance.new("Part")
	ore.Name = "Ore"
	ore.Shape = Enum.PartType.Ball
	ore.Size = Vector3.new(1.3, 1.3, 1.3)
	ore.Anchored = true
	ore.CanCollide = false
	ore.CanQuery = false
	ore.CanTouch = false
	ore.CastShadow = false
	ore.Material = Enum.Material.Slate
	ore.Color = GLOW[1]
	ore.CFrame = origin * CFrame.new(x, 4.2, z + dir * 6.6)
	ore.Parent = folder

	local drop = TweenService:Create(ore, TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		CFrame = origin * CFrame.new(x, y, belt.z),
	})
	local endX = belt.x1 + 2.5
	local travel = (endX - x) / belt.speed
	local slide = TweenService:Create(ore, TweenInfo.new(travel, Enum.EasingStyle.Linear), {
		CFrame = origin * CFrame.new(endX, y, belt.z),
	})
	drop.Completed:Connect(function()
		slide:Play()
	end)
	slide.Completed:Connect(function()
		ore:Destroy()
	end)
	-- brilla más bajo cada escáner
	for i, sx in scanners do
		if sx > x then
			task.delay(0.35 + (sx - x) / belt.speed, function()
				if ore.Parent then
					ore.Color = GLOW[math.min(i + 1, #GLOW)]
					ore.Material = Enum.Material.Neon
				end
			end)
		end
	end
	drop:Play()
	return ore
end

function OreView.start()
	local folder = Instance.new("Folder")
	folder.Name = "LocalOres"
	folder.Parent = Workspace
	local nextDrop: { [Instance]: number } = {}
	setmetatable(nextDrop, { __mode = "k" })

	task.spawn(function()
		while true do
			task.wait(0.1)
			local plots = Workspace:FindFirstChild("Plots")
			local camera = Workspace.CurrentCamera
			if plots and camera then
				local now = os.clock()
				local focus = camera.Focus.Position
				for _, plot in plots:GetChildren() do
					local origin = originOf(plot)
					local items = plot:FindFirstChild("Items")
					local near = origin and (origin.Position - focus).Magnitude < VIEW_DISTANCE
					if origin and items and near then
						local scanners: { number }? = nil
						for _, item in items:GetChildren() do
							local id = item:GetAttribute("Button")
							local def = if type(id) == "string" then defs[id] else nil
							if def and def.kind == "dropper" then
								local due = nextDrop[item]
								if due == nil then
									-- primera vez: un retraso al azar para que no caigan todas a la vez
									nextDrop[item] = now + math.random() * (def.interval or 2)
								elseif now >= due then
									nextDrop[item] = now + (def.interval or 2)
									if #folder:GetChildren() < MAX_ORES then
										local list = scanners or scannersOf(items)
										scanners = list
										spawnOre(folder, origin, def, list)
									end
								end
							end
						end
					end
				end
			end
		end
	end)
end

return OreView
