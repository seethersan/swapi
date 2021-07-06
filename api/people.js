'use strict';

const uuid = require('uuid');
const swapi = require('swapi-node');
const AWS = require('aws-sdk'); 

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const name = requestBody.nombre;
  const birth_year = requestBody.ano_nacimiento;
  const eye_color = requestBody.color_ojos;
  const gender = requestBody.genero;
  const hair_color = requestBody.color_pelo;
  const height = requestBody.altura;
  const mass = requestBody.peso;
  const skin_color = requestBody.color_piel;
  const homeworld = requestBody.mundoorigen;
  const films = requestBody.peliculas;
  const species = requestBody.especies;
  const starships = requestBody.naves;
  const vehicles = requestBody.vehiculos;
  const url = requestBody.url;

  if (typeof name !== 'string' || typeof birth_year !== 'string' || typeof eye_color !== 'string' || typeof gender !== 'string' || 
    typeof hair_color !== 'string' || typeof height !== 'string' || typeof mass !== 'string' || typeof skin_color !== 'string' || 
    typeof homeworld !== 'string' || typeof films !== 'object' || typeof species !== 'object' || typeof starships !== 'object' || 
    typeof vehicles !== 'object' || typeof url !== 'string') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t submit people because of validation errors.'));
    return;
  }

  submitPeopleP(peopleInfo(name, birth_year, eye_color, gender, hair_color, height, mass, skin_color, homeworld, films, species, starships, vehicles, url))
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully submitted people with name ${name}`,
          peopleId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit people with name ${name}`
        })
      })
    });
};


const submitPeopleP = people => {
  console.log('Submitting people');
  const peopleInfo = {
    TableName: process.env.PEOPLE_TABLE,
    Item: people,
  };
  return dynamoDb.put(peopleInfo).promise()
    .then(res => people);
};

const peopleInfo = (name, birth_year, eye_color, gender, hair_color, height, mass, skin_color, homeworld, films, species, starships, vehicles, url) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    name: name,
    birth_year: birth_year,
    eye_color: eye_color,
    gender: gender,
    hair_color: hair_color,
    height: height,
    mass: mass,
    skin_color: skin_color,
    homeworld: homeworld,
    films: films,
    species: species,
    starships: starships,
    vehicles: vehicles,
    url: url,
    created: timestamp,
    edited: timestamp
  };
};

module.exports.list = (event, context, callback) => {
  var params = {
      TableName: process.env.PEOPLE_TABLE,
      ProjectionExpression: "id, name"
  };

  console.log("Scanning People table.");
  const onScan = (err, data) => {

      if (err) {
          console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
          callback(err);
      } else {
          console.log("Scan succeeded.");
          return callback(null, {
              statusCode: 200,
              body: JSON.stringify({
                  peoples: data.Items
              })
          });
      }

  };

  dynamoDb.scan(params, onScan);

};

module.exports.get = (event, context, callback) => {
  const params = {
    TableName: process.env.PEOPLE_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  dynamoDb.get(params).promise()
    .then(result => {
      const response = {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error('Couldn\'t fetch people.'));
      return;
    });
};

module.exports.find = (event, context, callback) => {
  const search_name = event.pathParameters.name

  swapi.get('https://swapi.dev/api/people/?search=' + encodeURI(search_name)).then((result) => {
    if (result) {
      console.log(result);
      return {
        id: result.id,
        nombre: result.name,
        ano_nacimiento: result.birth_year,
        color_ojos: result.eye_color,
        genero: result.gender,
        color_pelo: result.hair_color,
        altura: result.height,
        peso: result.mass,
        color_piel: result.skin_color,
        mundoorigen: result.homeworld,
        peliculas: result.films,
        especies: result.species,
        naves: result.starships,
        vehiculos: result.vehicles,
        url: result.url,
        creado: result.created,
        editado: result.edited
      };
    } else {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to find people with name ${search_name}`
        })
      })
    }
  });
};