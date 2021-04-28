import * as http from 'http';
import * as mongoose from "mongoose";
import * as io from "socket.io";
import {TodoItem} from "./model/TodoItem";
import {FilterQuery, UpdateQuery} from "mongoose";

const port: number = Number(process.env.PORT) || 3000;

enum ApiEvent {
    LIST = "item/list",
    CREATE = "item/create",
    FOCUS = "item/focus",
    BLUR = "item/blur",
    UPDATE = "item/update",
    REMOVE = "item/remove",
}
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017', { useFindAndModify: false })
    .then(() => console.log("MongoDB connection established"))
    .catch((err: Error) => {
        console.error("Please check you MongoDB configuration!", err);
    });

const httpServer = http.createServer();
const socketServer = new io.Server(httpServer, {
    cors: {
        origin: "https://djemeljanovs.github.io",
        methods: ["GET", "POST"],
        credentials: true
    }
});
socketServer.serveClient();
socketServer.attach(httpServer);

const sendAllItems = (socket: io.Socket) => {
    TodoItem.find({})
        .exec()
        .then((items: TodoItem[]) => socket.emit(ApiEvent.LIST, items))
        .catch(error => console.error(error));
}

const updateItem = (filter: FilterQuery<TodoItem>, update: UpdateQuery<TodoItem>) => {
    TodoItem.findOneAndUpdate(filter, update, {new: true})
        .exec()
        .then(item => {
            if(item) {
                console.log('update: ' + JSON.stringify(item));
                socketServer.emit(ApiEvent.UPDATE, item);
            }
        })
        .catch(error => console.error(error));
}

socketServer.on<"connection">("connection", (socket: io.Socket) => {
    socket.on('disconnecting', () => {
        updateItem({controlledBy: socket.id}, {controlledBy: undefined});
    });
    socket.on('disconnect', () => {
        updateItem({controlledBy: socket.id}, {controlledBy: undefined});
    });
    socket.on(ApiEvent.CREATE, () => {
        new TodoItem({text: ''})
            .save()
            .then((item: TodoItem) => {
                socketServer.emit(ApiEvent.UPDATE, item);
            })
            .catch(error => console.error(error));
    });
    socket.on(ApiEvent.REMOVE, (data: {id: string}) => {
        TodoItem.findOneAndRemove({_id: data.id})
            .exec()
            .then(item => {
                socketServer.emit(ApiEvent.REMOVE, item);
            })
            .catch(error => console.error(error));
    });
    socket.on(ApiEvent.FOCUS, (data: {id: string}) => {
        updateItem({_id: data.id}, {controlledBy: socket.id});
    });
    socket.on(ApiEvent.BLUR, (data: {id: string}) => {
        updateItem({_id: data.id}, {controlledBy: null});
    });
    socket.on(ApiEvent.UPDATE, (data: {id: string, text: string}) => {
        updateItem({_id: data.id}, {controlledBy: socket.id, text: data.text});
    })
    sendAllItems(socket);
});

httpServer.listen(port, () => {
    console.log(`Server started on port ${port}`);
});