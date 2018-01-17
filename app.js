var express = require('express')
var fs = require('fs')
var http = require('http')
var socket = require('socket.io')

var child_process = require('child_process')
var app = express()

app.set('view engine', 'ejs')
app.use('/assets', express.static('./public'))

var server= http.createServer(app)
var io = socket(server)

server.listen(3000)

var tailFile = ''

//----------CONFIG COMPLETE----------------

var varlog = '/var/log'

app.get('/*', function(req, res){

	if(fs.statSync(varlog+req.originalUrl).isFile()){
		tailFile = req.originalUrl
		res.render('log')
	}
	else if(fs.statSync(varlog+req.originalUrl).isDirectory()){

		var directoryStructure = []

		var dirList = fs.readdirSync(varlog + req.originalUrl)

		dirList.forEach(function(files){
			/*`directoryStructure` tells if object is file or directory
			for GUI purposes. Appropriate icons to be shown. */
			if(fs.statSync(varlog + req.originalUrl + "/" + files).isFile()){
				directoryStructure.push({
					name: files,
					isFile: true
				})
			}
			else{
				directoryStructure.push({
					name: files,
					isFile: false
				})
			}
		})

			
		res.render('index', {
			listing: directoryStructure,
			url: req.originalUrl //to be appended to links in view
		})
	}
	else{
		console.log('Other format to be handled accordingly')
	}
})



//--------------- Sockets.io -----------------

io.on('connection', function(socket){
	var tail = child_process.spawn('tail', ['-f', '-n', 10 , varlog + tailFile])

	tail.stdout.on('data', (data) => {
	  io.emit('tailstream', data.toString().split("\n"))
	});

	socket.on ('disconnect', function (socket){
	    tail.kill()
	    console.log('user disconnected')
	});

})