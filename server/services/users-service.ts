import users from '../models/users';
import {createHash, compareHash} from "../utils/hash";
import {ClientError} from "../utils/client-error";
import {nTree} from "../models/tree";
import User from "../models/user";


class UsersService{

    async getAllUsers():Promise<{data:{name:string, age:number, id:string}[]}>{
        const usersList =  await users.getUsersFullData();
        const result = usersList.data.map((user)=>{
            return {"name":user.name, "age":user.age, "id":user.id}
        });
        return {data:result};
    }

    async saveUserDetails(userDetails:{name:string, age?:number, id:string, password?:string}):Promise<{user:{name:string, age:number, id:string}}> {
        const usersData = await users.getUsersFullData();
        const userIndex = users.getUserIndexById(usersData, userDetails.id);
        if (userDetails.age) {
            usersData.data[userIndex].age = userDetails.age;
        }
        if (userDetails.password) {
            usersData.data[userIndex].password = await createHash(userDetails.password); // fixme
        }
        await users.updateUsersFile(usersData);
        return ({user:{name:usersData.data[userIndex].name, age:usersData.data[userIndex].age, id:usersData.data[userIndex].id}});
    }


    async deleteUser(id):Promise<void>{
        // fixme - delete also chat messages history....

        await users.deleteUser(id);
        const connectorsList = await nTree.getConnectorsList();
        connectorsList.data = connectorsList.data.filter((connector)=>{
            return connector.id !== id;
        });
        nTree.updateFile(connectorsList, 'connectors.json');
    }

    async createNewUser(user):Promise<{user:{name:string, age:number, id:string}}>{
        const usersData = await users.getUsersFullData();
        if(await users.isUserExists(usersData, user.name)){
            throw new ClientError(400, "usernameAlreadyExist") // fixme status??
        }
        else{
            const newUser = new User(user.name, user.age);
            newUser.password = await createHash(user.password);
            return await users.createNewUser(newUser);
        }
    }

    async authUser(userToAuth) {
        const usersList = await users.getUsersFullData();
        const userIndex = usersList.data.findIndex((user) => {
            return user.name === userToAuth.name;
        });
        if (userIndex !== -1) {
            const userDetails = usersList.data[userIndex];
            try {
                await compareHash(userToAuth.password, userDetails.password);
                return ({
                    id: userDetails.id,
                    name: userDetails.name,
                    age: userDetails.age
                });
            }
            catch (e) {
                throw new ClientError(404, "auth failed");
            }
        }
    }

}

const usersService = new UsersService();

export default usersService;