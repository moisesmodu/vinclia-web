--!strict
-- Cada aviso (ProximityPrompt) del servidor dice para quién es con dos atributos:
--   Audience = "others" (llevarse una gelatina: todos menos el dueño) u "owner" (candado, tocar al que se la
--   lleva: solo el dueño), y OwnerId.
-- Este módulo los enciende o apaga solo en este cliente. Es comodidad: el servidor vuelve a comprobarlo todo.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local PromptFilter = {}

local player = Players.LocalPlayer

local function apply(prompt: ProximityPrompt)
	local audience = prompt:GetAttribute("Audience")
	local isOwner = prompt:GetAttribute("OwnerId") == player.UserId
	if audience == "others" then
		prompt.Enabled = not isOwner
	elseif audience == "owner" then
		prompt.Enabled = isOwner
	end
end

local function watch(item: Instance)
	if item:IsA("ProximityPrompt") then
		apply(item)
		item:GetAttributeChangedSignal("OwnerId"):Connect(function()
			apply(item)
		end)
	end
end

function PromptFilter.start()
	Workspace.DescendantAdded:Connect(watch)
	for _, item in Workspace:GetDescendants() do
		watch(item)
	end
end

return PromptFilter
