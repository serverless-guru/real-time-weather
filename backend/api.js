'use strict';

const AWS = require('aws-sdk');

const api = {};

const tableName = process.env.TABLE_NAME;

api.handler = async (event, context) => {
  console.log('event', event);
  let response = {};
  try {
    let data = {};
    let path = event.path;
    if(path.includes('weather')) {
      data = await api.handleWeather(event);
    }
    response.statusCode = 200;
    response.body = JSON.stringify(data);
  } catch (error) {
    response.statusCode = 500;
    response.body = JSON.stringify(error);
  }
  response.headers = { 'Access-Control-Allow-Origin': '*' };
  console.log('response: ', response);
  return response;
};

api.handleWeather = async (event) => {
  if (event.httpMethod === "GET") {
    return await api.getCurrentWeatherData({ zip: event.queryStringParameters.zipCode });
  } else {
    throw new Error(`event method not known ${event.httpMethod}`);
  }
};

api.getCurrentWeatherData = (key) => {
  return new Promise((resolve, reject) => {
    let documentClient = new AWS.DynamoDB.DocumentClient();

    let params = {
      TableName: tableName,
      Key: key
    };
    
    documentClient.get(params, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

module.exports = api;
