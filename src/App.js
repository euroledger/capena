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
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';

// import logo from "./"; {/*add streetcred logo*/}

axios.defaults.baseURL = 'https://localhost:3002/';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
export class App extends Component {
    state = {
        user: {
            UserID: "",
            FeedbackScore: "",
            RegistrationDate: "",
            UniqueNegativeFeedbackCount: "",
            UniquePositiveFeedbackCount: "",
            PositiveFeedbackPercent: ""
        },

        qr_open: false,
        qr_hasClosed: false,
        qr_placeholder: "",
        qr_feedbackCollected: false,
        invite_url: "",
        credential_accepted: true,
        verification_accepted: true,
        has_been_revoked: true,
        loading: false,
        register: true,
        register_form_open: false,
        login: false,
        login_form_open: false,
        firstname: '',
        lastname: '',
        email: '',
        country: '',
        userData: {}
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
                user: {
                    UserID: 'Spock',
                    FeedbackScore: '2019'
                }
            });
        }, 3000);
    }
   
    onIssue = async () => {
        const ebayDSR = {
            name: this.state.user.UserID,
            feedbackscore: this.state.user.FeedbackScore.toString(),
            registrationdate: this.state.user.RegistrationDate,
            negfeedbackcount: this.state.user.UniqueNegativeFeedbackCount.toString(),
            posfeedbackcount: this.state.user.UniquePositiveFeedbackCount.toString(),
            posfeedbackpercent: this.state.user.PositiveFeedbackPercent.toString()
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


    onRevoke = async () => {

        console.log("Revoking credentials...");
        await axios.post('/api/revoke', null);

        this.setState({
            has_been_revoked: true,
        });
    }

    onVerify = async () => {
        this.setState({
            verification_accepted: false,
        });
        console.log("Verifying credentials...");
        await axios.post('/api/sendkeyverification', null);
        await axios.post('/api/verification_accepted', null);
        this.setState({
            verification_accepted: true,
            has_been_revoked: false
        });
    }

    getLoginLabel() {
        return this.state.login ? this.state.email : "Login"
    }

    postLogin = async () => {
        console.log("hello from postLogin!");

        // this.setState({
        //     credential_accepted: false
        // });
        const loginInfo = { email: this.state.email };
        let resp;
        try {
            resp = await axios.post('/api/login', loginInfo);
        }
        catch (e) {
            console.log(e);
        }

        if (resp && resp.status === 200) {
            this.setState({
                login: true,
            });
        } else {
            console.log("no connection found")
        }
    }


    postRegister = async () => {
        const registrationInfo = {
            firstname: this.state.firstname,
            lastname: this.state.lastname,
            email: this.state.email,
            country: this.state.country
        }
        console.log(registrationInfo);
        const response = await axios.post('/api/register', registrationInfo);
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
            register_form_open: true
        })
    }

    login = () => {
        this.setState({
            login_form_open: true
        })
    }

    ebayAuth = async () => {
        this.setState({
            loading: true
        });

        console.log("Going across to eBay!");
        const res = await axios.get('/auth/ebay');

        window.location = res.data;

        const user = await axios.post('/api/feedback');

        console.log("User Data = ", user.data);

        this.setState({
            qr_feedbackCollected: true,
            user: {
                UserID: user.data.UserID,
                FeedbackScore: user.data.FeedbackScore,
                RegistrationDate: user.data.RegistrationDate.substring(0, 10),
                UniqueNegativeFeedbackCount: user.data.UniqueNegativeFeedbackCount,
                UniquePositiveFeedbackCount: user.data.UniquePositiveFeedbackCount,
                PositiveFeedbackPercent: user.data.PositiveFeedbackPercent,
            },
            loading: false
        });
        window.stop();
    }

    onFeedback = () => {
        console.log("Getting feedback...")
        // this.handleSubmit();
        this.ebayAuth();
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
        return (this.state.credential_accepted ? "Import User Credentials from eBay" : "Awaiting Acceptance...");
    }

    getAcceptedLabelRevoke() {
        return (this.state.credential_accepted ? "Revoke Credential" : "Awaiting Acceptance...");
    }

    getAcceptedLabelIssue() {
        return (this.state.credential_accepted ? "Issue Credential" : "Awaiting Acceptance...");
    }

    getAcceptedLabelVerify() {
        return (this.state.verification_accepted ? "Verify Credential" : "Awaiting Acceptance...");
    }

    getDisabled() {
        return (!this.state.credential_accepted);
    }

    getVerifyDisabled() {
        return (this.state.has_been_revoked || !(this.state.verification_accepted));
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

    button2() {
        return (<Button style={{ backgroundColor: '#e8624a', marginTop: '20px' }} disabled={this.getVerifyDisabled()}
            onClick={() => this.onVerify()}>
            {this.getAcceptedLabelVerify()}
        </Button>)
    }

    getQRCodeLabel() {
        return this.state.register ? "Scan this QR code to Register with Capena" : "Scan this QR code to Login"
    }

    handleRegisterClose() {
        this.setState({
            register_form_open: false
        });
    }

    handleLoginClose() {
        this.setState({
            login_form_open: false
        });
    }

    handleFormSubmit(event) {
        event.preventDefault();
        console.log("firstname = ", this.state.firstname);
        console.log("lastname = ", this.state.lastname);
        console.log("email = ", this.state.email);
        console.log("country = ", this.state.country);

        // we want to send this info across to the user's wallet
        // call the 
        this.setState({
            qr_open: true
        });
        this.postRegister();
    }

    handleLoginFormSubmit(event) {
        event.preventDefault();

        console.log("email = ", this.state.email);

        this.postLogin();
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
                            Capena - Delega: eBay Seller Rating Demo
                        </Typography>
                        <div style={{ flexGrow: 1 }}></div>
                        <Button style={{ color: 'white' }} onClick={() => this.register()}>
                            Register
                        </Button>
                        <Button style={{ color: 'white' }} onClick={() => this.login()}>
                            {this.getLoginLabel()}
                        </Button>
                    </Toolbar>
                </AppBar>

                {/* The Paper */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Paper style={{ display: 'flex', maxWidth: '600px', width: '100%', margin: '20px', padding: 20 }}>
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
                                value={card.user.UserID}
                                // onChange={(e) => this.setState({ name: e.target.value })}
                                style={{ marginBottom: '12px' }}
                            />
                            <Spinner active={this.state.loading}></Spinner>
                            <TextField
                                id="score"
                                label={this.getLabel()}
                                placeholder={"what's your feedback score?"}
                                value={card.user.FeedbackScore}
                                // onChange={(e) => this.setState({ score: e.target.value })}
                                style={{ marginBottom: '12px' }}
                            />
                            <TextField
                                id="org"
                                label="Registration Date"
                                //   placeholder={"where do you work?"} 
                                value={card.user.RegistrationDate}
                                //   onChange={(e) => this.setState({org: e.target.value})}
                                style={{ marginBottom: '12px' }}
                            />
                            <TextField
                                id="nfeedcount"
                                label="Negative Feedback Count"
                                placeholder={"what's your #?"}
                                value={card.user.UniqueNegativeFeedbackCount}
                                //   onChange={(e) => this.setState({phone: e.target.value})}
                                style={{ marginBottom: '12px' }}
                            />
                            <TextField
                                id="pfeedcount"
                                label="Postive Feedback Count"
                                placeholder={"what's your email?"}
                                value={card.user.UniquePositiveFeedbackCount}
                                //   onChange={(e) => this.setState({email: e.target.value})}
                                style={{ marginBottom: '12px' }}
                            />
                            <TextField
                                id="pfeedpercent"
                                label="Postive Feedback Percent"
                                placeholder={"what's your email?"}
                                value={card.user.PositiveFeedbackPercent}
                                //   onChange={(e) => this.setState({email: e.target.value})}
                                style={{ marginBottom: '24px' }}
                            />
                            {this.button()}
                            {this.button2()}
                            <Dialog open={this.state.register_form_open} onClose={() => this.handleRegisterClose()} aria-labelledby="form-dialog-title">
                                <DialogTitle id="form-dialog-title">Register</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        To register to this website, please enter your name, email address and location here.
                                </DialogContentText>
                                    <form noValidate autoComplete="off" onSubmit={(e) => this.handleFormSubmit(e)}>
                                        <TextField
                                            margin="dense"
                                            id="firstname"
                                            label="First Name"
                                            value={this.state.firstname}
                                            onChange={(e) => this.setState({ firstname: e.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            margin="dense"
                                            id="lastname"
                                            label="Last Name"
                                            value={this.state.lastname}
                                            onChange={(e) => this.setState({ lastname: e.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            margin="dense"
                                            id="email"
                                            label="Email Address"
                                            type="email"
                                            value={this.state.email}
                                            onChange={(e) => this.setState({ email: e.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            margin="dense"
                                            id="country"
                                            label="Country"
                                            type="country"
                                            value={this.state.country}
                                            onChange={(e) => this.setState({ country: e.target.value })}
                                            fullWidth
                                        />
                                        <DialogActions>
                                            <Button onClick={() => this.handleRegisterClose()} color="primary">
                                                Cancel
                                </Button>
                                            <Button type="submit" onClick={() => this.handleRegisterClose()} color="primary">
                                                Register
                                </Button>
                                        </DialogActions>
                                    </form>

                                </DialogContent>

                            </Dialog>
                            <Dialog open={this.state.login_form_open} onClose={() => this.handleLoginClose()} aria-labelledby="form-dialog-title">
                                <DialogTitle id="form-dialog-title">Login</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Please enter the email address you used to register, or register as a new user by clicking on "Register"
                                </DialogContentText>
                                    <form noValidate autoComplete="off" onSubmit={(e) => this.handleLoginFormSubmit(e)}>
                                        <TextField
                                            margin="dense"
                                            id="email"
                                            label="Email Address"
                                            type="email"
                                            value={this.state.email}
                                            onChange={(e) => this.setState({ email: e.target.value })}
                                            fullWidth
                                        />
                                        <DialogActions>
                                            <Button onClick={() => this.handleLoginClose()} color="primary">
                                                Cancel
                                </Button>
                                            <Button type="submit" onClick={() => this.handleLoginClose()} color="primary">
                                                Login
                                </Button>
                                        </DialogActions>
                                    </form>

                                </DialogContent>

                            </Dialog>
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