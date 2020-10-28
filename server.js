const http = require('http');
const os = require('os');
const socketIO = require('socket.io');
const nodeStatic = require('node-static');

let fileServer = new(nodeStatic.Server)();
let app = http.createServer((req,res)=>{
	res.setHeader("Access-Control-Allow-Origin", "*");
    fileServer.serve(req,res);
}).listen(8080);

let io = socketIO.listen(app);
io.sockets.on('connection',socket=>{
	
	socket.on('disconnect', function() {
		socket.broadcast.emit('targetDisconnect', "");
	});
   
    function log() {
        let array = ['Message from server:'];
        array.push.apply(array,arguments);
        socket.emit('log',array);
    }

    socket.on('message',message=>{
        log('Client said : ' ,message);
        socket.broadcast.emit('message',message);
    });

    socket.on('create or join',room=>{
        let clientsInRoom = io.sockets.adapter.rooms[room];
        let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');
        
        if(numClients === 0){
            log('create room!');
            socket.join(room);
            console.log('Client ID ' + socket.id + ' created room ' + room + ' - ' + numClients);
            socket.emit('created',room,socket.id);
        }
        else if(numClients===1){
            log('join room!');
            console.log('Client Id ' + socket.id + ' joined room ' + room + ' - ' + numClients);
            io.sockets.in(room).emit('join',room);
            socket.join(room);
            socket.emit('joined',room,socket.id);
            io.sockets.in(room).emit('ready');
        }else{
            socket.emit('full',room);
        }
    });


});
