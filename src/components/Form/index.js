import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/es/Typography/Typography";
import { TextField } from "@material-ui/core";
import Spinner from '../Spinner';


const Form = ({ parent, items, loading, card, title, platform }) => {
    const getButton = () => {
        if (platform === "ebay") {
            return parent.button();
        } else if (platform === "etsy") {
            return parent.etsybutton();
        } else if (platform === "uber") {
            return parent.uberbutton()
        } else if (platform === "amazon") {
            return parent.amazonbutton()
        }
    }

    const getLogo = () => {
        if (platform === "ebay") {
            return (
                <img style={{ marginLeft: '127px', marginTop: '-50px', height: '170px', width: '180px' }} src='ebay.png' />
            )
        } else if (platform === "etsy") {
            return (
                <img style={{ marginLeft: '193px', height: '60px', width: '120px' }} src='etsy.png' />
            )
        } else if (platform === "uber") {
            return (
                <img style={{ float: 'right', marginLeft: '179px', marginTop: '-45px', height: '128px', width: '120px' }} src='uber2.png' />
            )
        } else if (platform === "amazon") {
            return (
                <img style={{ float: 'right', marginLeft: '143px', marginTop: '-45px', height: '128px', width: '120px' }} src='amazon3.png' />
            )
        } else if (platform === "upwork") {
            return (
                <img style={{ float: 'right', marginLeft: '143px', marginTop: '-45px', height: '104px', width: '132px' }} src='upwork2.png' />
            )
        } else if (platform === "twitter") {
            return (
                <img style={{ float: 'right', marginLeft: '143px', marginTop: '-14px', height: '51px', width: '120px' }} src='twitter.png' />
            )
        }
    }

    const getDivStyle = () => {
        if (platform === "ebay") {
            return ({ display: 'flex', marginBottom: '-65px' })
        } else if (platform === "etsy") {
            return ({ display: 'flex', marginBottom: '-3px' })
        } else if (platform === "uber") {
            return ({ display: 'flex', marginBottom: '-40px' })
        }
    }

    const setFieldValue = (event) => {
        if (platform === "ebay") {
            parent.setEbayFieldValue(event);
        } else if (platform === "etsy") {
            parent.setEtsyFieldValue(event);
        } else if (platform === "uber") {
            parent.setUberFieldValue(event);
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9 }}>
            <Paper style={{ display: 'flex', maxWidth: '1000px', width: '650px'}}>
                <div style={{ display: 'flex', padding: '24px 24px', flexDirection: 'column', width: '100%' }}>
                    <div style={getDivStyle()}>
                        <Typography variant="h5" style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex' }}>
                                <div>
                                    {title}
                                </div>
                                <div>
                                    {getLogo()}
                                </div>
                            </div>

                        </Typography>
                    </div>

                    <Spinner active={loading}></Spinner>
                    {items.map(item => (
                        <TextField
                            name={item.id}
                            disabled={item.disabled}
                            label={item.label}
                            value={card[item.id]}
                            onChange={setFieldValue}
                            style={{ marginBottom: '12px' }}
                        />
                    ))}
                    {getButton()}
                </div>
            </Paper>
        </div>
    );
}

export default Form;