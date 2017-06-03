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
	let coordinates = [];

		connect( (err, client) => {
			if(err)
				return cb(err);
			let stateMiles = [];
			let start = legs.steps[0].start_location;

			for(let step = 0; step < numSteps; step++){


				let legsSteps = legs.steps[step]
				let startLocation = legs.steps[step].start_location;
				let endLocation = legs.steps[step].end_location;

				findState(startLocation, (err, state) => {
					if(!err){
							let aState = state;
							findState(endLocation,(err, state) => {
								if(!err){
									if(aState !== state){
										let targetPoints = decode(legsSteps);
										//console.log(targetPoints.length)

										for(let i = 0; i < targetPoints.length; i++){

											let coordinates = { lat: targetPoints[i][0],lng: targetPoints[i][1]}

											findState(coordinates, (err,state) => {
												if(!err){
													if(state !== aState){
														console.log(aState, state)
														getStateMiles(start, coordinates, (err, miles) => {
															if(!err){
																stateMiles.push({ state: aState, miles: miles })
																let start = coordinates;
																console.log('....', stateMiles, coordinates)
																aState = state;
															//	throw new Error('error')

															}
														})

													}
												}
											})

										}

									}

								}

						  })
					}
				})

			}
	})
}

const findState = (coordinates, cb) => {

		let queryString = `SELECT stusps FROM tl_2009_us_state WHERE ST_CONTAINS(wkb_geometry, ST_GeomFromText('point( ${ coordinates.lng } ${ coordinates.lat })',4269))`;

				_client.query(queryString, (err,result) => {
					if(err)
						return cb(err);
					if(result.rows.length){
						let state = result.rows[0]['stusps'].trim();
						cb(null,state)
					}
				})
	// })
}


const getStateMiles = (start, end, cb) => {

let url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + start.lat + "," + start.lng + "&destinations=" + end.lat + "," + end.lng + "&mode=driving&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g";

	getDistance(url, (error, response, body) => {

		if (!error && response.statusCode == 200){
			let result = JSON.parse(body)
			let miles = result.rows[0].elements[0].distance.text;
			cb(null,miles);

		}
	})

}


const decode = (legsSteps) => {
		let str = legsSteps.polyline.points
		let index = 0,
			lat = 0,
			lng = 0,
			coordinates = [],
			shift = 0,
			result = 0,
			byte = null,
			latitude_change,
			longitude_change,
			factor = Math.pow(10, 5)

		while (index < str.length){
			byte = null;
			shift = 0;
			result = 0;

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
			coordinates.push([lat / factor, lng / factor]);

		}
		return coordinates;
}



// 	let result = JSON.parse(body);
// 	let startState = result.routes[0].legs[0].start_address.split(", ")[1].trim();
// 	let endState = result.routes[0].legs[0].end_address.split(", ")[1].trim();
// 	let numSteps = result.routes[0].legs[0].steps.length;
// 	let legs = result.routes[0].legs[0];
// 	let coordinates = [];


// 	for(let step = 0; step < numSteps; step++){
// 		let str = legs.steps[step].polyline.points
// 		let index = 0,
// 			lat = 0,
// 			lng = 0,
// 	//		coordinates = [],
// 			shift = 0,
// 			result = 0,
// 			byte = null,
// 			latitude_change,
// 			longitude_change,
// 			factor = Math.pow(10, 5)

// 		while (index < str.length){
// 			byte = null;
// 			shift = 0;
// 			result = 0;

// 			do {
// 				byte = str.charCodeAt(index++) - 63;
// 				result |= (byte & 0x1f) << shift;
// 				shift += 5;
// 			} while ( byte >= 0x20 );

// 			latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
// 			shift = result = 0;

// 			do {
// 				byte = str.charCodeAt(index++) - 63;
// 				result |= (byte & 0x1f) << shift;
// 				shift += 5;
// 			} while (byte >= 0x20);

// 			longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
// 			lat += latitude_change;
// 			lng += longitude_change;
// 			coordinates.push([lat / factor, lng / factor]);
// 		}
// 	}
// console.log(coordinates)
// }
	// checkState(startState, endState, coordinates, (err, states) => {
	// 		if(err)
	// 			console.log('error in checkState', err);
	// 		console.log('.from checkState.......states', states);
	// 	  cb(err, states);
	// })

// }



const checkState = (startState, endState, coordinates, cb) => {

	connect( (err, client) => {

		if(err)
			return cb(err);
			let cnt = 0;
			let stateMiles = [];
			let startLat = coordinates[0][0];
			let startLng = coordinates[0][1];
			//coordinates.length= 2320 newark - stamford: 2320 steps 3 states
			//step 862 there is NJ bocomes NY
		for(let i = 0; i < 20; i++){
			let lat = coordinates[i][0];
			let lng = coordinates[i][1];
			let queryString = `SELECT stusps FROM tl_2009_us_state WHERE ST_CONTAINS(wkb_geometry, ST_GeomFromText('point( ${ lng } ${ lat })',4269))`;

			console.log('outside client.query i', i);

			client.query(queryString, (err,result) => {
				console.log('inside client.query i', i);
				if(err)
					return cb(err);
				if(result.rows.length){
					let state = result.rows[0]['stusps'].trim();
					cb(null,state)
					//console.log('state startState, i', state,startState, i);
					// if(state != startState){
					// 	//console.log('states old, new,endState,i', startState, state,endState,i);
					// 	tempState = startState;
					// 	startState = state;

					// 		let url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + startLat + "," + startLng + "&destinations=" + lat + "," + lng + "&mode=driving&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g";

					// 	if (state == endState){
					// 			let endLat = coordinates[coordinates.length - 1][0];
					// 			let endLng = coordinates[coordinates.length - 1][1];
					// 			//console.log('....endLat, endLng', endLat, endLng)
					// 			url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + lat + "," + lng + "&destinations=" + endLat + "," + endLng + "&mode=driving&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g";
					// 	}
					// 	startLat = lat;
					// 	startLng = lng;

					// 	getStateMiles(url, (err, miles) => {

					// 		if(!err){
					// 			stateMiles.push({ state: tempState, miles });

					// 			if (state == endState){
					// 				let endLat = coordinates[coordinates.length - 1][0];
					// 				let endLng = coordinates[coordinates.length - 1][1];
					// 				//console.log('....endLat, endLng', endLat, endLng)
					// 				url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + lat + "," + lng + "&destinations=" + endLat + "," + endLng + "&mode=driving&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g";

					// 				getStateMiles(url, (err, miles) => {
					// 					if(!err)
					// 						stateMiles.push({ state: endState, miles });
					// 					cb(null,stateMiles)
					// 				})

					// 			}
					// 		}
					// 	})
					// }

		  	}

		 //cb(null, dataPoints.stateMiles)
	   	})
		}

  })
}





module.exports = decodePoints;


