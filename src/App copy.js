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
        invite_url: "",
        credential_accepted: false,
        loading: false
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
    onIssue = () => {
        const ebayDSR = {
            name: this.state.name,
            score: this.state.score
        }
        console.log(ebayDSR);
        axios.post('/api/issue', ebayDSR).then((response) => {
            console.log(response);
            this.setState({ invite_url: "https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url });
        });
        this.setState({
            qr_open: true,
            qr_placeholder: this.state,
            qr_hasClosed: true
        })
        axios.post('/api/connected', ebayDSR).then((response) => {
            this.setState({
                qr_open: false
            })
        });
        axios.post('/api/credenial_accepted', ebayDSR).then((response) => {
            this.setState({
                credential_accepted: true
            })
        });

    }
    onReIssue = () => {
        const ebayDSR = {
            name: this.state.name,
            score: this.state.score
        }
        console.log("ReIssue credentials...");
        axios.post('/api/reissue', ebayDSR).then((response) => {
            console.log("Bollocks");
        });
        this.setState({
            qr_hasBeenRevoked: false,
        });
    }

    onRevoke = () => {

        console.log("Revoking credentials...");
        axios.post('/api/revoke', null).then((response) => {
            console.log("Bollocks");
        });
        this.setState({
            qr_hasBeenRevoked: true,
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

    getAcceptedLabel() {
        return (this.state.credential_accepted ? "Revoke Credential" : "Awaiting Acceptance...");
    }

    getDisabled() {
        return (!this.state.credential_accepted);
    }

    button() {
        if (!this.state.qr_feedbackCollected) {
            return (<Button style={{ backgroundColor: '#9b84ff' }}
                onClick={() => this.onFeedback()}>
                Import Credential from eBay
            </Button>)
        } else if (this.state.qr_hasBeenRevoked) {
            return (<Button style={{ backgroundColor: '#9b84ff' }}
                onClick={() => this.onReIssue()}>
                ReIssue Credential
            </Button>)
        } else if (this.state.qr_hasClosed) {
            return (<Button style={{ backgroundColor: '#9b84ff' }}  disabled = {this.getDisabled()}
                onClick={() => this.onRevoke()}>
                {this.getAcceptedLabel()}
            </Button>)
        } else {
            return (<Button style={{ backgroundColor: '#9b84ff' }}
                onClick={() => this.onIssue()}>
                Issue Credential
            </Button>)
        }

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
                        <Button href="https://www.streetcred.id" style={{ color: 'white' }}>
                            Capena
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
                    <DialogTitle style={{ width: "300px" }}>Scan this QR code</DialogTitle>
                    <QRcode size="200" value={this.state.invite_url} style={{ margin: "0 auto", padding: "10px" }} />
                </Dialog>
            </div>
        )
    }
}
