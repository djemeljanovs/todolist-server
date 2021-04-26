import * as http from 'http';
import * as mongoose from "mongoose";
import * as io from "socket.io";

const port: number = Number(process.env.PORT) || 3000;

declare module 'socket.io' {

}
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017')
    .then(() => console.log("DATABASE CONNECTED"))
    .catch((err: Error) => {
        console.error("Please check you MongoDB configuration!", err);
    });

const httpServer = http.createServer();
const socketServer = new io.Server(httpServer);
socketServer.serveClient();
socketServer.attach(httpServer);
socketServer.on("connection", (socket: io.Socket) => {
    console.log('a user connected : ' + socket.id);
    socket.send("Hello!");
});

httpServer.listen(port, () => {
    console.log(`Server started on port ${port} :)`);
});