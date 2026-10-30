--!strict
-- Recoger cristales: diez veces por segundo mira los cristales de tu parcela y, si tienes uno a menos de
-- Config.Crystals.pickupRadius, se lo pide al servidor (que vuelve a comprobar distancia, tiempo y dueño).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

local CollectCrystalRemote = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("CollectCrystal") :: RemoteEvent

local player = Players.LocalPlayer

local CrystalSeeker = {}

local function myCrystals(): Instance?
	local plots = Workspace:FindFirstChild("Plots")
	if plots then
		for _, plot in plots:GetChildren() do
			if plot:GetAttribute("Owner") == player.UserId then
				return plot:FindFirstChild("Crystals")
			end
		end
	end
	return nil
end

local function rootPosition(): Vector3?
	local character = player.Character
	if character then
		local root = character:FindFirstChild("HumanoidRootPart")
		if root and root:IsA("BasePart") then
			return root.Position
		end
	end
	return nil
end

function CrystalSeeker.start()
	local asked: { [string]: number } = {}
	local radius = Config.Crystals.pickupRadius
	task.spawn(function()
		while true do
			task.wait(0.1)
			local folder = myCrystals()
			local position = rootPosition()
			if folder and position then
				local now = os.clock()
				for _, crystal in folder:GetChildren() do
					if crystal:IsA("BasePart") and crystal.Transparency < 1 then
						local last = asked[crystal.Name] or 0
						if now - last > 0.6 and (crystal.Position - position).Magnitude <= radius then
							asked[crystal.Name] = now
							CollectCrystalRemote:FireServer(crystal.Name)
						end
					end
				end
			end
		end
	end)
end

return CrystalSeeker
