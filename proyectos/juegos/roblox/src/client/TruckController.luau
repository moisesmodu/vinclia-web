--!strict
-- Conducción: cuando el jugador se sienta en SU camión, este script mueve los motores de las ruedas y la
-- dirección a partir del VehicleSeat (teclado, mando o joystick táctil del móvil, que Roblox ya traduce a
-- ThrottleFloat/SteerFloat). El jugador es el dueño de la física de su camión, así que responde al instante.
-- Cámara: se aleja un poco al conducir para ver la caja con los huevos.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local player = Players.LocalPlayer

type Driving = {
	seat: VehicleSeat,
	motors: { HingeConstraint },
	servos: { HingeConstraint },
}

local TruckController = {}

local current: Driving? = nil
local savedMinZoom = player.CameraMinZoomDistance

local function bindModel(seat: VehicleSeat, model: Model)
	local motors: { HingeConstraint } = {}
	local servos: { HingeConstraint } = {}
	for _, d in model:GetDescendants() do
		if d:IsA("HingeConstraint") then
			if d.Name == "DriveMotor" then
				table.insert(motors, d)
			elseif d.Name == "SteerServo" then
				table.insert(servos, d)
			end
		end
	end
	current = { seat = seat, motors = motors, servos = servos }
	savedMinZoom = player.CameraMinZoomDistance
	player.CameraMinZoomDistance = math.max(savedMinZoom, 22)
end

-- Solo se conduce el camión propio.
local function bind(seat: VehicleSeat)
	local model = seat:FindFirstAncestorOfClass("Model")
	if model and model:GetAttribute("OwnerUserId") == player.UserId then
		bindModel(seat, model)
	end
end

local function unbind()
	current = nil
	player.CameraMinZoomDistance = savedMinZoom
end

local function onCharacter(character: Model)
	unbind()
	local humanoid = character:WaitForChild("Humanoid") :: Humanoid
	humanoid.Seated:Connect(function(active: boolean, seatPart: BasePart?)
		if active and seatPart and seatPart:IsA("VehicleSeat") then
			bind(seatPart)
		else
			unbind()
		end
	end)
end

local function drive(driving: Driving)
	if not driving.seat.Parent then
		unbind()
		return
	end
	local t = Config.Truck
	local throttle = driving.seat.ThrottleFloat
	local steer = driving.seat.SteerFloat
	for _, motor in driving.motors do
		if math.abs(throttle) > 0.05 then
			motor.MotorMaxTorque = t.motorTorque
			motor.AngularVelocity = t.driveSign * throttle * t.maxWheelSpeed
		else
			motor.MotorMaxTorque = t.coastTorque
			motor.AngularVelocity = 0
		end
	end
	for _, servo in driving.servos do
		servo.TargetAngle = t.steerSign * steer * t.steerAngle
	end
end

function TruckController.start()
	RunService.Heartbeat:Connect(function()
		local driving = current
		if driving then
			drive(driving)
		end
	end)

	player.CharacterAdded:Connect(onCharacter)
	if player.Character then
		task.spawn(onCharacter, player.Character)
	end
end

return TruckController
