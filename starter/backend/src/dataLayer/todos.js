import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWSXRay from 'aws-xray-sdk-core'

export class TODOAccess {
    constructor(
      documentClient = AWSXRay.captureAWSv3Client(new DynamoDB()),
      todosTable = process.env.TODOS_TABLE,
      bucketName = process.env.TODOS_S3_BUCKET,
      urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

    ) {
      this.documentClient = documentClient
      this.todosTable = todosTable
      this.dynamoDbClient = DynamoDBDocument.from(this.documentClient)
      this.s3Client = new S3Client()
      this.bucketName = bucketName,
      this.urlExpiration = urlExpiration
    }
  
    async getAllTodos(userId) {
        console.log('Getting all todos')

        const params = {
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }

        const result = await this.dynamoDbClient.query(params)

        return result.Items
    }
  
    async createTodo(todo) {
      await this.dynamoDbClient.put({
        TableName: this.todosTable,
        Item: todo
      })
  
      return todo
    }

    async updateTodo(todoId, userId, updatedTodo) {
        await this.dynamoDbClient.update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          ExpressionAttributeNames: {
            '#N': 'name'
          },
          UpdateExpression: 'SET #N = :name, dueDate = :dueDate, done = :done',
          ExpressionAttributeValues: {
            ':name': updatedTodo.name,
            ':dueDate': updatedTodo.dueDate,
            ':done': updatedTodo.done
          }
        })

        return updatedTodo
    }

    async updateTodoAttachment(todoId, userId, attachmentUrl) {
        await this.dynamoDbClient.update({
          TableName: this.todosTable,
          Key: {
            todoId,
            userId
          },
          UpdateExpression: 'SET attachmentUrl = :attachment',
          ExpressionAttributeValues: {
            ':attachment': attachmentUrl
          }
        })

        return attachmentUrl
    }

    async deleteTodo(todoId, userId) {
        try {
          await this.dynamoDbClient.delete({
            TableName: this.todosTable,
            Key: {
              todoId,
              userId
            }
          })
        } catch(err) {
          createLogger(`Error while deleting document: ${err}`)
        }
    }

    async getTodo(todoId, userId) {
        const result = await this.dynamoDbClient
          .get({
            TableName: this.todosTable,
            Key: {
              todoId,
              userId
            }
          })
    
        return result.Item
    }

    async getUploadUrl(todoId) {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: todoId
        })

        const url = await getSignedUrl(this.s3Client, command, {
          expiresIn: this.urlExpiration
        })
        return url
      }
}