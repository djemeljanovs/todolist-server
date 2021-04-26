import * as mongoose from 'mongoose';

export type TodoItem = {
    id: string;
    text: string;
} & mongoose.Document;

export const TodoItemModel = mongoose.model<TodoItem>("TodoItem", new mongoose.Schema({
    id: String,
    text: String,
}));

