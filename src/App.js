import React, { Component } from 'react';
import './button.css';
import etsyItems from './components/Fields/etsy';
import ebayItems from './components/Fields/ebay';
import RegistrationDialog from './components/RegistrationDialog';
import LoginDialog from './components/LoginDialog';
import NavBar from './components/NavBar';
import Form from './components/Form';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import axios from 'axios';
import QRcode from 'qrcode.react';

axios.defaults.baseURL = 'https://localhost:3002/';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const muiTheme = createMuiTheme({
    typography: {
        // "fontFamily": `"Roboto", "Helvetica", "Arial", sans-serif`,
        "fontFamily": `"Lato","Arial","Helvetica","FreeSans","sans-serif"`,
        "fontSize": 14,
        "fontWeightLight": 300,
        "fontWeightRegular": 400,
        "fontWeightMedium": 500
    }
});

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
        collapse_open: false,
        login_loading: false,
        userData: {}
    };

    setCollapseClosed() {
        this.setState({
            collapse_open: false
        });
    }

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


    onEbayRevoke = async () => {
        this.setState(prevState => ({
            ebay: { ...prevState.ebay, loading: true }
        }));
        console.log("Revoking EBAY credentials...");
        await axios.post('/api/ebay/revoke', null);

        this.setState(prevState => ({
            ebay: { ...prevState.ebay, loading: false, has_been_revoked: true }
        }));
    }

    onEtsyRevoke = async () => {
        this.setState(prevState => ({
            etsy: { ...prevState.etsy, loading: true }
        }));
        console.log("Revoking ETSY credentials...");
        await axios.post('/api/etsy/revoke', null);

        this.setState(prevState => ({
            etsy: { ...prevState.etsy, loading: false, has_been_revoked: true }
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

    setEbayFieldValue = (event) => {
        const { target: { name, value } } = event;
        // this.setState(prevState => ({
        //     ebay: { ...prevState.ebay, verification_accepted: true, has_been_revoked: false }
        // }));
        console.log("this.state.user = ", this.state.user, "name = ", name, "value = ", value);
        this.setState(prevState => ({
            user: {
                ...prevState.user, [name]: value
            } 
        }));
        // setFormState({ ...user, [name]: value });

    }

    loadEbayCredentials = (resp) => {
        const ebayValues = resp.data.credentials.filter(function(credential) {
            return credential.values.Platform === "ebay";
        });

        let ebayFields;
        if (ebayValues.length > 0) {
            ebayFields = ebayValues[ebayValues.length - 1].values;

            this.setState(prevState => ({
                ebay: {
                    ...prevState.ebay, qr_feedbackCollected: true,
                    credential_accepted: true, has_been_revoked: false,
                    loading: false
                },
                user: {
                    UserID: ebayFields["User Name"],
                    FeedbackScore: ebayFields["Feedback Score"],
                    RegistrationDate: ebayFields["Registration Date"],
                    UniqueNegativeFeedbackCount: ebayFields["Negative Feedback Count"],
                    UniquePositiveFeedbackCount: ebayFields["Positive Feedback Count"],
                    PositiveFeedbackPercent: ebayFields["Positive Feedback Percent"],
                }
            }));
            sessionStorage.setItem("waitingForEbayUserData", "false");
            sessionStorage.setItem("ebayUserData", JSON.stringify(this.state.user));
        }
    }

    loadEtsyCredentials = (resp) => {
        const etsyValues = resp.data.credentials.filter(function(credential) {
            return credential.values.Platform === "etsy";
        });

        console.log(">>>>>>>>>>>>>>>> QUACK ebayValues = ", etsyValues);
        let etsyFields;
        if (etsyValues.length > 0) {
            etsyFields = etsyValues[etsyValues.length - 1].values;
            this.setState(prevState => ({
                etsy: {
                    ...prevState.etsy, qr_feedbackCollected: true,
                    credential_accepted: true, has_been_revoked: false,
                    loading: false
                },
                etsyuser: {
                    UserID: etsyFields["User Name"],
                    FeedbackCount: etsyFields["Feedback Count"],
                    RegistrationDate: etsyFields["Registration Date"],
                    PositiveFeedbackPercent: etsyFields["Positive Feedback Percent"],
                }
            }));
            sessionStorage.setItem("waitingForEtsyUserData", "false");
            sessionStorage.setItem("etsyUserData", JSON.stringify(this.state.etsyuser));
        }
    }

    postLogin = async (code) => {

        this.setState({
            login_loading: true
        });
        const loginInfo = { passcode: code };
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
            const name = resp.data.connectionContract.name;
            this.setState({
                login: true, connection_name: name, login_form_open: false
            });
            sessionStorage.setItem("name", name);
            sessionStorage.setItem("login", true);

            // TODO check to see if there are any existing issued credentials for this user
            // If so ... push the credentials back in to the forms for the correct platforms
            this.loadEbayCredentials(resp);
            this.loadEtsyCredentials(resp);
        } else {
            console.log("no connection found");
            this.setState({
                collapse_open: true
            });
        }
    }

    postRegister = async (form) => {
        const passcode = Math.floor(Math.random() * 900000) + 100000;
        const registrationInfo = {
            firstname: form.firstname,
            lastname: form.lastname,
            email: form.email,
            country: form.country,
            passcode: passcode.toString()
        }
        console.log(registrationInfo);
        const response = await axios.post('/api/register', registrationInfo);
        console.log(response);
        this.setState({ invite_url: "https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url });

        const resp = await axios.post('/api/connected', null);
        this.setState(prevState => ({
            login: true,
            connection_name: resp.data,
            qr_open: false,
            ebay: { ...prevState.ebay, credential_accepted: false },
            etsy: { ...prevState.etsy, credential_accepted: false }
        }));
        sessionStorage.setItem("name", this.state.connection_name);
        sessionStorage.setItem("login", true);
        await axios.post('/api/credential_accepted', null);
        console.log("setting login to true");

        this.setState(prevState => ({
            qr_open: false,
            login: true,
            ebay: { ...prevState.ebay, credential_accepted: true },
            etsy: { ...prevState.etsy, credential_accepted: true }
        }));
        this.setState({ login: true });
    }

    registerFormOpen = (open) => {
        this.setState({
            register_form_open: open
        });
    }

    loginFormOpen = (open) => {
        this.setState({
            login_form_open: open
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
        sessionStorage.setItem("etsyUserData", JSON.stringify(this.state.etsyuser));
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
        sessionStorage.setItem("ebayUserData", JSON.stringify(this.state.user));
    }
    etsyAuth = async () => {
        console.log("Going across to Etsy!...");
        let res;
        try {
            res = await axios.get('/auth/etsy');
        } catch (e) {
            console.log(">>>>>>>>>>>>>> e = ", e);
        }

        console.log("res.data = ", res.data);
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
            return (<Button className="registerbutton"
                onClick={() => this.onEtsyFeedback()} disabled={this.getDisabled("etsy")}>
                {this.getInitialAcceptedLabel("etsy")}
            </Button>)
        } else if (!this.state.etsy.has_been_revoked) {
            return (<Button className="revokebutton" disabled={this.getDisabled("etsy")}
                onClick={() => this.onEtsyRevoke()}>
                {this.getAcceptedLabelRevoke("etsy")}
            </Button>)
        } else {
            return (<Button className="registerbutton" disabled={this.getDisabled("etsy")}
                onClick={() => this.onEtsyIssue()} >
                {this.getAcceptedLabelIssue("etsy")}
            </Button>)
        }

    }

    button() {
        if (!this.state.ebay.qr_feedbackCollected) {
            return (<Button className="registerbutton"
                onClick={() => this.onFeedback()} disabled={this.getDisabled("ebay")}>
                {this.getInitialAcceptedLabel("ebay")}
            </Button>)
        } else if (!this.state.ebay.has_been_revoked) {
            return (<Button className="revokebutton" disabled={this.getDisabled("ebay")}
                onClick={() => this.onEbayRevoke()}>
                {this.getAcceptedLabelRevoke("ebay")}
            </Button>)
        } else {
            return (<Button className="registerbutton" disabled={this.getDisabled("ebay")}
                onClick={() => this.onIssue()} >
                {this.getAcceptedLabelIssue("ebay")}
            </Button>)
        }

    }

    ebaybutton() {
        return (<Button style={{ backgroundColor: '#e8624a', marginTop: '20px' }} disabled={this.getVerifyDisabled("ebay")}
            onClick={() => this.onVerify()}>
            {this.getAcceptedLabelVerify("ebay")}
        </Button>)
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

    setQRFormOpen(open) {
        this.setState({
            qr_open: open
        });
    }

    reloadLoginDetails() {
        this.setState({ connection_name: sessionStorage.getItem("name") })
        const l = sessionStorage.getItem("login") === "true" ? true : false;
        if (l) {
            console.log(">>>>>>>>>>>>>>>>>>>>>> componentDidMount: set login to ", l);
            this.setState({ login: true })
        }
    }

    reloadEtsyUserDetails() {
        const etsy = JSON.parse(sessionStorage.getItem("etsyUserData"));
        console.log("ETSY = ", etsy);
        if (etsy) {
            this.setState(prevState => ({
                etsyuser: { ...prevState.etsy, ...etsy },
                etsy: {
                    credential_accepted: true,
                    has_been_revoked: true,
                    qr_feedbackCollected: true
                }
            }));
        }
    }

    reloadEbayUserDetails() {
        const ebay = JSON.parse(sessionStorage.getItem("ebayUserData"));
        console.log("EBAY = ", ebay);
        if (ebay) {
            this.setState(prevState => ({
                user: { ...prevState.ebay, ...ebay },
                ebay: {
                    credential_accepted: true,
                    has_been_revoked: true,
                    loading: false,
                    qr_feedbackCollected: true
                }
            }));
        }
    }

    getLoginLabel() {
        return this.state.login ? this.state.connection_name : "Login"
    }

    componentDidMount() {
        this.reloadLoginDetails();
        this.reloadEtsyUserDetails();
        this.reloadEbayUserDetails();
    }

    render() {

        let web = sessionStorage.getItem("waitingForEbayUserData");
        let wet = sessionStorage.getItem("waitingForEtsyUserData");
        if (web === "true") {
            this.ebayGetUserData();
        } else if (wet === "true") {
            this.etsyGetUserData();
        }
        const card = this.state;

        const styles = {
            paperContainer: {
                height: '800px',
                backgroundImage: `url(${"main.jpg"})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
            }
        };

        return (
            <ThemeProvider muiTheme={muiTheme}>
                <div style={styles.paperContainer}>
                    <NavBar parent={this}></NavBar>
                    {/* The Paper */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Form
                            parent={this}
                            items={ebayItems}
                            loading={this.state.ebay.loading}
                            card={this.state.user}
                            title={"Create your eBay Credential"}
                            platform={"ebay"}>
                        </Form>
                        <Form
                            parent={this}
                            items={etsyItems}
                            loading={false}
                            card={this.state.etsyuser}
                            title={"Create your Etsy Credential"}
                            platform={"etsy"}>
                        </Form>
                    </div>
                    <LoginDialog
                        form_open={this.state.login_form_open}
                        parent={this}
                        collapse_open={this.state.collapse_open}
                        login_loading={this.state.login_loading}>
                    </LoginDialog>
                    <RegistrationDialog
                        form_open={this.state.register_form_open}
                        parent={this}>
                    </RegistrationDialog>
                    <Dialog open={this.state.qr_open} onClose={() => this.setState({ qr_open: false, qr_hasClosed: true })}>
                        <DialogTitle style={{ width: "300px" }}>{this.getQRCodeLabel()}</DialogTitle>
                        <QRcode size="200" value={this.state.invite_url} style={{ margin: "0 auto", padding: "10px" }} />
                    </Dialog>
                </div >
            </ThemeProvider>
        )
    }
}