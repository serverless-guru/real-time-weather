import React, { Component } from 'react';
import './App.css';

// import uuidv4 from 'uuid/v4'

import Amplify, { PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import request from 'request';

Amplify.configure({
  Auth: {
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    region: process.env.REACT_APP_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
  }
});

Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: process.env.REACT_APP_REGION,
  aws_pubsub_endpoint: `wss://${process.env.REACT_APP_MQTT_ID}.iot.${process.env.REACT_APP_REGION}.amazonaws.com/mqtt`,
}));

class App extends Component {
  constructor(props) {
    super(props);

    this.state = this.getInitialState();
  }

  getInitialState = () => {
    let state = {
      loading: true,
      // userMessage: "",
      // incomingMessage: "",
      data: false,
      error: false,
      closed: false,
      zip: false,
      celsius: false,
      fahrenheit: false,
    };
    return state;
  };

  // publishMessage = () => {
  //   Amplify.PubSub.publish('real-time-weather', { message: this.state.userMessage, msgId: uuidv4() });
  // }

  getCurrentWeather = () => {
    request(`${process.env.REACT_APP_API_URL}/api/weather?zipCode=97205`, (error, response, body) => {
      if(error) {
        this.setState({ error });
      } else {
        body = JSON.parse(body);
        let weather = JSON.parse(JSON.parse(body.Item.weather));
        console.log(weather)
        let zip = body.Item.zip;
        let celsius = weather.list[0].main.temp - 273;
        let fahrenheit = Math.floor(celsius * (9/5) + 32);
        this.setState({ zip, celsius, fahrenheit, loading: false });
      }
    });
  }

  componentDidMount = () => {
    this.setState({ loading: true });
    this.getCurrentWeather();
    Amplify.PubSub.subscribe('real-time-weather').subscribe({
      next: data => {
        let weather = JSON.parse(data.value.weather);
        console.log(weather)
        let zip = data.value.zip;
        let celsius = weather.list[0].main.temp - 273;
        let fahrenheit = Math.floor(celsius * (9/5) + 32);
        this.setState({ zip, celsius, fahrenheit, loading: false });
      },
      error: error => this.setState({ error }),
      close: () => this.setState({ closed: true }),
    });
  }

  handleChange = (e) => {
    this.setState({[e.target.name]: e.target.value});
  }

  render = () => {
    if (this.state.loading) {
      return <h1>Loading..</h1>
    } else if (this.state.error) {
      return <h1>Error..</h1>
    }
    return (
      <div className="App">
        <h1>Realtime Portland Weather</h1>
        {/* <input type="text" id="message" value={this.state.userMessage} onChange={this.handleChange} name="userMessage"/>
        <button onClick={this.publishMessage}>Publish Message</button> */}
        <p>ZipCode: {this.state.zip ? this.state.zip : ""}</p>
        <p>{this.state.celsius ? `${this.state.celsius} °C` : ""}</p>
        <p>{this.state.fahrenheit ? `${this.state.fahrenheit} °F` : ""}</p>
        <p>{this.state.weather ? this.state.weather : ""}</p>
      </div>
    );
  }
};

export default App;
