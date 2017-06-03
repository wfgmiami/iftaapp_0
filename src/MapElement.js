import React, { Component } from 'react';
import InputComponent from './InputComponent';
import TaxTable from './TaxTable';

import axios from 'axios';

class MapElement extends Component {

	constructor(props){
		super();
		this.state = {
			bounds: {},
			map: {},
			markers: [],
			mapOptions: {
				center: new google.maps.LatLng(38.87234, -95.96919),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoom: 4

			},
			mapDiv: {},
			milesTable: [],
			request: {},
			url: {},
			totalMiles: []
		}

		this.renderRoute = this.renderRoute.bind(this);
		this.addMarker = this.addMarker.bind(this);
		this.removeMarker = this.removeMarker.bind(this);
		this.generateRoute = this.generateRoute.bind(this);
		this.generateMileage = this.generateMileage.bind(this);
	}


	componentDidMount(){
		const mapDiv = document.getElementById("mapDiv");
		const bounds = new google.maps.LatLngBounds();
		bounds.extend(this.state.mapOptions.center);
		this.setState( { map: new google.maps.Map(mapDiv, this.state.mapOptions) });
		this.setState( { bounds } );
		this.setState( { mapDiv } );
    }

	addMarker({ address, position }){
		this.state.bounds.extend(position);
		this.state.map.fitBounds(this.state.bounds);
		let marker = new google.maps.Marker( { position: position } );
		this.state.markers.push(marker);
		marker.setMap(this.state.map);
	}

	removeMarker( index ){
	//	console.log('this.state.markers:',this.state.markers);
	//	console.log('removeMaker(index:)',index);
		this.state.markers.forEach( (marker, _index) => {
			if(_index === index )
				marker.setMap(null);
		})
		this.state.markers.splice(index,1);
	}

	renderRoute(request, url){
		this.setState( { request: request } )
		this.setState( { url: url } )
	//	console.log(this.state);
	}

	generateRoute(){
		let request = this.state.request;
		let map = this.state.map;
		let directionsService = new google.maps.DirectionsService();

		directionsService.route(request, function(result, status){
			if(status === 'OK'){
				let directionDisplay = new google.maps.DirectionsRenderer();
				directionDisplay.setMap(map);
				directionDisplay.setDirections(result);
			}
		})
	}

	generateMileage(){
		let url = this.state.url;
		axios.get('/api', { params: url })
		.then( result => {
//				console.log('result.data from /api', result.data)
				let stateMiles = [];
				let totalMiles = result.data.reduce( (memo, obj) => {
					let endPosition = obj.miles.indexOf('mi');
					let miles = Number(obj.miles.substring(0, endPosition));
					stateMiles.push({ state: obj.state, miles: miles });
					return memo += miles;
					
				},0);
				
				this.setState({ totalMiles: totalMiles });	
				this.setState({ milesTable: stateMiles });
//				console.log('this.state',this.state);
		})
	}

	render(){
		return (
		  <div className="row">
			<div id="mapDiv" className="col-xs-12" style={{ height: "350px", marginBottom: '20px' }}>
			</div>
			<InputComponent renderRoute={ this.renderRoute } markers={ this.state.markers } addMarker={ this.addMarker } removeMarker={ this.removeMarker } milesTable = { this.state.milesTable } generateMileage = { this.generateMileage} generateRoute = { this.generateRoute } totalMiles = { this.state.totalMiles }/>
			<TaxTable milesTable = { this.state.milesTable } />	
   	      </div>

		)
	}

}

export default MapElement;
