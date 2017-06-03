const pg = require('pg');
const connectionString = ("postgres://mapdata:mapdata1@geodata.cj5r5b9wgtmp.us-west-2.rds.amazonaws.com/geodatadb")
const client = new pg.Client(connectionString);
const getDistance = require('request');


let _client;
const connect = (cb) => {
	if(_client)
		return cb(null, _client);
	client.connect(err => {
		if(!err){
			_client = client;
			return cb(null, _client);
		}
	})
}


const decodePoints = (body, cb) => {

 	let result = JSON.parse(body);
 	let startState = result.routes[0].legs[0].start_address.split(", ")[1].trim();
 	let endState = result.routes[0].legs[0].end_address.split(", ")[1].trim();
 	let numSteps = result.routes[0].legs[0].steps.length;
 	let legs = result.routes[0].legs[0];
	let startPoint = result.routes[0].legs[0].start_location;
    let endPoint = result.routes[0].legs[0].end_location;
	let checkPoint = [];
	let stateMiles = [];

	connect( (err, client) => {
		if(err) cb(err);

		for( let step = 0; step < numSteps; step++ ){
			let str = legs.steps[step].polyline.points
			let index = 0,
				lat = 0,
				lng = 0,
				shift = 0,
				result = 0,
				byte = null,
				latitude_change,
				longitude_change,
				factor = Math.pow(10, 5),
				coordinates = []

			while (index < str.length){
				byte = null;
				shift = 0;
				result = 0;
				checkPoint[step] = [];

				do {
					byte = str.charCodeAt(index++) - 63;
					result |= (byte & 0x1f) << shift;
					shift += 5;
				} while ( byte >= 0x20 );

				latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
				shift = result = 0;

				do {
					byte = str.charCodeAt(index++) - 63;
					result |= (byte & 0x1f) << shift;
					shift += 5;
				} while (byte >= 0x20);

				longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lat += latitude_change;
				lng += longitude_change;
				coordinates.push({ lat: lat/factor, lng: lng/factor });
				//checkPoint[step] = { lat: lat/factor, lng: lng/factor };
				
			//	if(step === 6){
			//		console.log('checkPoint', checkPoint[step]);
			//	}
/*
				findState(checkPoint[step], step, (err, state) => {
					if(!err){
				//		console.log(state,startState);
						
						if( state !== startState){
						console.log('step,currentState,startState,lat/lng in newState:',step,state,startState,checkPoint[step]);
						
						throw new Error('eror');
						stateMiles.push({ state: startState, startPoint: startPoint, endPoint: checkPoint[step] })

							if(state == endState){

								stateMiles.push({ state: endState, startPoint: checkPoint[step], endPoint: endPoint })
								//console.log('before cb...stateMiles.', stateMiles)
								cb(null, stateMiles)
							}

								startPoint = checkPoint[step];
								startState = state;
						}
					}
				})
*/				
			}
			coordinates.forEach( coordinate => {
				findState(coordinate, (err, state) => {
					if(!err){
				//		console.log(state,startState);
						
						if( state !== startState){
//						console.log('step,currentState,startState,lat/lng in newState:',step,state,startState, coordinate);
						
					//	throw new Error('eror');
						stateMiles.push({ state: startState, startPoint: startPoint, endPoint: coordinate })

							if(state == endState){

								stateMiles.push({ state: endState, startPoint: coordinate, endPoint: endPoint })
								//console.log('before cb...stateMiles.', stateMiles)
								cb(null, stateMiles)
							}

								startPoint = coordinate;
								startState = state;
						}
					}
				})
			})
			coordinates = [];
		}
  })
}


const findState = (coordinates, cb) => {
	let queryString = `SELECT stusps FROM tl_2009_us_state WHERE ST_CONTAINS(wkb_geometry, ST_GeomFromText('point( ${ coordinates.lng } ${ coordinates.lat })',4269))`;

				client.query(queryString, (err,result) => {
					if(err)
						return cb(err);
					if(result.rows.length){
						let state = result.rows[0]['stusps'].trim();
			 			//console.log(state,queryString);
						cb(null,state)
					}
				})
}

const getStateMiles = (data, cb) => {
	let milesByState = [];
	let state;
	let cnt = data.length;
	let track = 0;

	for(let i = 0; i < cnt; i++){
		let lat = data[i].startPoint.lat;
		let lng = data[i].startPoint.lng;
		let endLat = data[i].endPoint.lat;
		let endLng = data[i].endPoint.lng;

		let url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + lat + "," + lng + "&destinations=" + endLat + "," + endLng + "&mode=driving&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g";
		//console.log('in getStateMiles url: ',url);
		getDistance(url, i, (error, response, body) => {
			state = data[i].state;

			if (!error && response.statusCode == 200){
				let result = JSON.parse(body)
				let miles = result.rows[0].elements[0].distance.text;
				milesByState.push({ state: state, miles: miles });
				track++;

				if( track === cnt ){
			   		//console.log('i, cnt, milesByState', i,cnt,milesByState);
					cb(null, milesByState);
				}
			}

		})

	}
}


module.exports = {
	decodePoints,
	getStateMiles
}

