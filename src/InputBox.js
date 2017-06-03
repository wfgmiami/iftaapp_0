import React,{ Component } from 'react';
import axios from 'axios';

class InputBox extends Component{

	constructor(){
		super();

		this.state = {
			startDestination: [],
			nextDestination: []
		}

		this.autoCompleteInput = this.autoCompleteInput.bind(this);
	}

	autoCompleteInput(){
		let autocomplete =[];
		let inputs = document.getElementsByClassName('form-control destin');
		let inputCount = document.getElementsByClassName('form-control destin').length;

		const autocompleteOptions = {
			types: ['(cities)'],
 		    componentRestrictions: { country: "us" }
		}

		for(let i = 0; i < inputCount; i++){
			let googleAutoComplete = new google.maps.places.Autocomplete(inputs[i], autocompleteOptions);
			autocomplete.push(googleAutoComplete);

			googleAutoComplete.addListener('place_changed', (i) => {
				if(this.props.markers.length !== this.props.numDestination && this.props.markers.length !== 0){
                 this.props.removeMarker(this.props.numDestination);
				}

	  			const place = googleAutoComplete.getPlace();
				const address = place.formatted_address;

				if (this.props.markers.length === 0){
					this.setState({ startDestination: address })
				}else{
					this.setState({ nextDestination: address })
				}




				if(this.state.startDestination.length && this.state.nextDestination.length){

				    let url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + this.state.startDestination  + "&destination=" + this.state.nextDestination + "&key=AIzaSyBQ9sJrwFDMV8eMfMsO9gXS75XTNqhq43g"
						console.log(url)
					let request = {
						origin: this.state.startDestination,
						destination: this.state.nextDestination,
						travelMode: 'DRIVING'
					}
					this.props.renderRoute(request, url);

				}

				const position = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
				this.props.addMarker({ address, position });
			})
		}

	}

	componentDidMount(){
		this.autoCompleteInput();
	}

	componentWillUnmount(){
		this.props.removeMarker(this.props.numDestination );
	}

	render(){

		return (
			<div>
				<b>Destination { this.props.numDestination - 1 ?  this.props.numDestination - 1 : null }</b>
				<input className="form-control destin" id={ this.props.numDestination } >
				</input>
				<br />
			</div>
		)
	}
}

export default InputBox;
