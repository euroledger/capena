import React, { Component } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/es/Typography/Typography";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { TextField } from "@material-ui/core";
import axios from 'axios';
import QRcode from 'qrcode.react';
import Spinner from './Spinner';


// import logo from "./"; {/*add streetcred logo*/}

axios.defaults.baseURL = 'http://localhost:3002/';
export class App extends Component {
    state = {
        name: "",
        score: "",
        // org: "",
        // phone: "",
        // email: "",

        qr_open: false,
        qr_hasClosed: false,
        qr_placeholder: "",
        qr_feedbackCollected: false,
        invite_url: "",
        credential_accepted: true,
        has_been_revoked: true,
        loading: false,
        register: true
    };

    handleSubmit() {
        this.setState({
            loading: true
        });
        setTimeout(() => {
            console.log("DONE!");
            this.setState({
                qr_feedbackCollected: true,
                loading: false,
                name: 'Spock',
                score: '2013'
            });
        }, 3000);
    }

    onIssue = async () => {
        const ebayDSR = {
            name: this.state.name,
            score: this.state.score
        }
        this.setState({
            credential_accepted: false
        });
        await axios.post('/api/issue', ebayDSR);

        // axios.post('/api/issue', ebayDSR).then((response) => {
        //     console.log(response);
        //     this.setState({ invite_url: "https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url });
        // });
        // this.setState({
        //     qr_open: true,
        //     qr_placeholder: this.state,
        //     qr_hasClosed: true
        // })
        // axios.post('/api/connected', ebayDSR).then((response) => {
        //     this.setState({
        //         qr_open: false
        //     })
        // });
        await axios.post('/api/credential_accepted', ebayDSR);
        this.setState({ 
            credential_accepted: true,
            has_been_revoked: false
        });

    }

    // onReIssue = async () => {
    //     const ebayDSR = {
    //         name: this.state.name,
    //         score: this.state.score
    //     }
    //     console.log("ReIssue credentials...");
    //     await axios.post('/api/issue', ebayDSR);
    //     console.log("Bollocks");
    //     this.setState({
    //         has_been_revoked: false,
    //     });
    // }

    onRevoke = async () => {

        console.log("Revoking credentials...");
        await axios.post('/api/revoke', null);

        this.setState({
            has_been_revoked: true,
        });
    }

    postRegister = async () => {
        // const ebayDSR = {
        //     name: this.state.name,
        //     score: this.state.score
        // }
        // console.log(ebayDSR);
        const response = await axios.post('/api/register', null);
        console.log(response);
        this.setState({ invite_url: "https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url });
        
        await axios.post('/api/connected', null);
        this.setState({
            qr_open: false,
            credential_accepted: false 
        });

        await axios.post('/api/credential_accepted', null);
        this.setState({ 
            credential_accepted: true 
        });
    }

    register = () => {
        this.setState({
            qr_open: true,
            qr_placeholder: this.state,
            qr_hasClosed: true
        });
        if (!this.state.connected) {
            this.postRegister();
            return;
        }

        axios.post('/api/connected', null).then((response) => {
            this.setState({
                qr_open: false,
                connected: true
            });
            this.postRegister();
        });

    }

    onFeedback = () => {
        console.log("Getting feedback...")
        this.handleSubmit();
    }

    getLabel() {
        if (!this.state.qr_feedbackCollected) {
            return "Password";
        }
        else {
            return "Feedback Score";
        }
    }

    getInitialAcceptedLabel() {
        console.log("QUACK 1 credential_accepted = ", this.credential_accepted);
        return (this.state.credential_accepted ? "Import User Credentials from eBay" : "Awaiting Acceptance...");
    }

    getAcceptedLabelRevoke() {
        console.log("QUACK 2 credential_accepted = ", this.credential_accepted);
        return (this.state.credential_accepted ? "Revoke Credential" : "Awaiting Acceptance...");
    }

    getAcceptedLabelIssue() {
        console.log("QUACK 3 credential_accepted = ", this.credential_accepted);
        return (this.state.credential_accepted ? "Issue Credential" : "Awaiting Acceptance...");
    }

    getDisabled() {
        return (!this.state.credential_accepted);
    }

    button() {
        if (!this.state.qr_feedbackCollected) {
            return (<Button style={{ backgroundColor: '#9b84ff' }}
                onClick={() => this.onFeedback()} disabled={this.getDisabled()}>
                {this.getInitialAcceptedLabel()} 
            </Button>)
        } else if (!this.state.has_been_revoked) {
            return (<Button style={{ backgroundColor: '#9b84ff' }} disabled={this.getDisabled()}
                onClick={() => this.onRevoke()}>
                {this.getAcceptedLabelRevoke()}
            </Button>)
        } else {
            return (<Button style={{ backgroundColor: '#9b84ff' }} disabled={this.getDisabled()}
                onClick={() => this.onIssue()} >
                 {this.getAcceptedLabelIssue()}
            </Button>)
        }

    }

    getQRCodeLabel() {
        return this.state.register ? "Scan this QR code to Register with Capena" : "Scan this QR code to Login"
    }

    render() {
        const card = this.state
        return (
            <div >
                {/* The AppBar */}
                <AppBar position="static">
                    <Toolbar style={{ backgroundColor: '#812bff' }}>
                        <img style={{}} />
                        <Typography variant="h6">
                            eBay Seller Rating Demo
                        </Typography>
                        <div style={{ flexGrow: 1 }}></div>
                        <Button style={{ color: 'white' }} onClick={() => this.register()}>
                            Register
                        </Button>
                        <Button style={{ color: 'white' }} onClick={() => this.login()}>
                            Login
                        </Button>
                    </Toolbar>
                </AppBar>

                {/* The Paper */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Paper style={{ display: 'flex', maxWidth: '600px', width: '100%', margin: '40px', padding: 40 }}>
                        <div style={{ display: 'flex', padding: '24px 24px', flexDirection: 'column', width: '100%' }}>
                            <div style={{ display: 'flex', marginBottom: '24px' }}>
                                <Typography variant="h5" style={{ flexGrow: 1 }}>
                                    Create your eBay Credential
                                </Typography>


                            </div>

                            <TextField
                                id="name"
                                label="User Name"
                                placeholder={"what's your ebay username?"}
                                value={card.name}
                                onChange={(e) => this.setState({ name: e.target.value })}
                                style={{ marginBottom: '12px' }}
                            />
                            <Spinner active={this.state.loading}></Spinner>
                            <TextField
                                id="score"
                                label={this.getLabel()}
                                placeholder={"what's your feedback score?"}
                                value={card.score}
                                onChange={(e) => this.setState({ score: e.target.value })}
                                style={{ marginBottom: '12px' }}
                            />
                            {/* <TextField  
                              id="org"
                              label="org"
                              placeholder={"where do you work?"} 
                              value={card.org}
                              onChange={(e) => this.setState({org: e.target.value})}
                              style={{marginBottom: '12px'}}
                              />
                            <TextField  
                              id="phone"
                              label="phone"
                              placeholder={"what's your #?"} 
                              value={card.phone}
                              onChange={(e) => this.setState({phone: e.target.value})}
                              style={{marginBottom: '12px'}}
                              />
                            <TextField  
                              id="email"
                              label="email"
                              placeholder={"what's your email?"} 
                              value={card.email}
                              onChange={(e) => this.setState({email: e.target.value})}
                              style={{marginBottom: '36px'}} 
                              /> */}

                            {this.button()}
                        </div>
                    </Paper>
                </div>
                <Dialog open={this.state.qr_open} onClose={() => this.setState({ qr_open: false, qr_hasClosed: true })}>
                    <DialogTitle style={{ width: "300px" }}>{this.getQRCodeLabel()}</DialogTitle>
                    <QRcode size="200" value={this.state.invite_url} style={{ margin: "0 auto", padding: "10px" }} />
                </Dialog>
            </div>
        )
    }
}
