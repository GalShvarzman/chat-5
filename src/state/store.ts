import {IMessage} from "../models/message";
import {addMessage, getSelectedMessages, getTree, auth, deleteUserFromGroup,
    getGroupOptionalUsers, saveGroupDetails, addUsersToGroup, getUsers, saveUserDetails,
    deleteUser, createNewUser,createNewGroup, getGroups, getGroupData, deleteGroup,
    getGroupsWithGroupsChildren} from '../server-api';
import {IClientGroup, IClientUser, ITree} from "../interfaces";
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

interface IState {
    tree:any[],
    users:IClientUser[],
    groups:IClientGroup[],
    selectedMessages:IMessage[],
    loggedInUser:IClientUser,
    loginErrorMsg:string,
    updateErrorMsg:string,
    updatedGroup:IClientGroup
}

const initialState:{} = {
    tree:[],
    users:[],
    groups:[],
    selectedMessages:[],
    loggedInUser:null,
    loginErrorMsg:null,
    updatedGroup:null,
    updateErrorMsg:null
};

function reducer (state:any, action:any){
    if(action.type == "SET_TREE"){
        return setTree(state, action.tree);
    }
    if(action.type == "SET_GROUPS"){
        return setGroups(state, action.groups);
    }
    if(action.type == "SET_USERS"){
        return setUsers(state, action.users);
    }
    if(action.type == "SET_SELECTED_MESSAGES"){
        return setSelectedMessages(state, action.messages);
    }
    if(action.type == "UPDATE_USERS_AFTER_EDIT_USER_DETAILS"){
        return updateUsersAfterEditUserDetails(state, action.user);
    }
    if(action.type == "UPDATE_GROUPS_AFTER_EDIT_GROUP_NAME"){
        return updateGroupsAfterEditGroupName(state, action.group, action.updateErrorMsg);
    }
    if(action.type == "USER_AFTER_AUTH"){
        return userAfterAuth(state, action.loggedInUser, action.loginErrorMsg);
    }
    if(action.type == "USER_AUTH_FAILED"){
        return afterAuthFailed(state, action.loginErrorMsg)
    }
    if(action.type == "UPDATE_FAILED"){
        return updateDetailsFailed(state, action.updateErrorMsg)
    }
    return state;
}

function setTree(state:IState, tree:{}[]){
    return{
        ...state,
        tree
    }
}

function setGroups(state:IState, groups:{}[]){
    return{
        ...state,
        groups
    }
}

function setUsers(state:IState, users:{}[]){
    return{
        ...state,
        users
    }
}

function setSelectedMessages(state:IState, selectedMessages:any[]){
    return{
        ...state,
        selectedMessages
    }
}

function updateUsersAfterEditUserDetails(state:IState, updatedUser:any){
    const users = state.users;
    const usersClone = [...users];
    const userIndex = usersClone.findIndex((user) => {
        return user.id === updatedUser.user.id;
    });
    usersClone[userIndex] = updatedUser.user;
    return{
        ...state,
        users : usersClone
    }
}

function updateGroupsAfterEditGroupName(state:IState, updatedGroup:any, updateErrorMsg:string){
    const groups = state.groups;
    const groupsClone = [...groups];
    const groupIndex = groupsClone.findIndex((group) => {
        return group.id === updatedGroup.group.id;
    });
    groupsClone[groupIndex] = updatedGroup.group;
    return{
        ...state,
        groups : groupsClone,
        updatedGroup,
        updateErrorMsg
    }
    // const tree = await getTree();
    // this._set('tree', tree);
}

function userAfterAuth(state:IState, loggedInUser:IClientUser, loginErrorMsg:string){
    return {
        ...state,
        loggedInUser,
        loginErrorMsg
    }
}

function afterAuthFailed(state:IState, loginErrorMsg:string){
    return{
        ...state,
        loginErrorMsg
    }
}

function updateDetailsFailed(state:IState, updateErrorMsg:string){
    return{
        ...state,
        updateErrorMsg
    }
}

export const store = createStore(reducer, initialState, applyMiddleware(thunk));


// interface IStateStoreService {
//     get(key: string): any | null,
//     subscribe(listener:any): void,
//     unsubscribe(listener:any):void
// }

export class StateStoreService {
    listeners: Function[];

    constructor() {
        this.listeners = [];
        this.init()
    }

    private async init() {
        return Promise.all([getGroups(), getUsers(), getTree()])
            .then((results) => {
                this._set('groups', results[0].data);
                this._set('users', results[1].data);
                this._set('tree', results[2]);
                this.onStoreChanged(['users', 'groups', 'tree']);
            })
    }

    private _set(key: string, val: any) {
        StateStore.getInstance()[key] = val;
    }

    public get(key: string) {
        return StateStore.getInstance()[key] || [];
    }



    public isUserExistInGroup(selectedId:string, loggedInUserId:string){
        const tree = this.get('tree');
        debugger;
        const allGroups = this.flatTreeGetAllGroups(tree.items);
        const selectedGroup = allGroups.find((group)=>{
            return group.id === selectedId
        });
        if(selectedGroup.items) {
            const userIndex = selectedGroup.items.findIndex((item: any) => {
                return item.id === loggedInUserId
            });
            return (userIndex !== -1);
        }
        else{
            return false;
        }
    }




    private flatTreeGetAllGroups(items:any){
        const result:any[] = [];
        items.forEach((item:any)=>{
            if(item.type === 'group'){
                result.push(item);
                if(item.items){
                    result.push(...this.flatTreeGetAllGroups(item.items));
                }
            }
        });
        return result;
    }



    public getUsers() {
        return StateStore.getInstance().users;
    }

    public getGroups() {
        return StateStore.getInstance().groups;
    }

    public getTree() {
        return StateStore.getInstance().tree;
    }

    async getOptionalGroupParents() {
        const result = await getGroupsWithGroupsChildren();
        return result.data;
    }





    public async deleteUser(userToDelete: IClientUser): Promise<void> {
        await deleteUser(userToDelete);
        const users = this.get('users');
        const usersClone = [...users];
        const userIndex = usersClone.findIndex((user) => {
            return user.id === userToDelete.id;
        });
        usersClone.splice(userIndex, 1);
        this._set('users', usersClone);
        const tree = await getTree();
        this._set('tree', tree);
        this.onStoreChanged(['users', 'tree']);
    }

    public async deleteGroup(groupToDelete: IClientGroup) {
        await deleteGroup(groupToDelete);
        const groups = await getGroups();
        this._set('groups', groups.data);
        const tree = await getTree();
        this._set('tree', tree);
        this.onStoreChanged(['groups', 'tree']);
    }

    public async getGroupData(groupId: string) {
        return await getGroupData(groupId);
    }

    public async createNewUser(user: IClientUser): Promise<{ user: IClientUser }> {
        const newUser = await createNewUser(user);
        const users = this.get('users');
        this._set('users', users.concat([newUser.user]));
        this.onStoreChanged(['users']);
        return newUser;
    }

    public async createNewGroup(group: { name: string, parent: string }): Promise<{ group: IClientGroup }> {
        const newGroup = await createNewGroup(group);
        const groups = this.get('groups');
        this._set('groups', groups.concat([newGroup]));
        const tree = await getTree();
        this._set('tree', tree);
        this.onStoreChanged(['groups', 'tree']);
        return newGroup;
    }

    public async getOptionalUsers(groupId: string) {
        return await getGroupOptionalUsers(groupId);
    }

    public async addUsersToGroup(data: { usersIds: string[], groupId: string }) {
        await addUsersToGroup(data);
        const tree = await getTree();
        this._set('tree', tree);
        this.onStoreChanged(['tree']);
    }

    public subscribe(listener: any) {
        this.listeners.push(listener);
    }

    public unsubscribe(listener: any) {
        const index = this.listeners.findIndex(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    private onStoreChanged(whatChanged: string[]) {
        const event = {changed: whatChanged};
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    public async deleteUserFromGroup(userId: string, groupId: string) {
        await deleteUserFromGroup(userId, groupId);
        const tree = await getTree();
        this._set('tree', tree);
        this.onStoreChanged(['tree']);
    }

}

interface IStateStore {
    users : IClientUser[],
    tree:ITree,
    groups:IClientGroup[]
}


class StateStore implements IStateStore {
    public users:IClientUser[];
    public tree:ITree;
    public groups:IClientGroup[];

    static instance: IStateStore;

    static getInstance() {
        if (!StateStore.instance) {
            StateStore.instance = new StateStore();
        }

        return StateStore.instance;
    }
}

export default StateStore;

export const stateStoreService: StateStoreService = new StateStoreService();