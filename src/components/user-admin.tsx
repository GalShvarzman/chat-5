import * as React from 'react';
import ReactTable from "react-table";
import 'react-table/react-table.css'
import {Link} from "react-router-dom";
import './user-admin.css';

interface IUserAdminProps {
    users:any,
    refMenu:any,
    deleteUser(user:{name: string, age: string, id: string}):void
}

interface IUserAdminState {

}

class UserAdmin extends React.Component<IUserAdminProps, IUserAdminState>{
    constructor(props:IUserAdminProps){
        super(props)
    }

    // componentWillMount(){
    //     this.props.refMenu.closeMenu();
    // }

    // public changeColor=(state:any, rowInfo:any, column:any) => {
    //     return{
    //         style: {
    //             background: rowInfo.row.age > 20 ? "green" : "red"
    //         }
    //     }
    // };

    // private onDelete= (e:React.MouseEvent<HTMLButtonElement>) => {
    //     debugger;
    //     this.props.deleteUser(e)
    // };

    private onClickEvent = (state:any, rowInfo:any, column:any, instance:any) => {
        return {
            onClick: (e:any, handleOriginal:any) => {
                if(e.target.className === "fa fa-trash"){
                    this.props.deleteUser(rowInfo.original)
                }
                if (handleOriginal) {
                    handleOriginal();
                }
            }
        };
    };

    render(){
        const data = this.props.users;
        const columns = [
            {
                Header: 'ID',
                accessor: 'id',
                Cell:(props:any)=> (<><button className="delete-user-btn"><i className="fa fa-trash"/></button><span>{props.value}</span></>)
            }, {
                Header: 'Name',
                accessor: 'name',
                Cell: (props: any) => <Link className="user-name" to={{pathname: `/users/${props.original.id}/edit`, state:{user:props.original}}}>{props.value}</Link>
            }, {
                Header: 'Age',
                accessor: 'age',
                Cell: (props: any) => <Link className="user-age" to={{pathname: `/users/${props.original.id}/edit`, state:{user:props.original}}}>{props.value}</Link>
        }];

        return(
            <>
                <h1 className="users-header">Users</h1>
                <ReactTable getTdProps={this.onClickEvent} filterable={true} defaultSortDesc={true} defaultPageSize={13} minRows={13} className="table" data={data} columns={columns}/>
            </>
        )
    }
}

export default UserAdmin;