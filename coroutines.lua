

local FILE = '/Users/mike/torch/torch-rnn/aom_vocab.json'
local SIZE = 10000

local filereader = coroutine.create(function()
	local f = io.open(FILE, 'r')
	local line
	local lines = {}
	repeat
		line = f:read()
		if line then
			lines[#lines + 1] = line
			if #lines > SIZE then
				coroutine.yield(lines)
				lines = {}
			end
		end
	until line == nil 
	print("ended")
end)


local status = true
local ls = {}

repeat
	status, ls = coroutine.resume(filereader)
	print(collectgarbage("count") * 1024)
until not status
ls = nil
local f2 = io.open(FILE, r)
print(f2)
local lines = f2:read('*all')
f2:close()
print(collectgarbage("count") * 1024)