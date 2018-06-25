import {IMessage} from "./message";
import {db} from "../lib/DB";

export class MessagesDb{
    private messages:{};
    constructor(){
        this.messages = {};
    }

    addMessageToGroup(message:IMessage, groupId:string){
        if(this.messages[groupId]){
            this.messages[groupId].push(message);
        }
        else{
            this.messages[groupId] = [message];
        }
    }

    addMessageUsersConversation(message:IMessage, user1Id:string, user2Id:string){
        const conversationId = this.createUniqIdForUsersConversatuin(user1Id, user2Id);

        if(this.messages[conversationId]){
            this.messages[conversationId].push(message);
        }
        else{
            this.messages[conversationId] = [message];
        }
    }

    async getConversationMessages(conversationId){
       const allMessages = await db.readFile('messages.json');
       if(allMessages.data[conversationId]){
           return allMessages.data[conversationId]
       }
       allMessages.data[conversationId] = [];
       return allMessages.data[conversationId];
    }

    getGroupMessages(groupId:string){
        if(this.messages[groupId]){
            return this.messages[groupId];
        }
        return [];
    }

    getUsersConversationMessages(user1Id:string, user2Id:string){
        const conversationId = this.createUniqIdForUsersConversatuin(user1Id, user2Id);
        if(this.messages[conversationId]){
            return this.messages[conversationId];
        }
        return [];
    }

    createUniqIdForUsersConversatuin(user1Id:string, user2Id:string){
        return [user1Id, user2Id].sort().join("_");
    }
}

export const messagesDb = new MessagesDb();