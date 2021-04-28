import * as mongoose from 'mongoose';

export const TodoItemSchemaName = "TodoItem";

export type TodoItem = {
    text: string;
    controlledBy: string | null;
} & mongoose.Document;

export const TodoItem = mongoose.model<TodoItem>(TodoItemSchemaName, new mongoose.Schema({
    text: String,
    controlledBy: {type: String, default: null},
}));

