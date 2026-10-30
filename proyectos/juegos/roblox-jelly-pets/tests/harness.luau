-- Mini marco de pruebas para Lune: test(nombre, fn) y aserciones. Sin dependencias.

local Harness = {}

local passed = 0
local failures: { string } = {}

function Harness.test(name: string, fn: () -> ())
	local ok, err = pcall(fn)
	if ok then
		passed += 1
		print("  ok    " .. name)
	else
		table.insert(failures, name .. ": " .. tostring(err))
		print("  FALLO " .. name .. "\n        " .. tostring(err))
	end
end

function Harness.eq(actual: any, expected: any, message: string?)
	if actual ~= expected then
		error(string.format("%s: esperaba %s, salió %s", message or "eq", tostring(expected), tostring(actual)), 2)
	end
end

function Harness.near(actual: number, expected: number, epsilon: number, message: string?)
	if math.abs(actual - expected) > epsilon then
		error(string.format("%s: esperaba %s ± %s, salió %s", message or "near", expected, epsilon, actual), 2)
	end
end

function Harness.truthy(value: any, message: string?)
	if not value then
		error(message or "esperaba verdadero", 2)
	end
end

function Harness.section(name: string)
	print("\n" .. name)
end

-- Devuelve el número de pruebas fallidas.
function Harness.summary(): number
	print(string.format("\n%d correctas, %d fallidas", passed, #failures))
	for _, f in failures do
		print("  - " .. f)
	end
	return #failures
end

return Harness
