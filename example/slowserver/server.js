var connect = require('connect'),
	http = require('http'),
	directory = '../../',
	requests = 0;

connect()
	.use(function(req, res, next){
		// make the first couple of requests have slow responses, to simulate
		// a server spinning up or a new load balance instance coming on line
		var respSpeed = (requests+=1) < 2 ? 2000 : 60
		setTimeout(function () {
			next();
		}, respSpeed);
	})
	.use(connect.static(directory))
	.listen(4001);

console.log('Slave on port 4001.');

connect()
	.use(connect.static(directory))
	.listen(4000);

console.log('Master on port 4000.');