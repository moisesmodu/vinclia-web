--!strict
-- Pilotar el cohete (como el Rocket Hop de la web): mantener 🔥 (o Espacio, o A/R2 en el mando) = subir; sin
-- empuje, el cohete planea hacia abajo. El joystick (o WASD) lo mueve en horizontal respecto a la cámara.
-- El combustible solo se gasta subiendo y se rellena posado. El cliente es dueño de la física del cohete
-- (el servidor le da la propiedad de red al subir) y lo mueve con su LinearVelocity; el servidor no se fía:
-- valida cada cristal y devuelve a su plataforma un cohete que se va demasiado lejos.

local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rocket = require(Shared:WaitForChild("Rocket"))

local player = Players.LocalPlayer

local C = {
	ink = Color3.fromRGB(30, 42, 58),
	sky = Color3.fromRGB(79, 179, 255),
	cloud = Color3.fromRGB(244, 250, 255),
	sun = Color3.fromRGB(255, 201, 77),
	red = Color3.fromRGB(229, 75, 75),
}
local FONT = Enum.Font.FredokaOne
local ACTION = "RocketThrust"

type Pilot = {
	seat: VehicleSeat,
	model: Model,
	body: BasePart,
	thrust: LinearVelocity,
	upright: AlignOrientation?,
	flame: BasePart?,
	fire: Fire?,
	pad: Vector3,
}

local RocketController = {}

local function round(parent: GuiObject, radius: number)
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius)
	corner.Parent = parent
end

local function outline(parent: GuiObject)
	local stroke = Instance.new("UIStroke")
	stroke.Color = C.ink
	stroke.Thickness = 3
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = parent
end

local function bigButton(parent: Instance, icon: string, size: number, color: Color3): TextButton
	local b = Instance.new("TextButton")
	b.Size = UDim2.fromOffset(size, size)
	b.BackgroundColor3 = color
	b.AutoButtonColor = true
	b.Font = FONT
	b.TextScaled = true
	b.TextColor3 = C.cloud
	b.Text = icon
	round(b, size // 2)
	outline(b)
	b.Parent = parent
	return b
end

-- El cohete en el que va sentado el jugador, si es suyo.
local function pilotFrom(seatPart: Instance?): Pilot?
	if seatPart and seatPart:IsA("VehicleSeat") and seatPart:GetAttribute("RocketSeat") == true then
		local model = seatPart.Parent
		if model and model:IsA("Model") and model:GetAttribute("Owner") == player.UserId then
			local body = model:FindFirstChild("Body")
			local pad = model:GetAttribute("Pad")
			if body and body:IsA("BasePart") and typeof(pad) == "Vector3" then
				local thrust = body:FindFirstChild("Thrust")
				if thrust and thrust:IsA("LinearVelocity") then
					local upright = body:FindFirstChild("Upright")
					local flame = model:FindFirstChild("Flame")
					local flamePart = if flame and flame:IsA("BasePart") then flame else nil
					local fire = if flamePart then flamePart:FindFirstChildOfClass("Fire") else nil
					return {
						seat = seatPart,
						model = model,
						body = body,
						thrust = thrust,
						upright = if upright and upright:IsA("AlignOrientation") then upright else nil,
						flame = flamePart,
						fire = fire,
						pad = pad,
					}
				end
			end
		end
	end
	return nil
end

local function flat(v: Vector3): Vector3
	local f = Vector3.new(v.X, 0, v.Z)
	if f.Magnitude < 1e-3 then
		return Vector3.zero
	end
	return f.Unit
end

function RocketController.start()
	local params = Config.Rocket

	-- interfaz del piloto: barra de combustible, botón de empuje y bajarse
	local gui = Instance.new("ScreenGui")
	gui.Name = "RocketHud"
	gui.ResetOnSpawn = false
	gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
	gui.Enabled = false
	local scale = Instance.new("UIScale")
	scale.Parent = gui
	local function rescale()
		local camera = Workspace.CurrentCamera
		if camera then
			local v = camera.ViewportSize
			scale.Scale = math.clamp(math.min(v.X / 1000, v.Y / 620), 0.6, 1.3)
		end
	end
	rescale()
	local currentCamera = Workspace.CurrentCamera
	if currentCamera then
		currentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
	end

	local fuelFrame = Instance.new("Frame")
	fuelFrame.AnchorPoint = Vector2.new(0.5, 1)
	fuelFrame.Position = UDim2.new(0.5, 0, 1, -24)
	fuelFrame.Size = UDim2.fromOffset(300, 30)
	fuelFrame.BackgroundColor3 = C.ink
	fuelFrame.BackgroundTransparency = 0.15
	round(fuelFrame, 15)
	fuelFrame.Parent = gui
	local fuelFill = Instance.new("Frame")
	fuelFill.Size = UDim2.fromScale(1, 1)
	fuelFill.BackgroundColor3 = C.sun
	round(fuelFill, 15)
	fuelFill.Parent = fuelFrame
	local fuelIcon = Instance.new("TextLabel")
	fuelIcon.BackgroundTransparency = 1
	fuelIcon.Size = UDim2.fromOffset(40, 40)
	fuelIcon.Position = UDim2.new(0, -46, 0.5, -20)
	fuelIcon.Font = FONT
	fuelIcon.TextScaled = true
	fuelIcon.Text = "⛽"
	fuelIcon.Parent = fuelFrame

	local thrustButton = bigButton(gui, "🔥", 130, C.red)
	thrustButton.AnchorPoint = Vector2.new(1, 1)
	thrustButton.Position = UDim2.new(1, -30, 1, -40)
	local exitButton = bigButton(gui, "⏏️", 64, C.sky)
	exitButton.AnchorPoint = Vector2.new(1, 1)
	exitButton.Position = UDim2.new(1, -60, 1, -190)

	-- estado
	local pilot: Pilot? = nil
	local fuel = params.fuelSeconds
	local buttonHeld = false
	local keyHeld = false
	local thrustInput: InputObject? = nil
	local yaw = CFrame.new()

	thrustButton.InputBegan:Connect(function(input: InputObject)
		local t = input.UserInputType
		if t == Enum.UserInputType.Touch or t == Enum.UserInputType.MouseButton1 then
			thrustInput = input
			buttonHeld = true
		end
	end)
	UserInputService.InputEnded:Connect(function(input: InputObject)
		if input == thrustInput or input.UserInputType == Enum.UserInputType.MouseButton1 then
			thrustInput = nil
			buttonHeld = false
		end
	end)

	local function onAction(_name: string, state: Enum.UserInputState, _input: InputObject): Enum.ContextActionResult
		keyHeld = state == Enum.UserInputState.Begin
		return Enum.ContextActionResult.Sink
	end

	local function setPilot(nextPilot: Pilot?)
		pilot = nextPilot
		buttonHeld = false
		keyHeld = false
		gui.Enabled = nextPilot ~= nil
		if nextPilot then
			-- Espacio (que normalmente salta y te baja del asiento) pasa a ser el empuje
			ContextActionService:BindActionAtPriority(
				ACTION,
				onAction,
				false,
				Enum.ContextActionPriority.High.Value,
				Enum.KeyCode.Space,
				Enum.KeyCode.ButtonA,
				Enum.KeyCode.ButtonR2
			)
		else
			ContextActionService:UnbindAction(ACTION)
		end
	end

	local function watchCharacter(character: Model)
		local humanoid = character:WaitForChild("Humanoid", 10)
		if humanoid and humanoid:IsA("Humanoid") then
			humanoid.Seated:Connect(function(active: boolean, seatPart: BasePart?)
				setPilot(if active then pilotFrom(seatPart) else nil)
			end)
			humanoid.Died:Connect(function()
				setPilot(nil)
			end)
		end
	end

	-- bajarse: saltar fuera del asiento
	exitButton.Activated:Connect(function()
		local current = player.Character
		local humanoid = if current then current:FindFirstChildOfClass("Humanoid") else nil
		if pilot and humanoid then
			humanoid.Jump = true
		end
	end)

	local playerGui = player:WaitForChild("PlayerGui")
	gui.Parent = playerGui

	-- con la interfaz ya puesta: personaje y bucle de vuelo
	player.CharacterAdded:Connect(watchCharacter)
	local character = player.Character
	if character then
		task.spawn(watchCharacter, character)
	end

	local rayParams = RaycastParams.new()
	rayParams.FilterType = Enum.RaycastFilterType.Exclude

	RunService.Heartbeat:Connect(function(dt: number)
		local p = pilot
		if p then
			if p.seat.Parent == nil or p.seat.Occupant == nil then
				setPilot(nil)
			else
				local body = p.body
				local exclude: { Instance } = { p.model }
				if player.Character then
					table.insert(exclude, player.Character)
				end
				rayParams.FilterDescendantsInstances = exclude
				local hit = Workspace:Raycast(body.Position, Vector3.new(0, -(body.Size.Y / 2 + 0.9), 0), rayParams)
				local grounded = hit ~= nil

				local holding = buttonHeld or keyHeld
				local thrusting: boolean
				fuel, thrusting = Rocket.stepFuel(fuel, holding, grounded, dt, params)
				local speeds = Rocket.speeds(params, player:GetAttribute("Pass_FasterRocket") == true)
				local altitude = body.Position.Y - p.pad.Y
				local vy = Rocket.verticalVelocity(thrusting, altitude, speeds, params)

				local vx, vz = 0, 0
				if thrusting or not grounded then
					local camera = Workspace.CurrentCamera
					if camera then
						local forward = flat(camera.CFrame.LookVector)
						local right = flat(camera.CFrame.RightVector)
						local dir = forward * p.seat.ThrottleFloat + right * p.seat.SteerFloat
						if dir.Magnitude > 1 then
							dir = dir.Unit
						end
						local offset = body.Position - p.pad
						vx, vz = Rocket.clampHorizontal(
							offset.X,
							offset.Z,
							dir.X * speeds.horizontal,
							dir.Z * speeds.horizontal,
							params.maxRange
						)
					end
				else
					vy = 0 -- posado y sin empujar: quieto
				end
				p.thrust.VectorVelocity = Vector3.new(vx, vy, vz)

				-- el morro mira hacia donde va
				if vx * vx + vz * vz > 1 then
					yaw = CFrame.lookAt(Vector3.zero, Vector3.new(vx, 0, vz))
				end
				local upright = p.upright
				if upright then
					upright.CFrame = yaw
				end
				local flame = p.flame
				if flame then
					flame.Transparency = if thrusting then 0.15 else 1
				end
				local fire = p.fire
				if fire then
					fire.Enabled = thrusting
				end
				fuelFill.Size = UDim2.fromScale(math.clamp(fuel / params.fuelSeconds, 0, 1), 1)
				fuelFill.BackgroundColor3 = if fuel < params.fuelSeconds * 0.25 then C.red else C.sun
			end
		end
	end)
end

return RocketController
