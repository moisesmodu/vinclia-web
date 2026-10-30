--!strict
-- Puertas de hielo entre zonas. En el servidor son sólidas para todos; aquí, en este cliente, se vuelven
-- invisibles y atravesables las de las zonas que este jugador ya abrió (atributo Zones). Es comodidad: el
-- servidor vuelve a comprobar la zona de cada jugador y lo devuelve atrás si entra donde no debe.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local GateView = {}

local player = Players.LocalPlayer

local function unlockedZones(): number
	local value = player:GetAttribute("Zones")
	return if type(value) == "number" then value else 1
end

local function apply(item: Instance)
	local zone = item:GetAttribute("Zone")
	if type(zone) == "number" then
		local open = zone <= unlockedZones()
		if item:IsA("BasePart") and item.Name == "Gate" .. zone then
			item.CanCollide = not open
			item.Transparency = if open then 1 else 0.35
		elseif item:IsA("BasePart") then
			item.Transparency = if open then 1 else 0
			item.CanCollide = not open
			local prompt = item:FindFirstChildOfClass("ProximityPrompt")
			if prompt then
				prompt.Enabled = not open
			end
			local label = item:FindFirstChildOfClass("BillboardGui")
			if label then
				label.Enabled = not open
			end
		end
	end
end

function GateView.start()
	task.spawn(function()
		local world = Workspace:WaitForChild("World")
		local gates = world:WaitForChild("Gates")
		local function applyAll()
			for _, item in gates:GetChildren() do
				apply(item)
			end
		end
		gates.ChildAdded:Connect(apply)
		player:GetAttributeChangedSignal("Zones"):Connect(applyAll)
		applyAll()
	end)
end

return GateView
