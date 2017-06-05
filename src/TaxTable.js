import React, { Component } from 'react';
import taxTable from '../ifta_tax_table.json';

class TaxTable extends Component{
	constructor(props){
		super();
		this.state = {

			mpg:[6],
			taxPaidGallons:[],
			taxableGallons:[],
			netTaxableGallons:[],
			taxCreditDue:[],
			totalDue:[],
			// taxRate:{NY:0.3815, NJ:0.334, CT:0.417, PA:0.747, OH:0.28, MA:0.24, IN:0.27, IL:0.334, DE:0.22, MD:0.3425, DC:0.235, NC:0.3455, SC:0.1675, TX:0.2},
			taxRate: taxTable,
			tableTaxRate:[]

		}

		this.onMpgAdd = this.onMpgAdd.bind(this);
		this.onTaxPaidGallonsAdd = this.onTaxPaidGallonsAdd.bind(this);
}


	onMpgAdd(ev){

		(isNaN(ev.target.value)|| ev.target.value == 0) ? ev.target.value = "" : ev.target.value = Number((ev.target.value*1).toFixed(2));

		for(let i = 0; i < this.props.milesTable.length; i++){
			this.state.tableTaxRate[i] = this.state.taxRate[this.props.milesTable[i].state];
			this.state.taxableGallons[i] = (this.props.milesTable[i].miles / ev.target.value == Infinity ? 0 : this.props.milesTable[i].miles / ev.target.value);
			this.state.netTaxableGallons[i] = this.state.taxableGallons[i] - this.state.taxPaidGallons[i];
			this.state.taxCreditDue[i] = this.state.netTaxableGallons[i] * this.state.tableTaxRate[i];
		}

		let totalDue = this.state.taxCreditDue.reduce( (total, tax) => { return total += tax }, 0);
		totalDue = totalDue.toFixed(2)*1;

		this.setState({ totalDue });
		this.setState({ mpg: ev.target.value });
		//console.log('state after mpg update', this.state);
	}

	onTaxPaidGallonsAdd(ev){

	 	let taxPaidGallons = 0;
		isNaN(ev.target.value) ? taxPaidGallons : taxPaidGallons = Number((ev.target.value*1).toFixed(2));

		for(let i = 0; i < this.props.milesTable.length; i++){
			let taxRate = Number(this.state.taxRate.filter( obj => obj.state == this.props.milesTable[i].state )[0].tax);
			this.state.tableTaxRate[i] = taxRate ? taxRate : 0;
			this.state.taxableGallons[i] = Number((this.props.milesTable[i].miles / this.state.mpg).toFixed(2));
		}

		this.state.netTaxableGallons[ev.target.id] = this.state.taxableGallons[ev.target.id] - taxPaidGallons;
		this.state.taxPaidGallons[ev.target.id] = taxPaidGallons;
		//console.log( this.state.netTaxableGallons[ev.target.id], this.state.tableTaxRate[ev.target.id],this.state.netTaxableGallons[ev.target.id]*this.state.tableTaxRate[ev.target.id])

		this.state.taxCreditDue[ev.target.id] = this.state.netTaxableGallons[ev.target.id] * this.state.tableTaxRate[ev.target.id];
		let totalDue = this.state.taxCreditDue.reduce( (total, tax) => { return total += tax }, 0);
		totalDue = totalDue.toFixed(2)*1;
		this.setState({ totalDue });
		//console.log('state after paidGallonsAdd', this.state);
	}

	render(){

		return(
			<div className="col-xs-7">
				<table>
					<thead>
						<tr>
							<th className="size">State</th>
							<th className="size">IFTA miles</th>
							<th className="size">MPG { ' ' } <input type="text" className="size" value={ this.state.mpg } onChange={ this.onMpgAdd }></input></th>
							<th className="size">Taxable gallons</th>
							<th className="size">Tax paid gallons</th>
							<th className="size">Net taxable gallons</th>
							<th className="size">Tax rate</th>
							<th className="size">Tax (credit) due</th>
						</tr>

					</thead>

					<tbody>
						{ this.props.milesTable.length ?
							this.props.milesTable.map( (stateMiles, index) => {
							let taxRate = Number(this.state.taxRate.filter( obj => obj.state == stateMiles.state )[0].tax);

							return (
								<tr key={ index } >
									<td className="item">
										{ stateMiles.state }
									</td>
									<td className="item">
										{ stateMiles.miles }
									</td>
									<td className="item">
										{ this.state.mpg }
									</td>

									<td id={ index } className="item">
										{ stateMiles && this.state.mpg.length ? Number(stateMiles.miles/this.state.mpg).toFixed(2) : null }
									</td>

									<td id="taxPaidGallons" className="item">
										<input type="text" className="form-control" value={ this.state.taxPaidGallons[index] } id={ index } onChange={ this.onTaxPaidGallonsAdd } ></input>
									</td>

									<td id="netTaxableGallons" className="item">
										{ typeof(this.state.taxableGallons[index])==='number' && typeof(this.state.taxPaidGallons[index])==='number' ? ((this.state.taxableGallons[index] - this.state.taxPaidGallons[index]).toFixed(2) == Infinity ? null : (this.state.taxableGallons[index] - this.state.taxPaidGallons[index]).toFixed(2)) : null }
									</td>

									<td id="taxRate" className="item">
										{ taxRate ? taxRate : 0 }
									</td>

									<td id="taxCreditDue" className="item">
										{ (this.state.netTaxableGallons[index] && taxRate) ? ((this.state.netTaxableGallons[index]) * ( taxRate ) == Infinity ? null : (this.state.netTaxableGallons[index] * taxRate).toFixed(2)) : (!taxRate ? 0 : null) }
									</td>

								</tr>
							)
						})
						: null }

					</tbody>
					{ this.props.milesTable.length ? (
						 <tfoot>
						 	<tr>
								<td id='tdTotal' colSpan="7">Total</td>
								<td>{ this.state.totalDue }</td>
							</tr>
						 </tfoot>
					  )
					   	: null }

				</table>
			</div>

		)
	}
}

export default TaxTable;
