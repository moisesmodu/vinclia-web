--!strict
-- Construye el camión con Parts y restricciones, sin modelos de Studio.
--
-- Espacio del modelo: adelante = -Z (LookVector del VehicleSeat), arriba = +Y, derecha = +X.
-- Cada rueda: chasis —[PrismaticConstraint + SpringConstraint: suspensión]— puntal
--             puntal —[HingeConstraint servo: dirección, solo delante]— mangueta
--             mangueta (o puntal detrás) —[HingeConstraint motor: tracción]— rueda (cilindro)
-- El cliente que conduce mueve los motores y la dirección (TruckController); el servidor no confía en él para
-- nada de la economía.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

export type TruckOptions = {
	big: boolean,
	wallHeight: number,
	color: Color3,
}

export type TruckParts = {
	model: Model,
	chassis: Part,
	seat: VehicleSeat,
	eggsFolder: Folder,
	springs: { SpringConstraint },
	prismatics: { PrismaticConstraint },
	-- caja, en coordenadas locales del chasis
	bedFloorY: number,
	bedHalfX: number,
	bedMinZ: number,
	bedMaxZ: number,
	wallHeight: number,
}

local TruckBuilder = {}

local SPRING_GAP = 2 -- distancia entre los anclajes del muelle con la suspensión en reposo
local DRIVER_MASS = 15 -- masa aproximada de un avatar R15 sentado

local function newPart(model: Model, name: string, size: Vector3, position: Vector3, color: Color3): Part
	local part = Instance.new("Part")
	part.Name = name
	part.Size = size
	part.CFrame = CFrame.new(position)
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Anchored = false
	part.Parent = model
	return part
end

local function weld(a: BasePart, b: BasePart)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = a
end

-- Anclaje en `part` en la posición `position` (espacio del modelo) con su eje X principal en `axis`.
local function attach(part: BasePart, name: string, position: Vector3, axis: Vector3, secondary: Vector3): Attachment
	local a = Instance.new("Attachment")
	a.Name = name
	a.CFrame = CFrame.fromMatrix(position - part.Position, axis, secondary)
	a.Parent = part
	return a
end

local UP = Vector3.new(0, 1, 0)
local RIGHT = Vector3.new(1, 0, 0)

function TruckBuilder.build(options: TruckOptions): TruckParts
	local t = Config.Truck
	local model = Instance.new("Model")
	model.Name = "Truck"

	local length = if options.big then 15 else 12
	local frontZ = -6
	local rearZ = frontZ + length
	local chassisZ = (frontZ + rearZ) / 2

	local dark = Color3.fromRGB(30, 42, 58) -- tinta Nuvolet
	local wood = Color3.fromRGB(196, 140, 84)

	local chassis = newPart(model, "Chassis", Vector3.new(6, 1, length), Vector3.new(0, 0, chassisZ), dark)
	chassis.CustomPhysicalProperties = PhysicalProperties.new(2, 0.3, 0, 1, 1)
	chassis.CollisionGroup = "TruckBody"
	chassis.RootPriority = 10
	model.PrimaryPart = chassis

	local function body(name: string, size: Vector3, position: Vector3, color: Color3): Part
		local p = newPart(model, name, size, position, color)
		p.Massless = true
		p.CollisionGroup = "TruckBody"
		weld(chassis, p)
		return p
	end

	-- cabina abierta: capó, parabrisas, asiento y pared trasera (el avatar se ve conduciendo)
	body("Hood", Vector3.new(6, 1.6, 2.6), Vector3.new(0, 1.3, -4.7), options.color)
	local glass =
		body("Windshield", Vector3.new(5.6, 1.4, 0.2), Vector3.new(0, 2.8, -3.3), Color3.fromRGB(180, 225, 255))
	glass.Transparency = 0.45
	glass.CanCollide = false
	body("BumperFront", Vector3.new(6.4, 0.6, 0.4), Vector3.new(0, 0.2, frontZ - 0.2), dark)
	body("Lamp", Vector3.new(1, 0.5, 0.2), Vector3.new(-2.2, 1.3, frontZ - 0.05), Color3.fromRGB(255, 201, 77)).Material =
		Enum.Material.Neon
	body("Lamp", Vector3.new(1, 0.5, 0.2), Vector3.new(2.2, 1.3, frontZ - 0.05), Color3.fromRGB(255, 201, 77)).Material =
		Enum.Material.Neon

	local seat = Instance.new("VehicleSeat")
	seat.Name = "DriverSeat"
	seat.Size = Vector3.new(2, 0.6, 2)
	seat.CFrame = CFrame.new(0, 0.8, -2.2)
	seat.Color = Color3.fromRGB(244, 250, 255)
	seat.HeadsUpDisplay = false
	seat.MaxSpeed = 0 -- la tracción la hacen los motores, no el asiento
	seat.Torque = 0
	seat.Massless = true
	seat.CollisionGroup = "TruckBody"
	seat.Parent = model
	weld(chassis, seat)

	-- caja de carga
	local wallHeight = options.wallHeight
	local bedMinZ = -0.6
	local bedMaxZ = rearZ
	local bedLength = bedMaxZ - bedMinZ
	local bedCenterZ = (bedMinZ + bedMaxZ) / 2
	local floorTop = 0.8
	local floor = body("BedFloor", Vector3.new(6, 0.3, bedLength), Vector3.new(0, floorTop - 0.15, bedCenterZ), wood)
	floor.CustomPhysicalProperties = PhysicalProperties.new(0.3, 1.2, 0, 1, 1)
	local cabWall = math.max(2.2, wallHeight + 0.3)
	body("CabWall", Vector3.new(6, cabWall, 0.4), Vector3.new(0, 0.5 + cabWall / 2, -0.8), options.color)
	for _, side in { -1, 1 } do
		body(
			"BedWall",
			Vector3.new(0.3, wallHeight, bedLength),
			Vector3.new(side * 2.85, floorTop + wallHeight / 2, bedCenterZ),
			options.color
		)
	end
	body(
		"Tailgate",
		Vector3.new(6, wallHeight, 0.3),
		Vector3.new(0, floorTop + wallHeight / 2, bedMaxZ - 0.15),
		options.color
	)

	local eggsFolder = Instance.new("Folder")
	eggsFolder.Name = "Eggs"
	eggsFolder.Parent = model

	-- ruedas y suspensión
	local radius = t.wheelRadius
	local wheelY = -0.6
	local wheelX = 3.6
	local wheelSpecs = {
		{ name = "FL", x = -wheelX, z = frontZ + 2.2, steer = true },
		{ name = "FR", x = wheelX, z = frontZ + 2.2, steer = true },
		{ name = "RL", x = -wheelX, z = rearZ - 2.2, steer = false },
		{ name = "RR", x = wheelX, z = rearZ - 2.2, steer = false },
	}

	local springs: { SpringConstraint } = {}
	local prismatics: { PrismaticConstraint } = {}

	for _, spec in wheelSpecs do
		local center = Vector3.new(spec.x, wheelY, spec.z)

		local strut = newPart(model, "Strut" .. spec.name, Vector3.new(0.4, 0.4, 0.4), center, dark)
		strut.Transparency = 1
		strut.CanCollide = false
		strut.CanTouch = false
		strut.CanQuery = false
		strut.CustomPhysicalProperties = PhysicalProperties.new(4, 0.3, 0, 1, 1)

		local slider = Instance.new("PrismaticConstraint")
		slider.Name = "Suspension"
		slider.Attachment0 = attach(chassis, "SliderA" .. spec.name, center, UP, RIGHT)
		slider.Attachment1 = attach(strut, "SliderB" .. spec.name, center, UP, RIGHT)
		slider.LimitsEnabled = true
		slider.Parent = chassis
		table.insert(prismatics, slider)

		local spring = Instance.new("SpringConstraint")
		spring.Name = "Spring"
		spring.Attachment0 =
			attach(chassis, "SpringTop" .. spec.name, center + Vector3.new(0, SPRING_GAP, 0), UP, RIGHT)
		spring.Attachment1 = attach(strut, "SpringBottom" .. spec.name, center, UP, RIGHT)
		spring.Visible = false
		spring.Parent = chassis
		table.insert(springs, spring)

		local hub: BasePart = strut
		if spec.steer then
			local knuckle = newPart(model, "Knuckle" .. spec.name, Vector3.new(0.4, 0.4, 0.4), center, dark)
			knuckle.Transparency = 1
			knuckle.CanCollide = false
			knuckle.CanTouch = false
			knuckle.CanQuery = false
			knuckle.CustomPhysicalProperties = PhysicalProperties.new(4, 0.3, 0, 1, 1)

			local steer = Instance.new("HingeConstraint")
			steer.Name = "SteerServo"
			steer.Attachment0 = attach(strut, "SteerA" .. spec.name, center, UP, RIGHT)
			steer.Attachment1 = attach(knuckle, "SteerB" .. spec.name, center, UP, RIGHT)
			steer.ActuatorType = Enum.ActuatorType.Servo
			steer.ServoMaxTorque = 1e6
			steer.AngularSpeed = 3
			steer.TargetAngle = 0
			steer.LimitsEnabled = true
			steer.LowerAngle = -t.steerAngle
			steer.UpperAngle = t.steerAngle
			steer.Parent = strut
			hub = knuckle
		end

		local wheel = newPart(model, "Wheel" .. spec.name, Vector3.new(1.2, radius * 2, radius * 2), center, dark)
		wheel.Shape = Enum.PartType.Cylinder -- el eje del cilindro es X: el eje de la rueda
		wheel.CustomPhysicalProperties = PhysicalProperties.new(1, 1.6, 0, 100, 1)
		wheel.CollisionGroup = "TruckWheels"
		local cap = Instance.new("Part")
		cap.Name = "Hubcap"
		cap.Shape = Enum.PartType.Cylinder
		cap.Size = Vector3.new(1.25, radius * 0.9, radius * 0.9)
		cap.CFrame = CFrame.new(center)
		cap.Color = Color3.fromRGB(244, 250, 255)
		cap.Material = Enum.Material.SmoothPlastic
		cap.Massless = true
		cap.CanCollide = false
		cap.CanTouch = false
		cap.Parent = model
		weld(wheel, cap)

		local motor = Instance.new("HingeConstraint")
		motor.Name = "DriveMotor"
		motor.Attachment0 = attach(hub, "AxleA" .. spec.name, center, RIGHT, UP)
		motor.Attachment1 = attach(wheel, "AxleB" .. spec.name, center, RIGHT, UP)
		motor.ActuatorType = Enum.ActuatorType.Motor
		motor.MotorMaxTorque = t.coastTorque
		motor.MotorMaxAcceleration = t.motorAcceleration
		motor.AngularVelocity = 0
		motor.Parent = hub
	end

	return {
		model = model,
		chassis = chassis,
		seat = seat,
		eggsFolder = eggsFolder,
		springs = springs,
		prismatics = prismatics,
		bedFloorY = floorTop,
		bedHalfX = 2.7,
		bedMinZ = bedMinZ - chassisZ,
		bedMaxZ = bedMaxZ - 0.3 - chassisZ,
		wallHeight = wallHeight,
	}
end

-- Ajusta muelles y amortiguadores a la masa real del camión (+ conductor) para que repose a media carrera.
function TruckBuilder.tuneSuspension(parts: TruckParts, dampingRatio: number, travel: number)
	local mass = DRIVER_MASS
	for _, d in parts.model:GetDescendants() do
		if d:IsA("BasePart") and not d.Massless then
			mass += d:GetMass()
		end
	end
	local perWheel = mass / 4
	local sag = travel * 0.6
	local stiffness = perWheel * Workspace.Gravity / sag
	local damping = dampingRatio * 2 * math.sqrt(stiffness * perWheel)
	for _, spring in parts.springs do
		spring.FreeLength = SPRING_GAP + sag
		spring.Stiffness = stiffness
		spring.Damping = damping
	end
	for _, slider in parts.prismatics do
		slider.LowerLimit = -travel
		slider.UpperLimit = travel * 0.6
	end
end

return TruckBuilder
