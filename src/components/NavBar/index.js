import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Typography from "@material-ui/core/es/Typography/Typography";
import Button from '@material-ui/core/Button';

const NavBar = ({ parent }) => {
    return (
        <AppBar position="static">
            <Toolbar style={{ backgroundColor: '#000000' }}>
                <img style = {{maxHeight: '70px'}} src="capena.png" alt="logo" />
                <Typography variant="h6">
                    Capena - Delega: Credentials Issuer Demo
                        </Typography>
                <div style={{ flexGrow: 1 }}></div>
                <Button style={{ color: 'white' }} onClick={() => parent.registerFormOpen(true)}>
                    Register
                        </Button>
                <Button style={{ color: 'white' }} onClick={() => parent.loginFormOpen(true)}>
                    {parent.getLoginLabel()}
                </Button>
            </Toolbar>
        </AppBar>
    )
};

export default NavBar
