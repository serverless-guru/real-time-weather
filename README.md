# Realtime Weather Application with AWS IoT

## What

Creating a realtime weather application with AWS IoT :)

## Setup

### Install Dependencies

```bash
yarn
```

### Create a .env file

```bash
REACT_APP_IDENTITY_POOL_ID='us-west-2:<identity_pool_id>'
REACT_APP_REGION='us-west-2'
REACT_APP_USER_POOL_ID='<user_pool_id>'
REACT_APP_USER_POOL_WEB_CLIENT_ID='<user_pool_app_client_id>'
REACT_APP_MQTT_ID='<mqtt_id>'
```

### Start local server

```bash
yarn start
```

## Connection with AWS Amplify

### Install Dependencies

```bash
yarn add aws-amplify
```

### Copy code into App.js

```js
import React, { Component } from 'react';
import './App.css';

import Amplify, { PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';

Amplify.configure({
  Auth: {
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
  }
});

Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: process.env.region,
  aws_pubsub_endpoint: `wss://${process.env.REACT_APP_MQTT_ID}.iot.${process.env.REACT_APP_REGION}.amazonaws.com/mqtt`,
}));

PubSub.subscribe('real-time-weather').subscribe({
  next: data => console.log('Message received', data),
  error: error => console.error(error),
  close: () => console.log('Done'),
});

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>Realtime Weather</h1>
        <p>Check the console..</p>
      </div>
    );
  }
}

export default App;
```

## Connection with aws-iot-sdk

### Install aws-iot-sdk

```bash
yarn add aws-iot-device-sdk
```

### Copy code into App.js

```js
const AWS = require('aws-sdk');
const AWSIoTData = require('aws-iot-device-sdk');

let awsConfig = {
  identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
  mqttEndpoint: `${process.env.REACT_APP_MQTT_ID}.iot.${process.env.REACT_APP_REGION}.amazonaws.com`,
  region: process.env.REACT_APP_REGION,
  clientId: process.env.clientId,
  userPoolId: process.env.REACT_APP_USER_POOL_ID
};

const mqttClient = AWSIoTData.device({
  region: awsConfig.region,
  host: awsConfig.mqttEndpoint,
  clientId: awsConfig.clientId,
  protocol: 'wss',
  maximumReconnectTimeMs: 8000,
  debug: false,
  accessKeyId: '',
  secretKey: '',
  sessionToken: ''
});

AWS.config.region = awsConfig.region;

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: awsConfig.identityPoolId
});

AWS.config.credentials.get((err) => {
    if (err) {
        console.log(AWS.config.credentials);
        throw err;
    } else {
        mqttClient.updateWebSocketCredentials(
            AWS.config.credentials.accessKeyId,
            AWS.config.credentials.secretAccessKey,
            AWS.config.credentials.sessionToken
        );
    }
});

mqttClient.on('connect', () => {
  console.log('mqttClient connected')
  mqttClient.subscribe('real-time-weather')
});

mqttClient.on('error', (err) => {
  console.log('mqttClient error:', err)
  login()
});

mqttClient.on('message', (topic, payload) => {
  const msg = JSON.parse(payload.toString());
  console.log('mqttClient message: ', msg);
});

class App extends Component {
    render() {
        return (
            <div className="App">
                <h1>Realtime Weather</h1>
                <p>Check the console..</p>
            </div>
        );
    }
}

export default App;
```