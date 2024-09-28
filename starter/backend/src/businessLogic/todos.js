import * as uuid from 'uuid'

import { TODOAccess } from '../dataLayer/todos.js'

const todoAccess = new TODOAccess()

export async function getAllTodos(userId){
    return await todoAccess.getAllTodos(userId)
}

export async function createTodo(newTodo, userId) {
    const todoId = uuid.v4()
  
    return await todoAccess.createTodo({
      todoId,
      userId,
      ...newTodo
    })
}

export async function updateTodo(todoId, userId, payload) {
    return await todoAccess.updateTodo(todoId, userId, payload)
}

export async function deleteTodo(todoId, userId){
    await todoAccess.deleteTodo(todoId, userId)
}

export async function todoExists(todoId, userId) {
    const item = await todoAccess.getTodo(todoId, userId)
    return !!item
}

export async function getUploadUrl(todoId, userId) {
    const bucketName = process.env.TODOS_S3_BUCKET
    const signedUrl = todoAccess.getUploadUrl(todoId)
  
    if (signedUrl) {
      await addAttachmentUrl(bucketName, todoId, userId)
      return signedUrl
    }
}

async function addAttachmentUrl(bucketName, todoId, userId) {
    const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`
  
    await todoAccess.updateTodoAttachment(todoId, userId, attachmentUrl)
}