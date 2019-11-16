

co = coroutine.create(function(str)
	for i=1, #str do
		print(i, str:sub(i,i))
		coroutine.yield(str:sub(i,i))
	end
	print("finished")
end)


sineco = coroutine.create(function()
	local x = 0.0
	while true
		do
			x = x + 0.001
			coroutine.yield(math.sin(x))
		end
end)


builder = coroutine.create(function(i)
	local b = i
	while true
		do
			local j = coroutine.yield(b)
			print("resume passed " .. j)
			b = b .. j
		end
end)


_, b1 = coroutine.resume(builder, "a")
print(b1)
_, b2 = coroutine.resume(builder, "b")
print(b2)
_, b3 = coroutine.resume(builder, "c")
print(b3)
