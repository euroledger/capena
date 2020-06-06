import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/es/Typography/Typography";
import { TextField } from "@material-ui/core";
import Spinner from '../Spinner';


const Form = ({ parent, items, loading, card, title, platform }) => {
    const getButton = () => {
        if (platform === "ebay") {
            return parent.button();
        } else {
            return parent.etsybutton();
        }
    }

    const getLogo = () => {
        if (platform === "ebay") {
            return (
                <img style={{ marginLeft: '20px', marginTop: '-50px', height: '170px', width: '180px' }} src='ebay.png' />
            )
        } else {
            return (
                <img style={{ marginLeft: '40px', height: '60px', width: '120px' }} src='etsy.png' />
            )
        }
    }

    const getDivStyle = () => {
        if (platform === "ebay") {
            return ({ display: 'flex', marginBottom: '-34px' })
        } else {
            return ({ display: 'flex', marginBottom: '24px' })
        }
    }

    const setFieldValue = (event) => {
        console.log("QUACK field event = ", event);
        if (platform === "ebay") {
            parent.setEbayFieldValue(event);
        } 
    }
    // const setFieldValue = (event) => {
    //     const { target: { name, value } } = event;
    //     console.log("name = ", name, "value= ", value);
    //     // setFormState({ ...form, [name]: value });
    // }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.9 }}>
            <Paper style={{ display: 'flex', maxWidth: '1000px', width: '500px', margin: '20px', padding: 20 }}>
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