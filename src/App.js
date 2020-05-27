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

import Collapse from '@material-ui/core/Collapse';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';

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

        etsyuser: {
            UserID: "",
            FeedbackCount: "",
            PositiveFeedbackPercent: "",
            RegistrationDate: ""
        },
        qr_open: false,
        qr_hasClosed: false,
        qr_placeholder: "",
        invite_url: "",
        ebay: {
            qr_feedbackCollected: false,
            credential_accepted: true,
            verification_accepted: true,
            has_been_revoked: true,
            loading: false,
        },
        etsy: {
            qr_feedbackCollected: false,
            credential_accepted: true,
            verification_accepted: true,
            has_been_revoked: true,
            loading: false,
        },
        register: true,
        register_form_open: false,
        login: sessionStorage.getItem("login") === "true" ? true : false,
        login_form_open: false,
        firstname: '',
        lastname: '',
        email: '',
        connection_name: sessionStorage.getItem("name"),
        country: '',
        passcode: '',
        collapse_open: false,
        login_loading: false,
        userData: {}
    };

    handleSubmit() {

        this.setState(prevState => ({
            etsy: { ...prevState.etsy, loading: true }
        }));
        setTimeout(() => {
            console.log("DONE!");

            this.setState(prevState => ({
                etsy: {
                    ...prevState.etsy,
                    qr_feedbackCollected: true,
                    loading: false
                },
                etsyuser: {
                    UserID: 'Spock',
                    FeedbackScore: '2019'
                }
            }));
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

        this.setState(prevState => ({
            ebay: { ...prevState.ebay, credential_accepted: false }
        }));

        await axios.post('/api/issue', ebayDSR);

        await axios.post('/api/credential_accepted', null);
        this.setState(prevState => ({
            ebay: { ...prevState.ebay, credential_accepted: true, has_been_revoked: false }
        }));
    }

    onEtsyIssue = async () => {
        const etsyRatings = {
            name: this.state.etsyuser.UserID,
            feedbackcount: this.state.etsyuser.FeedbackCount.toString(),
            posfeedbackpercent: this.state.etsyuser.PositiveFeedbackPercent.toString(),
            registrationdate: this.state.etsyuser.RegistrationDate
        }

        this.setState(prevState => ({
            etsy: { ...prevState.etsy, credential_accepted: false }
        }));

        await axios.post('/api/etsy/issue', etsyRatings);

        await axios.post('/api/credential_accepted', null);
        this.setState(prevState => ({
            etsy: { ...prevState.etsy, credential_accepted: true, has_been_revoked: false }
        }));
    }


    onRevoke = async () => {

        console.log("Revoking credentials...");
        await axios.post('/api/revoke', null);

        this.setState(prevState => ({
            ebay: { ...prevState.ebay, has_been_revoked: true }
        }));
    }

    onVerify = async () => {

        this.setState(prevState => ({
            ebay: { ...prevState.ebay, verification_accepted: false }
        }));
        console.log("Verifying credentials...");
        await axios.post('/api/sendkeyverification', null);
        await axios.post('/api/verification_accepted', null);

        this.setState(prevState => ({
            ebay: { ...prevState.ebay, verification_accepted: true, has_been_revoked: false }
        }));
    }

    getLoginLabel() {
        console.log("WOOGIE login = ", this.state.login);
        return this.state.login ? this.state.connection_name : "Login"
    }

    postLogin = async () => {

        this.setState({
            login_loading: true
        });
        const loginInfo = { passcode: this.state.passcode };
        let resp;
        try {
            resp = await axios.post('/api/login', loginInfo);
        }
        catch (e) {
            console.log(e);
        }

        this.setState({
            login_loading: false
        });
        if (resp && resp.status === 200) {
            console.log("Connection  = ", resp.data);
            this.setState({
                login: true, connection_name: resp.data.name, login_form_open: false
            });
            console.log("Setting name to ", resp.data.name);
            sessionStorage.setItem("name", resp.data.name);
            sessionStorage.setItem("login", true);
        } else {
            console.log("no connection found");
            this.setState({
                collapse_open: true
            });
        }
    }


    postRegister = async () => {
        const passcode = Math.floor(Math.random() * 900000) + 100000;
        const registrationInfo = {
            firstname: this.state.firstname,
            lastname: this.state.lastname,
            email: this.state.email,
            country: this.state.country,
            passcode: passcode.toString()
        }
        console.log(registrationInfo);
        const response = await axios.post('/api/register', registrationInfo);
        console.log(response);
        this.setState({ invite_url: "https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url });

        await axios.post('/api/connected', null);

        this.setState(prevState => ({
            qr_open: false,
            ebay: { ...prevState.ebay, credential_accepted: false },
            etsy: { ...prevState.etsy, credential_accepted: false }
        }));

        await axios.post('/api/credential_accepted', null);
        console.log("setting login to true");
       
        this.setState(prevState => ({
            qr_open: false,
            login: true,
            ebay: { ...prevState.ebay, credential_accepted: true },
            etsy: { ...prevState.etsy, credential_accepted: true }
        }));
        this.setState({login: true});
    }

    register = () => {
        this.setState({
            register_form_open: true
        });
    }

    login = () => {
        this.setState({
            login_form_open: true
        });
    }

    formatDate = (date) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    etsyGetUserData = async () => {
        console.log("Waiting for the (ETSY) feedback to arrive...");
        const user = await axios.get('/api/etsy/feedback');

        let count = user.data.feedback_info["count"];
        let score = user.data.feedback_info["score"];

        score = score === null ? 0 : score;
        console.log("User Data info = ", user.data.feedback_info["score"]);
        console.log("score = ", score);

        this.setState(prevState => ({
            etsy: {
                ...prevState.etsy, qr_feedbackCollected: true,
                loading: false
            },
            etsyuser: {
                UserID: user.data.login_name,
                FeedbackCount: count,
                RegistrationDate: this.formatDate(new Date(user.data.creation_tsz * 1000)),
                PositiveFeedbackPercent: score
            }
        }));
        sessionStorage.setItem("waitingForEtsyUserData", "false");
    }

    ebayGetUserData = async () => {
        console.log("Waiting for the feedback to arrive...");
        const user = await axios.get('/api/ebay/feedback');

        console.log("User Data = ", user.data);

        this.setState(prevState => ({
            ebay: {
                ...prevState.ebay, qr_feedbackCollected: true,
                loading: false
            },
            user: {
                UserID: user.data.UserID,
                FeedbackScore: user.data.FeedbackScore,
                RegistrationDate: user.data.RegistrationDate.substring(0, 10),
                UniqueNegativeFeedbackCount: user.data.UniqueNegativeFeedbackCount,
                UniquePositiveFeedbackCount: user.data.UniquePositiveFeedbackCount,
                PositiveFeedbackPercent: user.data.PositiveFeedbackPercent,
            }
        }));

        window.stop();
        sessionStorage.setItem("waitingForEbayUserData", "false");
    }
    etsyAuth = async () => {
        console.log("Going across to Etsy!...");
        let res;
        try {
            res = await axios.get('/auth/etsy');
            // res = await axios.get('/mike');
        } catch (e) {
            console.log(">>>>>>>>>>>>>> CLOBBER e = ", e);
        }

        sessionStorage.setItem("waitingForEtsyUserData", "true");
        window.location = res.data;
        this.etsyGetUserData();
    }

    ebayAuth = async () => {
        this.setState(prevState => ({
            ebay: { ...prevState.ebay, loading: true }
        }));

        console.log("Going across to eBay! This route returns the Url for sign-in to ebay");
        const res = await axios.get('/auth/ebay');

        sessionStorage.setItem("waitingForEbayUserData", "true");
        // switch to that URL
        window.location = res.data;

        this.ebayGetUserData();
    }

    onFeedback = () => {
        console.log("Getting eBay feedback...")
        this.ebayAuth();
    }

    onEtsyFeedback = () => {
        console.log("Getting Etsy feedback...")
        this.etsyAuth();
    }
    getLabel(platform) {
        if (!this.state[platform].qr_feedbackCollected) {
            return "Password";
        }
        else {
            return "Feedback Score";
        }
    }

    getInitialAcceptedLabel(platform) {
        return (this.state[platform].credential_accepted ? `Import User Credentials from ${platform}` : "Awaiting Acceptance...");
    }

    getAcceptedLabelRevoke(platform) {
        return (this.state[platform].credential_accepted ? "Revoke Credential" : "Awaiting Acceptance...");
    }

    getAcceptedLabelIssue(platform) {
        return (this.state[platform].credential_accepted ? "Issue Credential" : "Awaiting Acceptance...");
    }

    getAcceptedLabelVerify(platform) {
        return (this.state[platform].verification_accepted ? "Verify Credential" : "Awaiting Acceptance...");
    }

    getDisabled(platform) {
        return (!this.state[platform].credential_accepted);
    }

    getVerifyDisabled(platform) {
        return (this.state[platform].has_been_revoked || !(this.state[platform].verification_accepted));
    }

    etsybutton() {

        if (!this.state.etsy.qr_feedbackCollected) {
            return (<Button style={{ backgroundColor: '#9b84ff' }}
                onClick={() => this.onEtsyFeedback()} disabled={this.getDisabled("etsy")}>
                {this.getInitialAcceptedLabel("etsy")}
            </Button>)
        } else if (!this.state.etsy.has_been_revoked) {
            return (<Button style={{ backgroundColor: '#9b84ff' }} disabled={this.getDisabled("etsy")}
                onClick={() => this.onRevoke()}>
                {this.getAcceptedLabelRevoke("etsy")}
            </Button>)
        } else {
            return (<Button style={{ backgroundColor: '#9b84ff' }} disabled={this.getDisabled("etsy")}
                onClick={() => this.onEtsyIssue()} >
                {this.getAcceptedLabelIssue("etsy")}
            </Button>)
        }

    }

    button() {
        if (!this.state.ebay.qr_feedbackCollected) {
            return (<Button style={{ backgroundColor: '#9b84ff' }}
                onClick={() => this.onFeedback()} disabled={this.getDisabled("ebay")}>
                {this.getInitialAcceptedLabel("ebay")}
            </Button>)
        } else if (!this.state.ebay.has_been_revoked) {
            return (<Button style={{ backgroundColor: '#9b84ff' }} disabled={this.getDisabled("ebay")}
                onClick={() => this.onRevoke()}>
                {this.getAcceptedLabelRevoke("ebay")}
            </Button>)
        } else {
            return (<Button style={{ backgroundColor: '#9b84ff' }} disabled={this.getDisabled("ebay")}
                onClick={() => this.onIssue()} >
                {this.getAcceptedLabelIssue("ebay")}
            </Button>)
        }

    }

    button2(platform) {
        return (<Button style={{ backgroundColor: '#e8624a', marginTop: '20px' }} disabled={this.getVerifyDisabled(platform)}
            onClick={() => this.onEtsyVerify()}>
            {this.getAcceptedLabelVerify("etsy")}
        </Button>)
    }

    // etsybutton2() {

    // }

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

    startLoader() {
        this.setState({
            loading: true
        });
    }

    handleFormSubmit(event) {
        event.preventDefault();
        console.log("firstname = ", this.state.firstname);
        console.log("lastname = ", this.state.lastname);
        console.log("email = ", this.state.email);
        console.log("country = ", this.state.country);
        console.log("passcode = ", this.state.passcode);

        // we want to send this info across to the user's wallet
        // call the 
        this.setState({
            qr_open: true
        });
        this.postRegister();
    }

    handleLoginFormSubmit(event) {
        event.preventDefault();

        console.log("passcode = ", this.state.passcode);

        this.postLogin();
    }

    componentDidMount() {
        console.log(">>>>>>>>>>>>>>>>>>>>>> componentDidMount: set connection_name to ", sessionStorage.getItem("name"))
        this.setState({ connection_name: sessionStorage.getItem("name") })


        const l = sessionStorage.getItem("login") === "true" ? true : false;

        if (l) {
            console.log(">>>>>>>>>>>>>>>>>>>>>> componentDidMount: set login to ", l);
            this.setState({ login: true })
        }
    }

    render() {

        let web = sessionStorage.getItem("waitingForEbayUserData");
        let wet = sessionStorage.getItem("waitingForEtsyUserData");
        if (web === "true") {
            this.ebayGetUserData();
        } else if (wet === "true") {
            this.etsyGetUserData();
        }
        const card = this.state
        return (
            <div >
                {/* The AppBar */}
                <AppBar position="static">
                    <Toolbar style={{ backgroundColor: '#812bff' }}>
                        <img style={{}} />
                        <Typography variant="h6">
                            Capena - Delega: Seller Feedback Demo
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
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Paper style={{ display: 'flex', maxWidth: '1000px', width: '500px', margin: '20px', padding: 20 }}>
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
                                <Spinner active={this.state.ebay.loading}></Spinner>
                                <TextField
                                    id="score"
                                    label="Feedback Score"
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
                                {this.button2("ebay")}
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
                                            Please enter the passcode generated for your registration credentials, or register as a new user by clicking on "Register"
                                </DialogContentText>
                                        <form noValidate autoComplete="off" onSubmit={(e) => this.handleLoginFormSubmit(e)}>
                                            <Spinner active={this.state.login_loading}></Spinner>
                                            <TextField
                                                margin="dense"
                                                id="passcode"
                                                label="Passcode"
                                                type="text"
                                                value={this.state.passcode}
                                                onChange={(e) => this.setState({ passcode: e.target.value })}
                                                fullWidth
                                            />
                                            <DialogActions>
                                                <Button onClick={() => this.handleLoginClose()} color="primary">
                                                    Cancel
                                </Button>
                                                <Button type="submit" onClick={() => this.startLoader()} color="primary">
                                                    Login
                                </Button>
                                            </DialogActions>

                                        </form>
                                        <Collapse in={this.state.collapse_open} style={{
                                            position: 'absolute',
                                            top: '40%',
                                            left: '25%',
                                            // marginTop: '10rem', 
                                            // marginLeft: '-15rem', 
                                            width: '20rem'
                                        }}>
                                            <Alert
                                                severity="error"
                                                action={
                                                    <IconButton
                                                        aria-label="close"
                                                        color="inherit"
                                                        size="small"
                                                        onClick={() => {
                                                            this.setState({ collapse_open: false })
                                                        }}
                                                    >
                                                        <CloseIcon fontSize="inherit" />
                                                    </IconButton>
                                                }
                                            >
                                                Invalid Passcode: connection not found. Please try again.
                                        </Alert>
                                        </Collapse>
                                    </DialogContent>

                                </Dialog>

                            </div>
                        </Paper>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Paper style={{ display: 'flex', maxWidth: '1000px', width: '500px', margin: '20px', padding: 20 }}>
                            <div style={{ display: 'flex', padding: '24px 24px', flexDirection: 'column', width: '100%' }}>
                                <div style={{ display: 'flex', marginBottom: '24px' }}>
                                    <Typography variant="h5" style={{ flexGrow: 1 }}>
                                        Create your Etsy Credential
                                </Typography>
                                </div>

                                <TextField
                                    id="name"
                                    label="User Name"
                                    placeholder={"what's your ebay username?"}
                                    value={card.etsyuser.UserID}
                                    // onChange={(e) => this.setState({ name: e.target.value })}
                                    style={{ marginBottom: '12px' }}
                                />
                                <Spinner active={this.state.etsy.loading}></Spinner>
                                <TextField
                                    id="count"
                                    label="Feedback Count"
                                    placeholder={"what's your feedback score?"}
                                    value={card.etsyuser.FeedbackCount}
                                    // onChange={(e) => this.setState({ score: e.target.value })}
                                    style={{ marginBottom: '12px' }}
                                />
                                <TextField
                                    id="org"
                                    label="Registration Date"
                                    //   placeholder={"where do you work?"} 
                                    value={card.etsyuser.RegistrationDate}
                                    //   onChange={(e) => this.setState({org: e.target.value})}
                                    style={{ marginBottom: '12px' }}
                                />
                                <TextField
                                    id="pfeedpercent"
                                    label="Postive Feedback Percent"
                                    placeholder={"what's your email?"}
                                    value={card.etsyuser.PositiveFeedbackPercent}
                                    //   onChange={(e) => this.setState({email: e.target.value})}
                                    style={{ marginBottom: '12px' }}
                                />


                                {this.etsybutton()}
                                {this.button2("etsy")}


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
                            </div>
                        </Paper>
                    </div>
                </div>
                <Dialog open={this.state.qr_open} onClose={() => this.setState({ qr_open: false, qr_hasClosed: true })}>
                    <DialogTitle style={{ width: "300px" }}>{this.getQRCodeLabel()}</DialogTitle>
                    <QRcode size="200" value={this.state.invite_url} style={{ margin: "0 auto", padding: "10px" }} />
                </Dialog>
            </div >
        )
    }
}