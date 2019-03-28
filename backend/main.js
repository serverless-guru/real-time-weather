'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');
const request = require('request');

const main = {};

const zipCode = '97205';
const topicName = 'real-time-weather';
const tableName = 'real-time-weather-data';
const region = 'us-west-2';
const weatherApiId = process.env.WEATHER_API_ID;
const mqttEndpoint = `${process.env.MQTT_ID}.iot.${region}.amazonaws.com`;

main.handler = async (event, context) => {
  console.log('event', event);
  
  try {
    let weather = await main.getWeather(zipCode);
    console.log('weather', weather);
    await main.updateDynamoDB({ 'zip': zipCode, 'weather': JSON.stringify(weather) });
    await main.publishWeatherUpdates({ 'zip': zipCode, 'weather': weather });
  } catch (error) {
    console.log('error', error);
    return error;
  }
};

main.getWeather = (query) => {
  return new Promise((resolve, reject) => {
    request(`https://api.openweathermap.org/data/2.5/forecast?zip=${query}&APPID=${weatherApiId}`, (error, response, body) => {
      if(error) reject(error);
      else resolve(body);
    });
  });
};

main.publishWeatherUpdates = (payload) => {
  return new Promise((resolve, reject) => {
    let iotdata = new AWS.IotData({endpoint: mqttEndpoint});
 
    let params = {
      topic: topicName,
      payload: JSON.stringify(payload),
      qos: 0
    };
    
    iotdata.publish(params, (err, data) => {
      if(err) reject(err);
      else resolve(data);
    });
  });
};

main.updateDynamoDB = (item) => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();

    let params = {
      TableName: tableName,
      Item: item
    };
    
    documentClient.put(params, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

module.exports = main;