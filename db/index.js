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
	let coordinates = [];

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
				factor = Math.pow(10, 5)
				//coordinates = []

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

			}
		}

		let arraySize = 100;
		let loopCount = Math.floor(coordinates.length / arraySize);
		let remainder = coordinates.length % arraySize;
		if ( remainder ) loopCount++;
		let startCount = 0;
		let adjustedCoordinates = [];
		let newArray = [];


		for (let i = 0; i < loopCount; i++){

			newArray.push(coordinates.slice(startCount, arraySize + startCount));

			startCount += arraySize;
			if(i == loopCount - 1 && remainder) startCount += remainder;
		}

		newArray.forEach( array => {
			let arrayElement = array.reduce( (arr, points) => {
				if( typeof(arr) === 'object' ){
					arr = (`${ points.lng } ${ points.lat },`);
				}else{
					arr = arr + ' ' + (`${ points.lng } ${ points.lat },`);
				}
				return arr;
			},{}).slice(0,-1);

			adjustedCoordinates.push(arrayElement);

		});

		findState(adjustedCoordinates, endState, (err, states) => {
			if(!err){
				let routeStatesPoints = produceStatesAndPoints( states );
//				console.log('.........final',routeStatesPoints)
				cb(null, routeStatesPoints);
			}else{
				 console.log(err);
			}
		})

		const produceStatesAndPoints = ( statesAndPoints ) => {

			let newArray = '';
			let combinedArray = [];
			let statesWithPoints = [];
			let finalArray = [];
			let stateMiles = [];

			// 'Ny' 'NJ' to 'NYNJ'
			for (let i = 0; i < statesAndPoints[0].states.length; i += 2 ){
				newArray = statesAndPoints[0].states[i] + statesAndPoints[0].states[i+1];
				combinedArray.push(newArray);
			}



			for (let i = 0; i < combinedArray.length; i++ ){
				obj = { states: combinedArray[i], points: statesAndPoints[0].points[i] }
				statesWithPoints.push(obj);
			}


			newArray = '';
			combinedArray = [];

			for (let i = 0; i < statesAndPoints[0].allStates.length; i+=2 ){
				newArray = statesAndPoints[0].allStates[i] + statesAndPoints[0].allStates[i+1];
				combinedArray.push(newArray);
			}

			for (let i = 0; i < combinedArray.length; i++){
				for (j = 0; j < statesWithPoints.length; j++){
					if (combinedArray[i] === statesWithPoints[j].states){
						finalArray.push( { states: combinedArray[i], points: statesWithPoints[j].points })
					}
				}
			}

			for (let i = 0; i < finalArray.length; i++){
				let separateStates = [];
				let separatePoints = finalArray[i].points.split(' ');

				stateMiles.push( { state: startState, coordinates: [ startPoint, { lng: separatePoints[0], lat: separatePoints[1] } ] })
				separateStates.push(finalArray[i].states.slice(0,2))
				separateStates.push(finalArray[i].states.slice(2));

				startState = separateStates.filter( state => state != startState );
				startPoint = { lng: separatePoints[0], lat: separatePoints[1] };

				if (startState == endState){
					  stateMiles.push({ state: endState, coordinates: [ startPoint, endPoint ] })
				}
			}

			return stateMiles;
		}

  })
}


const findState = (coordinates, endState, cb) => {
	let stateMiles = [];
	let states = [];
	let allStates = [];
	let points = [];
//	let queryString = `SELECT stusps FROM tl_2008_us_state WHERE ST_CONTAINS(wkb_geometry, ST_GeomFromText('point( ${ coordinates.lng } ${ coordinates.lat })',4269))`;
	for (let i = 0; i < coordinates.length; i++){
		let queryString = `SELECT DISTINCT name FROM ogrgeojson WHERE ST_Intersects(wkb_geometry, ST_GeomFromText('LINESTRING( ${ coordinates[i] })', 4326))`;
//	let queryString = `select ST_AsText(ST_Intersection(route.geom, state.wkb_geometry)) from (select 'SRID=4326;LINESTRING( ${ coordinates } )'::geometry as geom) as route, ogrgeojson as state`;

//	let queryString = `SELECT DISTINCT name FROM ogrgeojson WHERE ST_Intersects(wkb_geometry, ST_GeomFromText('point( ${ coordinates[i].lng } ${ coordinates[i].lat })', 4326))`;
//	let queryString = `SELECT stusps FROM tl_2008_us_state WHERE ST_CONTAINS(wkb_geometry, ST_GeomFromText('LINESTRING( ${ coordinates })',4269))`;

		client.query(queryString, (err,result) => {
			if(err)
				return cb(err);

			if(result.rows.length){
				if(result.rows.length == 2){

					for(let j = 0; j < result.rows.length; j++){
						allStates.push(result.rows[j].name)
					}

					binarySearch(coordinates[i].split(', '), result.rows, (err, result) => {
						if(err)
							return cb(err);


						for(let j = 0; j < result.states.length; j++){
							states.push(result.states[j].name)
						}

						points.push(result.points);

						if(allStates.length / 2 === points.length){
//							console.log('in return.....')
							stateMiles.push( { allStates, states, points } );
							return cb(null, stateMiles);
						}

					});
				} else if(result.rows.length > 2){
					console.log('more than 2 states......');
					throw new Error('error > 2 states');
			    }
			}
		})
	}
}

const binarySearch = (coordinates, states, cb) => {
	//console.log(coordinates.length,coordinates)
	if (coordinates.length === 2 || coordinates.length === 3)
		return cb(null, { states: states, points: coordinates[0] });
	let half = Math.floor(coordinates.length / 2);
	let halfArray = coordinates.slice(0, half);


	let queryString = `SELECT DISTINCT name FROM ogrgeojson WHERE ST_Intersects(wkb_geometry, ST_GeomFromText('LINESTRING( ${ halfArray })', 4326))`;
//	console.log(queryString)
	client.query(queryString, (err,result) => {
		if(err)
			return cb(err);

//		console.log('satest', states);
		if(result.rows.length){
			if(result.rows.length == 1){
				return (null, binarySearch(coordinates.slice(half), states, cb));
			}
//			console.log('two states call first half',states);
			return (null, binarySearch(halfArray, states, cb));
		}
	})

}

const getStateMiles = (data, cb) => {
	let milesByState = [];
	let state;
	let cnt = data.length;
	let track = 0;

	for(let i = 0; i < cnt; i++){
		let lat = data[i].coordinates[0].lat;
		let lng = data[i].coordinates[0].lng;
		let endLat = data[i].coordinates[1].lat;
		let endLng = data[i].coordinates[1].lng;

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

const pointInPolygon = (lat, lng, polygon) => {
//  const polygon = stateInfo.stateBounds;
  const n = polygon.length;

  let inside = false;

  let p1x = polygon[0].lat;
  let p1y = polygon[0].lng;

  for(let i = 0; i < n + 1; i++){
	let p2x = polygon[i%n].lat;
	let p2y = polygon[i%n].lng;

	if (lng > Math.min(p1y,p2y)) {
		if (lng <= Math.max(p1y, p2y)) {

			if (lat <= Math.max(p1x, p2x)) {
				if (p1y !== p2y){
					var xints = (lng - p1y)*(p2x - p1x) / (p2y - p1y) + p1x;
				}
				if(p1x == p2x || lat <= xints){
					inside = !inside;
				}
			}
		}

	}
	p1x = p2x;
	p1y = p2y;
  }

  return inside;
}


module.exports = {
	decodePoints,
	getStateMiles
}

